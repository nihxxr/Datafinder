import { useState, useCallback } from 'react'
import { Search as SearchIcon, X, SlidersHorizontal, AlertCircle, Database, Zap } from 'lucide-react'
import DatasetCard from '../components/DatasetCard'
import { SkeletonCard, LoadingSpinner } from '../components/LoadingSpinner'
import { searchDatasets } from '../utils/api'

const ALL_SOURCES = [
  { id: 'huggingface', label: 'HuggingFace', color: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  { id: 'kaggle',      label: 'Kaggle',      color: '#60a5fa', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
  { id: 'uci',         label: 'UCI ML',      color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  { id: 'google',      label: 'Google',      color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
]

const EXAMPLES = [
  { q: 'image classification',    label: 'Computer Vision' },
  { q: 'sentiment analysis NLP',  label: 'NLP' },
  { q: 'tabular regression',      label: 'Tabular' },
  { q: 'medical imaging',         label: 'Healthcare' },
  { q: 'time series forecasting', label: 'Time Series' },
  { q: 'fraud detection',         label: 'Finance' },
]

export default function Search() {
  const [query, setQuery]     = useState('')
  const [sources, setSources] = useState(['huggingface', 'uci'])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      const data = await searchDatasets({ query: q, sources })
      setResults(data.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, sources])

  const runQuery = (q) => {
    setQuery(q)
    setLoading(true)
    setError(null)
    searchDatasets({ query: q, sources })
      .then(data => setResults(data.results || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const toggleSource = (id) =>
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      {!results && !loading && (
        <div className="text-center pt-10 pb-6 animate-fade-in-scale">
          {/* Floating orbs */}
          <div style={{
            position: 'absolute', left: '15%', top: '120px',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: '15%', top: '180px',
            width: 250, height: 250, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa',
            }}
          >
            <Zap size={11} />
            Search across 4 dataset repositories simultaneously
          </div>

          <h1
            className="text-5xl sm:text-6xl font-extrabold mb-5 leading-[1.1]"
            style={{ letterSpacing: '-0.03em', color: '#f8fafc' }}
          >
            Find the perfect
            <br />
            <span className="gradient-text">AI dataset</span>
          </h1>
          <p style={{ color: '#475569', fontSize: 18, maxWidth: 480, margin: '0 auto' }}>
            One search across Kaggle, HuggingFace, UCI&nbsp;ML, and
            Google&nbsp;Dataset&nbsp;Search.
          </p>
        </div>
      )}

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={17}
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }}
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search datasets… e.g. "image classification cats dogs"'
              className="input-field"
              style={{ paddingLeft: 44, paddingRight: 40, height: 50, fontSize: 15 }}
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569', padding: 4, borderRadius: 6 }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className="btn-secondary"
            style={showFilters ? { borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa', background: 'rgba(139,92,246,0.08)' } : {}}
          >
            <SlidersHorizontal size={15} />
          </button>
          <button type="submit" disabled={!query.trim() || loading} className="btn-primary" style={{ whiteSpace: 'nowrap', minWidth: 110 }}>
            {loading ? <LoadingSpinner size={15} /> : <SearchIcon size={15} />}
            Search
          </button>
        </div>

        {/* Source filter */}
        {showFilters && (
          <div
            className="glass-card p-4 flex flex-wrap items-center gap-2 animate-slide-up"
          >
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Sources
            </span>
            {ALL_SOURCES.map(({ id, label, color, bg, border }) => {
              const active = sources.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSource(id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: active ? bg : 'rgba(255,255,255,0.03)',
                    color: active ? color : '#475569',
                    border: `1px solid ${active ? border : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? color : '#334155' }} />
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </form>

      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-sm animate-fade-in"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Skeletons ── */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Results ── */}
      {results && !loading && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 13, color: '#475569' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{results.length}</span> datasets
                {query && <> for <span style={{ color: '#a78bfa' }}>"{query}"</span></>}
              </span>
              <div className="glow-divider" style={{ width: 1, height: 16 }} />
              <span style={{ fontSize: 12, color: '#334155' }}>
                {sources.map(s => ALL_SOURCES.find(x => x.id === s)?.label).filter(Boolean).join(', ')}
              </span>
            </div>
            <button
              onClick={() => { setResults(null); setQuery('') }}
              style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >
              <X size={11} /> Clear
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-20">
              <Database size={40} style={{ margin: '0 auto 12px', color: '#1e293b' }} />
              <p style={{ color: '#475569', fontWeight: 500 }}>No datasets found</p>
              <p style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>Try different keywords or enable more sources</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(d => <DatasetCard key={`${d.source}-${d.id}`} dataset={d} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Example queries ── */}
      {!results && !loading && !error && (
        <div className="animate-fade-in" style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Popular searches
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {EXAMPLES.map(({ q, label }) => (
              <button
                key={q}
                type="button"
                onClick={() => runQuery(q)}
                className="glass-card-hover p-4 text-left"
              >
                <span
                  style={{
                    display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    color: '#7c3aed', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                    borderRadius: 5, padding: '2px 7px', marginBottom: 6,
                  }}
                >
                  {label}
                </span>
                <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{q}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
