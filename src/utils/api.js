// Thin wrappers around the Netlify functions in netlify/functions.

async function call(name, params, fallbackError) {
  const res = await fetch(`/.netlify/functions/${name}?${new URLSearchParams(params)}`)
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error || fallbackError)
  return body
}

export function searchDatasets({ query, sources, limit = 20 }) {
  return call('search', { q: query, sources: sources.join(','), limit: String(limit) }, 'Search failed')
}

export function recommendDatasets({ description, limit = 15 }) {
  return call('recommend', { description, limit: String(limit) }, 'Recommendation failed')
}

export function checkQuality({ url }) {
  return call('quality', { url }, 'Quality check failed')
}
