// API utility — routes to Netlify functions in prod, directly in dev where possible

const BASE = import.meta.env.PROD ? '' : ''

export async function searchDatasets({ query, sources, limit = 20 }) {
  const params = new URLSearchParams({
    q: query,
    sources: sources.join(','),
    limit: String(limit),
  })
  const res = await fetch(`${BASE}/.netlify/functions/search?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Search failed' }))
    throw new Error(err.error || 'Search failed')
  }
  return res.json()
}

export async function recommendDatasets({ description, limit = 15 }) {
  const params = new URLSearchParams({ description, limit: String(limit) })
  const res = await fetch(`${BASE}/.netlify/functions/recommend?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Recommendation failed' }))
    throw new Error(err.error || 'Recommendation failed')
  }
  return res.json()
}

export async function checkQuality({ url }) {
  const params = new URLSearchParams({ url })
  const res = await fetch(`${BASE}/.netlify/functions/quality?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Quality check failed' }))
    throw new Error(err.error || 'Quality check failed')
  }
  return res.json()
}
