/**
 * Netlify Function: /quality
 * Analyzes dataset quality for a given URL.
 * Supports HuggingFace dataset IDs/URLs and generic CSV URLs.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function formatBytes(bytes) {
  if (!bytes) return null
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

function parseHuggingFaceId(input) {
  // Accepts: "imdb", "user/dataset", "https://huggingface.co/datasets/imdb"
  const trimmed = input.trim()
  const match = trimmed.match(/huggingface\.co\/datasets\/([^/?#]+(?:\/[^/?#]+)?)/)
  if (match) return match[1]
  if (!trimmed.includes('://') && !trimmed.includes('www.') && trimmed.length < 120) {
    return trimmed
  }
  return null
}

function computeQualityScore(analysis) {
  let score = 100
  const issues = []

  // Missing values penalty
  if (analysis.columnStats) {
    const highMissing = analysis.columnStats.filter((c) => c.nullPercent > 20)
    const medMissing = analysis.columnStats.filter((c) => c.nullPercent > 5 && c.nullPercent <= 20)
    if (highMissing.length > 0) {
      score -= Math.min(highMissing.length * 8, 25)
      issues.push({
        severity: 'error',
        message: `${highMissing.length} column(s) have >20% missing values: ${highMissing.map((c) => c.name).join(', ')}`,
      })
    }
    if (medMissing.length > 0) {
      score -= Math.min(medMissing.length * 3, 15)
      issues.push({
        severity: 'warning',
        message: `${medMissing.length} column(s) have 5–20% missing values`,
      })
    }
  }

  // Class imbalance penalty
  if (analysis.imbalanceRatio) {
    if (analysis.imbalanceRatio > 10) {
      score -= 20
      issues.push({ severity: 'error', message: `Severe class imbalance detected (${analysis.imbalanceRatio.toFixed(1)}x ratio between majority and minority class)` })
    } else if (analysis.imbalanceRatio > 3) {
      score -= 8
      issues.push({ severity: 'warning', message: `Moderate class imbalance (${analysis.imbalanceRatio.toFixed(1)}x ratio)` })
    }
  }

  // Size checks
  if (analysis.rows != null) {
    if (analysis.rows < 100) {
      score -= 20
      issues.push({ severity: 'error', message: 'Very small dataset (<100 rows) — may not generalize well' })
    } else if (analysis.rows < 1000) {
      score -= 10
      issues.push({ severity: 'warning', message: 'Small dataset (<1000 rows) — consider data augmentation' })
    }
  }

  // Format bonus
  if (analysis.format === 'parquet') {
    issues.push({ severity: 'info', message: 'Parquet format is efficient and supports column-level statistics' })
  }

  // No issues bonus
  if (issues.filter((i) => i.severity === 'error').length === 0) {
    issues.push({ severity: 'info', message: 'No critical quality issues detected' })
  }

  return { score: Math.max(0, Math.round(score)), issues }
}

async function analyzeHuggingFace(datasetId) {
  // Step 1: Get dataset card/info
  const infoRes = await fetch(
    `https://huggingface.co/api/datasets/${datasetId}`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }
  )
  if (!infoRes.ok) {
    throw new Error(`Dataset "${datasetId}" not found on HuggingFace (${infoRes.status})`)
  }
  const info = await infoRes.json()

  // Step 2: Get viewer info (splits, sizes, features)
  let viewerInfo = null
  try {
    const viewerRes = await fetch(
      `https://datasets-server.huggingface.co/info?dataset=${encodeURIComponent(datasetId)}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (viewerRes.ok) viewerInfo = await viewerRes.json()
  } catch (_) { /* optional */ }

  // Step 3: Try to get statistics for the first split
  let statsData = null
  const splits = []
  let totalRows = 0
  let totalSize = 0
  let format = 'parquet' // HuggingFace uses parquet
  let columns = 0
  let features = {}

  if (viewerInfo?.dataset_info) {
    const di = Object.values(viewerInfo.dataset_info)[0] || {}
    features = di.features || {}
    columns = Object.keys(features).length

    for (const [splitName, splitInfo] of Object.entries(di.splits || {})) {
      const rows = splitInfo.num_examples ?? splitInfo.num_rows ?? null
      const bytes = splitInfo.num_bytes ?? null
      splits.push({ name: splitName, rows })
      if (rows) totalRows += rows
      if (bytes) totalSize += bytes
    }
  }

  // Try stats endpoint for first available split
  const firstSplit = splits[0]?.name || 'train'
  const firstConfig = viewerInfo?.dataset_info ? Object.keys(viewerInfo.dataset_info)[0] : 'default'
  try {
    const statsRes = await fetch(
      `https://datasets-server.huggingface.co/statistics?dataset=${encodeURIComponent(datasetId)}&config=${firstConfig}&split=${firstSplit}`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (statsRes.ok) statsData = await statsRes.json()
  } catch (_) { /* optional */ }

  // Build column stats from statistics response
  const columnStats = []
  let classDistribution = []
  let imbalanceRatio = null

  if (statsData?.statistics) {
    for (const colStat of statsData.statistics) {
      const name = colStat.column_name
      const type = colStat.column_type

      let nullPercent = 0
      if (colStat.column_statistics?.nan_count != null && totalRows > 0) {
        nullPercent = (colStat.column_statistics.nan_count / (splits[0]?.rows || totalRows)) * 100
      } else if (colStat.column_statistics?.null_count != null && splits[0]?.rows) {
        nullPercent = (colStat.column_statistics.null_count / splits[0].rows) * 100
      }
      columnStats.push({ name, type, nullPercent })

      // Class distribution for categorical/bool/string columns
      if (
        (type === 'class_label' || type === 'string_label' || type === 'bool') &&
        colStat.column_statistics?.frequencies
      ) {
        const freqs = colStat.column_statistics.frequencies
        const total = Object.values(freqs).reduce((a, b) => a + b, 0)
        if (total > 0) {
          const dist = Object.entries(freqs)
            .map(([label, count]) => ({ label, count, percent: (count / total) * 100 }))
            .sort((a, b) => b.count - a.count)
          if (dist.length >= 2 && classDistribution.length === 0) {
            classDistribution = dist
            imbalanceRatio = dist[0].count / dist[dist.length - 1].count
          }
        }
      }
    }
  }

  // Determine format from features
  const hasParquet = true // HuggingFace always uses parquet now
  if (hasParquet) format = 'parquet'

  const analysis = {
    name: datasetId,
    description: info.description?.slice(0, 300) || info.cardData?.pretty_name || null,
    url: `https://huggingface.co/datasets/${datasetId}`,
    source: 'huggingface',
    rows: totalRows || null,
    columns: columns || null,
    format,
    size: totalSize || null,
    sizeHuman: formatBytes(totalSize) || null,
    splits: splits.length > 0 ? splits : null,
    columnStats: columnStats.length > 0 ? columnStats : null,
    classDistribution: classDistribution.length > 0 ? classDistribution : null,
    imbalanceRatio,
    license: info.cardData?.license || null,
    languages: (info.cardData?.language || []).slice(0, 5),
    tags: (info.tags || []).slice(0, 8),
  }

  const { score, issues } = computeQualityScore(analysis)
  return { ...analysis, qualityScore: score, issues }
}

async function analyzeGenericUrl(rawUrl) {
  // For generic URLs, try HEAD request to get content type and size
  let contentType = null
  let contentLength = null

  try {
    const headRes = await fetch(rawUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
    })
    contentType = headRes.headers.get('content-type') || null
    const cl = headRes.headers.get('content-length')
    if (cl) contentLength = parseInt(cl, 10)
  } catch (_) { /* ignore */ }

  let format = 'unknown'
  if (contentType?.includes('csv') || rawUrl.endsWith('.csv')) format = 'csv'
  else if (rawUrl.endsWith('.parquet')) format = 'parquet'
  else if (rawUrl.endsWith('.json') || contentType?.includes('json')) format = 'json'
  else if (rawUrl.endsWith('.xlsx') || rawUrl.endsWith('.xls')) format = 'excel'
  else if (rawUrl.endsWith('.zip') || contentType?.includes('zip')) format = 'zip'

  const urlParts = rawUrl.split('/')
  const name = urlParts[urlParts.length - 1] || rawUrl

  const analysis = {
    name,
    description: 'External dataset — limited analysis available for non-HuggingFace URLs.',
    url: rawUrl,
    source: 'external',
    rows: null,
    columns: null,
    format,
    size: contentLength,
    sizeHuman: formatBytes(contentLength),
    splits: null,
    columnStats: null,
    classDistribution: null,
    imbalanceRatio: null,
  }

  const { score, issues } = computeQualityScore(analysis)
  // Add info about limited analysis
  issues.unshift({ severity: 'info', message: 'Full column statistics require a HuggingFace dataset URL' })

  return { ...analysis, qualityScore: score, issues }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  const { url = '' } = event.queryStringParameters || {}
  if (!url.trim()) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'url parameter is required' }),
    }
  }

  try {
    const hfId = parseHuggingFaceId(url)
    let report

    if (hfId) {
      report = await analyzeHuggingFace(hfId)
    } else {
      // Try as a direct URL
      if (!url.startsWith('http')) {
        return {
          statusCode: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Please provide a valid URL or a HuggingFace dataset ID (e.g. "imdb" or "user/dataset")' }),
        }
      }
      report = await analyzeGenericUrl(url)
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }
  } catch (err) {
    return {
      statusCode: 422,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
