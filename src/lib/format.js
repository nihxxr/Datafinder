export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return null
  const v = Number(n)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`
  return String(v)
}

export function formatBytes(bytes) {
  if (!bytes) return null
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

// UCI reports size as instance counts; HuggingFace and Kaggle report bytes.
export function formatSize(dataset) {
  if (dataset.size === null || dataset.size === undefined) return null
  if (dataset.source === 'uci') return `${formatNumber(dataset.size)} rows`
  return formatBytes(dataset.size)
}

export function formatDate(iso, now = new Date()) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const days = Math.floor((now - d) / 86_400_000)
  if (days < 1) return 'today'
  if (days < 31) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return String(d.getFullYear())
}

export function isExternalSearch(dataset) {
  return (dataset.tags || []).includes('external-search')
}
