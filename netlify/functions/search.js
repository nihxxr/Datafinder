/**
 * Netlify Function: /search
 * Searches HuggingFace, UCI ML, and optionally Kaggle.
 * Google Datasets is returned as a pass-through link result.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  const { q = '', sources = 'huggingface,uci', limit = '20' } = event.queryStringParameters || {}
  if (!q.trim()) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Query parameter q is required' }),
    }
  }

  const sourceList = sources.split(',').map((s) => s.trim())
  const maxResults = Math.min(parseInt(limit, 10) || 20, 50)

  const results = []
  const errors = []

  await Promise.allSettled([
    sourceList.includes('huggingface') && fetchHuggingFace(q, Math.ceil(maxResults * 0.5), results, errors),
    sourceList.includes('uci') && fetchUCI(q, Math.ceil(maxResults * 0.3), results, errors),
    sourceList.includes('kaggle') && fetchKaggle(q, Math.ceil(maxResults * 0.3), results, errors),
    sourceList.includes('google') && addGooglePassthrough(q, results),
  ].filter(Boolean))

  // Deduplicate by id within each source
  const seen = new Set()
  const deduped = results.filter((r) => {
    const key = `${r.source}:${r.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ results: deduped.slice(0, maxResults * 2), errors }),
  }
}

// ─── HuggingFace ─────────────────────────────────────────────────────────────

async function fetchHuggingFace(query, limit, results, errors) {
  try {
    const url = `https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&limit=${limit}&full=false&sort=downloads`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HuggingFace API returned ${res.status}`)
    const data = await res.json()
    const datasets = Array.isArray(data) ? data : []

    for (const d of datasets) {
      const tags = (d.tags || []).filter((t) => !t.startsWith('task_') && !t.startsWith('language:'))
      const tasks = (d.tags || []).filter((t) => t.startsWith('task_categories:')).map((t) => t.replace('task_categories:', ''))
      results.push({
        id: d.id,
        name: d.id,
        description: d.description?.slice(0, 200) || null,
        source: 'huggingface',
        url: `https://huggingface.co/datasets/${d.id}`,
        downloads: d.downloads ?? null,
        likes: d.likes ?? null,
        lastModified: d.lastModified ?? null,
        tags: tags.slice(0, 6),
        tasks: tasks.slice(0, 3),
        size: d.cardData?.dataset_info?.dataset_size ?? null,
      })
    }
  } catch (err) {
    errors.push({ source: 'huggingface', message: err.message })
  }
}

// ─── UCI ML Repository ───────────────────────────────────────────────────────

async function fetchUCI(query, limit, results, errors) {
  try {
    const url = `https://archive.ics.uci.edu/api/datasets?search=${encodeURIComponent(query)}&skip=0&take=${limit}&orderBy=NumHits&ascending=false`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`UCI API returned ${res.status}`)
    const data = await res.json()
    const datasets = data.data || []

    for (const d of datasets) {
      results.push({
        id: String(d.id || d.Name),
        name: d.Name || d.name || 'Unknown',
        description: d.Abstract?.slice(0, 200) || d.description?.slice(0, 200) || null,
        source: 'uci',
        url: `https://archive.ics.uci.edu/dataset/${d.id}/${(d.Name || '').toLowerCase().replace(/\s+/g, '-')}`,
        downloads: d.NumHits ?? null,
        likes: null,
        lastModified: d.YearOfCreation ? `${d.YearOfCreation}-01-01` : null,
        tags: [d.SubjectArea, d.AttributeTypes].filter(Boolean).slice(0, 4),
        tasks: [d.Type].filter(Boolean),
        size: d.NumInstances ?? null,
      })
    }
  } catch (err) {
    errors.push({ source: 'uci', message: err.message })
  }
}

// ─── Kaggle ──────────────────────────────────────────────────────────────────

async function fetchKaggle(query, limit, results, errors) {
  const username = process.env.KAGGLE_USERNAME
  const key = process.env.KAGGLE_KEY
  if (!username || !key) {
    // Return a "view on Kaggle" placeholder instead of failing silently
    results.push({
      id: `kaggle-search-${encodeURIComponent(query)}`,
      name: `Search "${query}" on Kaggle`,
      description: 'Kaggle has thousands of datasets. Click to search directly on their platform.',
      source: 'kaggle',
      url: `https://www.kaggle.com/search?q=${encodeURIComponent(query)}+in%3Adatasets`,
      downloads: null,
      likes: null,
      lastModified: null,
      tags: ['external-search'],
      tasks: [],
      size: null,
    })
    return
  }

  try {
    const credentials = Buffer.from(`${username}:${key}`).toString('base64')
    const url = `https://www.kaggle.com/api/v1/datasets/list?search=${encodeURIComponent(query)}&page_size=${limit}&sort_by=votes`
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${credentials}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Kaggle API returned ${res.status}`)
    const data = await res.json()

    for (const d of (data || [])) {
      results.push({
        id: d.ref || d.id,
        name: d.title || d.ref,
        description: d.subtitle?.slice(0, 200) || null,
        source: 'kaggle',
        url: `https://www.kaggle.com/datasets/${d.ref}`,
        downloads: d.downloadCount ?? null,
        likes: d.voteCount ?? null,
        lastModified: d.lastUpdated ?? null,
        tags: (d.tags || []).map((t) => t.name || t).slice(0, 5),
        tasks: [],
        size: d.totalBytes ?? null,
      })
    }
  } catch (err) {
    errors.push({ source: 'kaggle', message: err.message })
  }
}

// ─── Google Datasets (pass-through) ─────────────────────────────────────────

async function addGooglePassthrough(query, results) {
  results.push({
    id: `google-search-${encodeURIComponent(query)}`,
    name: `Search "${query}" on Google Dataset Search`,
    description: 'Google Dataset Search indexes millions of datasets from repositories across the web.',
    source: 'google',
    url: `https://datasetsearch.research.google.com/search?query=${encodeURIComponent(query)}`,
    downloads: null,
    likes: null,
    lastModified: null,
    tags: ['external-search'],
    tasks: [],
    size: null,
  })
}
