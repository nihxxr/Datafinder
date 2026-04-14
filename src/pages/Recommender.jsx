import { useState } from 'react'
import { Sparkles, ArrowRight, AlertCircle, Lightbulb, Brain, ChevronRight } from 'lucide-react'
import DatasetCard from '../components/DatasetCard'
import { SkeletonCard, LoadingSpinner } from '../components/LoadingSpinner'
import { recommendDatasets } from '../utils/api'

const EXAMPLES = [
  {
    label: 'Sentiment Analysis',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
    text: 'I want to build a model that classifies customer reviews as positive, negative, or neutral.',
  },
  {
    label: 'Fraud Detection',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
    text: 'Detecting fraudulent credit card transactions in real-time from tabular financial data.',
  },
  {
    label: 'Image Classification',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.2)',
    text: 'A model that identifies plant diseases from photographs of leaves in different conditions.',
  },
  {
    label: 'Time Series',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)',
    text: 'Predicting electricity demand for the next 48 hours based on historical consumption data.',
  },
]

export default function Recommender() {
  const [description, setDescription] = useState('')
  const [results, setResults]         = useState(null)
  const [matched, setMatched]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await recommendDatasets({ description: description.trim() })
      setResults(data.results || [])
      setMatched(data.matchedDomains || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ── Hero ── */}
      <div className="text-center pt-8 pb-2 animate-fade-in-scale">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
          style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#c084fc' }}
        >
          <Brain size={11} />
          Semantic problem matching
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold mb-4"
          style={{ letterSpacing: '-0.03em', color: '#f8fafc' }}
        >
          Describe your problem,
          <br />
          <span className="gradient-text">find your dataset</span>
        </h1>
        <p style={{ color: '#475569', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>
          Write what you're trying to build — we'll extract intent, match domains,
          and surface the most relevant datasets.
        </p>
      </div>

      {/* ── Input ── */}
      <form onSubmit={handleSubmit} className="animate-slide-up">
        <div
          className="glass-card p-5 space-y-4"
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {/* Glow top */}
          <div style={{
            position: 'absolute', top: 0, left: '30%', right: '30%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)',
          }} />

          <div className="flex items-center justify-between">
            <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
              Describe your ML problem
            </label>
            <span style={{ fontSize: 11, color: '#334155' }}>
              {description.length} chars
            </span>
          </div>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="E.g. I want to build a spam classifier for short SMS messages. I need labeled examples of spam and legitimate texts across different languages."
            className="input-field"
            style={{ resize: 'none', lineHeight: 1.7, fontSize: 14 }}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!description.trim() || loading}
              className="btn-primary"
            >
              {loading ? <LoadingSpinner size={15} /> : <Sparkles size={15} />}
              {loading ? 'Matching…' : 'Find Datasets'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </form>

      {/* ── Examples ── */}
      {!results && !loading && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={13} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 11, color: '#334155', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Try an example
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {EXAMPLES.map(({ label, color, bg, border, text }) => (
              <button
                key={label}
                type="button"
                onClick={() => setDescription(text)}
                className="glass-card-hover p-4 text-left"
              >
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    color, background: bg, border: `1px solid ${border}`,
                    borderRadius: 6, padding: '2px 8px', marginBottom: 8,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                  {label}
                </span>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: '#334155' }}>
                  <span>Use this example</span>
                  <ChevronRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-4 animate-fade-in">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', color: '#a78bfa' }}
          >
            <LoadingSpinner size={15} className="text-violet-400" />
            Extracting intent and matching semantic patterns…
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {results && !loading && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1.5">
              <p style={{ fontSize: 13, color: '#475569' }}>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{results.length}</span> datasets matched
              </p>
              {matched.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {matched.map(d => (
                    <span
                      key={d}
                      style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 5,
                        background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setResults(null); setMatched([]) }}
              style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >
              Try again
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles size={36} style={{ margin: '0 auto 12px', color: '#1e293b' }} />
              <p style={{ color: '#475569', fontWeight: 500 }}>No matches found</p>
              <p style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>
                Try rephrasing with more specific keywords about your domain or task
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map(d => <DatasetCard key={`${d.source}-${d.id}`} dataset={d} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
