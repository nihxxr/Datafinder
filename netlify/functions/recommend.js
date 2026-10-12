/**
 * Netlify Function: /recommend
 * Takes a plain-English problem description and returns matched datasets
 * by extracting keywords and querying HuggingFace + UCI.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

// Domain keywords mapped to HuggingFace task categories and search terms
const DOMAIN_MAP = [
  {
    patterns: /fraud|anomaly|outlier|unusual|suspicious/i,
    tasks: ['tabular-classification'],
    tags: ['fraud', 'anomaly-detection', 'finance'],
    searchTerms: ['fraud detection', 'anomaly detection'],
  },
  {
    patterns: /spam|phishing|malware|intrusion|cybersecurity/i,
    tasks: ['text-classification'],
    tags: ['cybersecurity', 'spam'],
    searchTerms: ['spam detection', 'cybersecurity'],
  },
  {
    patterns: /sentiment|opinion|review|emotion|feeling|attitude/i,
    tasks: ['text-classification', 'sentiment-analysis'],
    tags: ['sentiment', 'text-classification'],
    searchTerms: ['sentiment analysis', 'opinion'],
  },
  {
    patterns: /image|photo|picture|vision|visual|object|detect|segmen/i,
    tasks: ['image-classification', 'object-detection', 'image-segmentation'],
    tags: ['image-classification', 'computer-vision'],
    searchTerms: ['image classification', 'object detection'],
  },
  {
    patterns: /speech|audio|voice|sound|acoustic|transcri/i,
    tasks: ['automatic-speech-recognition', 'audio-classification'],
    tags: ['speech', 'audio'],
    searchTerms: ['speech recognition', 'audio classification'],
  },
  {
    patterns: /translat|multilingual|language|nmt|machine translat/i,
    tasks: ['translation'],
    tags: ['translation', 'multilingual'],
    searchTerms: ['machine translation', 'multilingual'],
  },
  {
    patterns: /question[- ]answer|qa|reading comprehension/i,
    tasks: ['question-answering'],
    tags: ['question-answering'],
    searchTerms: ['question answering', 'reading comprehension'],
  },
  {
    patterns: /summariz|abstract|news|document/i,
    tasks: ['summarization'],
    tags: ['summarization'],
    searchTerms: ['summarization', 'news articles'],
  },
  {
    patterns: /medical|health|patient|hospital|clinical|disease|diagnosis|cancer|tumor/i,
    tasks: ['tabular-classification', 'image-classification'],
    tags: ['medical', 'healthcare'],
    searchTerms: ['medical', 'healthcare', 'clinical'],
  },
  {
    patterns: /forecast|predict|time series|temporal|stock|price|sales/i,
    tasks: ['time-series-forecasting', 'tabular-regression'],
    tags: ['time-series', 'forecasting'],
    searchTerms: ['time series', 'forecasting', 'prediction'],
  },
  {
    patterns: /recommend|collaborative|preference|rating|movie|product/i,
    tasks: [],
    tags: ['recommendation'],
    searchTerms: ['recommendation system', 'collaborative filtering', 'ratings'],
  },
  {
    patterns: /regress|continuous|numeric|predict.*value|house|price|salary/i,
    tasks: ['tabular-regression'],
    tags: ['regression'],
    searchTerms: ['regression', 'price prediction'],
  },
  {
    patterns: /classif|categor|label|predict.*class/i,
    tasks: ['tabular-classification', 'text-classification'],
    tags: ['classification'],
    searchTerms: ['classification'],
  },
  {
    patterns: /cluster|segment|unsupervised|group/i,
    tasks: [],
    tags: ['clustering'],
    searchTerms: ['clustering', 'unsupervised'],
  },
  {
    patterns: /nlp|text|language model|bert|gpt|token/i,
    tasks: ['text-classification', 'token-classification'],
    tags: ['nlp', 'text'],
    searchTerms: ['nlp', 'text classification'],
  },
  {
    patterns: /reinforcement|rl|game|agent|reward|environment/i,
    tasks: [],
    tags: ['reinforcement-learning'],
    searchTerms: ['reinforcement learning', 'game environment'],
  },
  {
    patterns: /graph|network|node|edge|knowledge graph|social/i,
    tasks: ['graph-ml'],
    tags: ['graph', 'network'],
    searchTerms: ['graph', 'network data', 'social network'],
  },
]

function extractKeywords(description) {
  // Remove common filler words and extract meaningful terms
  const stopwords = new Set([
    'a','an','the','i','we','our','my','your','is','are','was','were','be','been','being',
    'have','has','had','do','does','did','will','would','could','should','may','might',
    'to','of','in','on','at','by','for','with','from','into','through','about',
    'and','or','but','so','if','then','that','this','these','those','it','its',
    'want','need','build','create','train','develop','make','use','using','based',
    'model','models','data','dataset','datasets','labels','labeled','predict','prediction',
    'machine','learning','deep','neural','network','ai','system','approach',
    'work','working','problem','task','project','real','time','large','small',
    'different','good','better','best','new','old','first','last',
  ])

  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))
    .slice(0, 8)
}

function matchDomains(description) {
  const matched = []
  for (const domain of DOMAIN_MAP) {
    if (domain.patterns.test(description)) {
      matched.push(domain)
    }
  }
  return matched
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' }
  }

  const { description = '', limit = '15' } = event.queryStringParameters || {}
  if (!description.trim()) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'description parameter is required' }),
    }
  }

  const maxResults = Math.min(parseInt(limit, 10) || 15, 40)
  const domains = matchDomains(description)
  const keywords = extractKeywords(description)

  // Build search queries from domain matches + keywords
  const searchQueries = new Set()
  for (const d of domains) {
    d.searchTerms.forEach((t) => searchQueries.add(t))
  }
  // Add top keywords as a query too
  if (keywords.length > 0) {
    searchQueries.add(keywords.slice(0, 3).join(' '))
  }
  if (searchQueries.size === 0) {
    searchQueries.add(keywords.join(' ') || 'tabular classification')
  }

  const results = []
  const seen = new Set()

  // Search HuggingFace with each query, collect unique results
  const hfPromises = [...searchQueries].slice(0, 3).map((q) =>
    searchHuggingFace(q, Math.ceil(maxResults / 2), seen, results)
  )
  const uciPromises = [...searchQueries].slice(0, 2).map((q) =>
    searchUCI(q, Math.ceil(maxResults / 3), seen, results)
  )

  await Promise.allSettled([...hfPromises, ...uciPromises])

  // Score results by relevance to description
  const scored = scoreResults(results, domains, keywords)

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      results: scored.slice(0, maxResults),
      matchedDomains: domains.map((d) => d.searchTerms[0]),
      extractedKeywords: keywords,
    }),
  }
}

function scoreResults(results, domains, keywords) {
  return results
    .map((r) => {
      let score = 0
      const text = `${r.name} ${r.description || ''} ${(r.tags || []).join(' ')} ${(r.tasks || []).join(' ')}`.toLowerCase()

      // Keyword matches
      for (const kw of keywords) {
        if (text.includes(kw)) score += 3
      }
      // Domain tag matches
      for (const domain of domains) {
        for (const tag of domain.tags) {
          if (text.includes(tag)) score += 5
        }
      }
      // Popularity boost
      if (r.downloads) score += Math.min(Math.log10(r.downloads + 1) * 2, 10)
      if (r.likes) score += Math.min(Math.log10(r.likes + 1), 5)

      return { ...r, _score: score }
    })
    .sort((a, b) => b._score - a._score)
    // eslint-disable-next-line no-unused-vars
    .map(({ _score, ...r }) => r)
}

async function searchHuggingFace(query, limit, seen, results) {
  try {
    const url = `https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&limit=${limit}&full=false&sort=downloads`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return
    const data = await res.json()
    for (const d of (Array.isArray(data) ? data : [])) {
      const key = `hf:${d.id}`
      if (seen.has(key)) continue
      seen.add(key)
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
        size: null,
      })
    }
  } catch (_) { /* ignore */ }
}

async function searchUCI(query, limit, seen, results) {
  try {
    const url = `https://archive.ics.uci.edu/api/datasets?search=${encodeURIComponent(query)}&skip=0&take=${limit}&orderBy=NumHits&ascending=false`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return
    const data = await res.json()
    for (const d of (data.data || [])) {
      const key = `uci:${d.id}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({
        id: String(d.id || d.Name),
        name: d.Name || 'Unknown',
        description: d.Abstract?.slice(0, 200) || null,
        source: 'uci',
        url: `https://archive.ics.uci.edu/dataset/${d.id}/${(d.Name || '').toLowerCase().replace(/\s+/g, '-')}`,
        downloads: d.NumHits ?? null,
        likes: null,
        lastModified: d.YearOfCreation ? `${d.YearOfCreation}-01-01` : null,
        tags: [d.SubjectArea, d.AttributeTypes].filter(Boolean),
        tasks: [d.Type].filter(Boolean),
        size: d.NumInstances ?? null,
      })
    }
  } catch (_) { /* ignore */ }
}
