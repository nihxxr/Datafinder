import { ExternalLink, Download, Database, Star, Tag, Clock, TrendingUp, FileText } from 'lucide-react'

const SOURCE_CONFIG = {
  huggingface: {
    label: 'HuggingFace',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    text: '#fbbf24',
    dot: '#f59e0b',
  },
  kaggle: {
    label: 'Kaggle',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
    text: '#60a5fa',
    dot: '#3b82f6',
  },
  uci: {
    label: 'UCI ML',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    text: '#34d399',
    dot: '#10b981',
  },
  google: {
    label: 'Google',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    text: '#f87171',
    dot: '#ef4444',
  },
  external: {
    label: 'External',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    bg: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.25)',
    text: '#818cf8',
    dot: '#6366f1',
  },
}

function formatNumber(n) {
  if (!n && n !== 0) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatBytes(bytes) {
  if (!bytes) return null
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`
  return `${bytes} B`
}

function StatPill({ icon: Icon, value, label }) {
  if (!value && value !== 0) return null
  return (
    <div className="metric-pill">
      <Icon size={10} style={{ opacity: 0.6 }} />
      <span className="font-mono text-slate-400">{value}</span>
      {label && <span style={{ color: 'rgba(100,116,139,0.7)' }}>{label}</span>}
    </div>
  )
}

export default function DatasetCard({ dataset }) {
  const src = SOURCE_CONFIG[dataset.source] || SOURCE_CONFIG.external
  const tags = (dataset.tags || []).filter(t => t && t !== 'external-search').slice(0, 4)
  const tasks = (dataset.tasks || []).slice(0, 2)
  const isExternal = tags.includes('external-search') || dataset.tags?.includes('external-search')

  return (
    <article
      className="glass-card-hover p-5 card-enter flex flex-col gap-3"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Top glow accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: '20%', right: '20%',
          height: '1px',
          background: src.gradient,
          opacity: 0.6,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {/* Source badge */}
          <span
            className="source-badge flex-shrink-0"
            style={{ background: src.bg, color: src.text, border: `1px solid ${src.border}` }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: src.dot, flexShrink: 0 }} />
            {src.label}
          </span>
          {/* Task tags */}
          {tasks.map((t) => (
            <span
              key={t}
              className="source-badge"
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                color: '#a78bfa',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              {t.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
        <a
          href={dataset.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            padding: '6px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#475569',
            transition: 'all 0.2s',
            display: 'flex',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Title */}
      <div>
        <h3
          className="font-semibold text-sm leading-snug"
          style={{ color: '#cbd5e1', letterSpacing: '-0.01em' }}
        >
          {isExternal ? (
            <a href={dataset.url} target="_blank" rel="noopener noreferrer" className="hover:text-violet-300 transition-colors">
              {dataset.name}
            </a>
          ) : dataset.name}
        </h3>
        {dataset.description && (
          <p
            className="text-xs mt-1.5 leading-relaxed"
            style={{
              color: '#475569',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {dataset.description}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-1.5">
        <StatPill icon={Download} value={formatNumber(dataset.downloads)} label="dl" />
        <StatPill icon={Star} value={formatNumber(dataset.likes)} label="likes" />
        <StatPill
          icon={Database}
          value={formatBytes(dataset.size) || (dataset.size ? formatNumber(dataset.size) + ' rows' : null)}
        />
        {dataset.lastModified && (
          <StatPill
            icon={Clock}
            value={new Date(dataset.lastModified).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          />
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {tags.map((tag) => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
        </div>
      )}
    </article>
  )
}
