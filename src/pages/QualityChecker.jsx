import { useState } from 'react'
import {
  ShieldCheck, AlertCircle, Link2, CheckCircle, XCircle,
  AlertTriangle, Database, BarChart2, FileType2, Hash,
  TrendingDown, Info, ExternalLink, Activity, Layers
} from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { checkQuality } from '../utils/api'

const EXAMPLES = ['imdb', 'emotion', 'squad', 'ag_news', 'glue']

function ScoreRing({ score }) {
  const r = 38, circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : score >= 40 ? '#fb923c' : '#f87171'
  const glow = score >= 80 ? 'rgba(52,211,153,0.3)' : score >= 60 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'

  return (
    <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${glow})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>/100</span>
      </div>
    </div>
  )
}

function QualityLabel({ score }) {
  if (score >= 80) return <span style={{ color: '#34d399', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle size={13} />Excellent quality</span>
  if (score >= 60) return <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} />Good quality</span>
  if (score >= 40) return <span style={{ color: '#fb923c', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} />Fair quality</span>
  return <span style={{ color: '#f87171', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><XCircle size={13} />Poor quality</span>
}

function StatCard({ icon: Icon, label, value, accent = '#a78bfa' }) {
  if (!value && value !== 0) return null
  return (
    <div
      className="glass-card p-4 flex flex-col gap-2"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`,
      }} />
      <Icon size={16} style={{ color: accent, opacity: 0.8 }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

function MissingBar({ name, pct }) {
  const color = pct > 20 ? '#f87171' : pct > 5 ? '#fbbf24' : '#34d399'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#94a3b8', width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(pct, 100)}%`,
          background: color, borderRadius: 99,
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: `0 0 6px ${color}55`,
        }} />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: 'monospace', width: 56, textAlign: 'right', flexShrink: 0 }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

function ClassBar({ label, count, percent, maxCount }) {
  const w = (count / maxCount) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#94a3b8', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(label)}
      </span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${w}%`,
          background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
          borderRadius: 99,
          transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: '0 0 6px rgba(124,58,237,0.4)',
        }} />
      </div>
      <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', width: 70, textAlign: 'right', flexShrink: 0 }}>
        {count.toLocaleString()} <span style={{ color: '#334155' }}>({percent.toFixed(0)}%)</span>
      </span>
    </div>
  )
}

export default function QualityChecker() {
  const [url, setUrl]       = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const handleCheck = async (e) => {
    e?.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const data = await checkQuality({ url: url.trim() })
      setReport(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* ── Hero ── */}
      <div className="text-center pt-8 pb-2 animate-fade-in-scale">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}
        >
          <Activity size={11} />
          Automated quality analysis
        </div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold mb-4"
          style={{ letterSpacing: '-0.03em', color: '#f8fafc' }}
        >
          Dataset quality
          <br />
          <span className="gradient-text">at a glance</span>
        </h1>
        <p style={{ color: '#475569', fontSize: 16, maxWidth: 420, margin: '0 auto' }}>
          Paste a HuggingFace dataset ID or URL to instantly analyze missing values,
          class imbalance, size, format, and overall quality.
        </p>
      </div>

      {/* ── Input ── */}
      <form onSubmit={handleCheck} className="animate-slide-up">
        <div className="glass-card p-5 space-y-4" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, left: '25%', right: '25%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.4), transparent)',
          }} />

          <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', display: 'block' }}>
            Dataset ID or URL
          </label>
          <div className="flex gap-2">
            <div style={{ position: 'relative', flex: 1 }}>
              <Link2 size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="imdb  or  https://huggingface.co/datasets/imdb"
                className="input-field"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <button type="submit" disabled={!url.trim() || loading} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              {loading ? <LoadingSpinner size={15} /> : <ShieldCheck size={15} />}
              Analyze
            </button>
          </div>

          {/* Quick examples */}
          <div className="flex flex-wrap items-center gap-2">
            <span style={{ fontSize: 11, color: '#334155' }}>Quick:</span>
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => setUrl(ex)}
                style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'all 0.15s',
                  fontFamily: 'monospace',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </form>

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
        <div
          className="glass-card p-10 text-center space-y-4 animate-fade-in"
        >
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <ShieldCheck size={24} style={{ position: 'absolute', inset: 0, margin: 'auto', color: '#34d399' }} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Fetching dataset metadata and statistics…</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: '#334155' }}>
            {['Fetching info', 'Computing statistics', 'Scoring quality'].map((s, i) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <LoadingSpinner size={11} className="text-emerald-500" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Report ── */}
      {report && !loading && (
        <div className="space-y-4 animate-fade-in">

          {/* Overview card */}
          <div
            className="glass-card p-6"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), rgba(59,130,246,0.4), transparent)',
            }} />
            <div className="flex items-start gap-5">
              <ScoreRing score={report.qualityScore} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                    {report.name}
                  </h2>
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#475569', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                    onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <QualityLabel score={report.qualityScore} />
                {report.description && (
                  <p style={{
                    fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {report.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Hash}       label="Rows"    value={report.rows?.toLocaleString() ?? '—'}     accent="#a78bfa" />
            <StatCard icon={Layers}     label="Columns" value={report.columns ?? '—'}                    accent="#60a5fa" />
            <StatCard icon={FileType2}  label="Format"  value={report.format ?? '—'}                     accent="#34d399" />
            <StatCard icon={Database}   label="Size"    value={report.sizeHuman ?? '—'}                  accent="#fbbf24" />
          </div>

          {/* Issues */}
          {report.issues?.length > 0 && (
            <div className="glass-card p-5 space-y-3">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
                <AlertTriangle size={14} style={{ color: '#fbbf24' }} />
                Quality Report
              </h3>
              <div className="space-y-2">
                {report.issues.map((issue, i) => {
                  const color = issue.severity === 'error' ? '#f87171' : issue.severity === 'warning' ? '#fbbf24' : '#60a5fa'
                  const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Info
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13,
                        padding: '8px 12px', borderRadius: 8,
                        background: `${color}08`,
                        border: `1px solid ${color}18`,
                        color,
                      }}
                    >
                      <Icon size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      {issue.message}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Missing values */}
          {report.columnStats?.length > 0 && (
            <div className="glass-card p-5 space-y-4">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
                <TrendingDown size={14} style={{ color: '#fb923c' }} />
                Missing Values by Column
              </h3>
              <div className="space-y-3">
                {[...report.columnStats]
                  .sort((a, b) => b.nullPercent - a.nullPercent)
                  .map(col => <MissingBar key={col.name} name={col.name} pct={col.nullPercent} />)
                }
              </div>
            </div>
          )}

          {/* Class distribution */}
          {report.classDistribution?.length > 0 && (
            <div className="glass-card p-5 space-y-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <BarChart2 size={14} style={{ color: '#a78bfa' }} />
                  Class Distribution
                </h3>
                {report.imbalanceRatio && (
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 999,
                    ...(report.imbalanceRatio > 10
                      ? { background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
                      : report.imbalanceRatio > 3
                      ? { background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
                      : { background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }),
                  }}>
                    {report.imbalanceRatio > 10 ? 'Highly imbalanced' : report.imbalanceRatio > 3 ? 'Moderate imbalance' : 'Balanced'} · {report.imbalanceRatio.toFixed(1)}x
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {report.classDistribution.slice(0, 10).map(cls => (
                  <ClassBar
                    key={cls.label}
                    label={cls.label}
                    count={cls.count}
                    percent={cls.percent}
                    maxCount={report.classDistribution[0].count}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Splits */}
          {report.splits?.length > 0 && (
            <div className="glass-card p-5 space-y-4">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Database size={14} style={{ color: '#60a5fa' }} />
                Dataset Splits
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {report.splits.map(split => (
                  <div
                    key={split.name}
                    style={{
                      padding: '12px 16px', borderRadius: 10, textAlign: 'center',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#475569', textTransform: 'capitalize', marginBottom: 4 }}>{split.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>
                      {split.rows?.toLocaleString() ?? '—'}
                    </div>
                    <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>rows</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
