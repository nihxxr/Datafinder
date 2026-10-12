import { useMemo, useState } from 'react'
import { formatDate, formatNumber, formatSize, isExternalSearch } from '../lib/format'
import { sourceOf } from '../lib/sources'

const SORTS = [
  { id: 'relevance', label: 'Best match' },
  { id: 'downloads', label: 'Most used' },
  { id: 'updated', label: 'Recently updated' },
]

function sortRows(rows, by) {
  if (by === 'relevance') return rows
  const key = by === 'downloads' ? (d) => d.downloads ?? -1 : (d) => (d.lastModified ? Date.parse(d.lastModified) : -1)
  return [...rows].sort((a, b) => key(b) - key(a))
}

function Row({ d }) {
  const src = sourceOf(d.source)
  const external = isExternalSearch(d)
  const tags = (d.tags || []).filter((t) => t && t !== 'external-search' && !t.includes(':')).slice(0, 4)
  const tasks = (d.tasks || []).slice(0, 2)
  const showId = d.source === 'huggingface' || d.source === 'kaggle'
  const name = showId && d.id?.includes('/') ? d.id.split('/').pop() : d.name

  return (
    <tr className={external ? 'external' : undefined} style={{ '--spine': src.color }}>
      <td>
        <a className="ds-name" href={d.url} target="_blank" rel="noreferrer">{name}</a>
        {showId && d.id?.includes('/') && <span className="ds-id mono">{d.id}</span>}
        {d.description && <p className="ds-desc">{d.description}</p>}
        {(tasks.length > 0 || tags.length > 0) && (
          <div className="ds-tags">
            {tasks.map((t) => <span key={`task-${t}`} className="tag tag-task">{t.replace(/-/g, ' ')}</span>)}
            {tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        )}
      </td>
      <td className="src-cell"><span className="src" style={{ '--swatch': src.color }}>{src.label}</span></td>
      <td className="num" data-label={d.source === 'uci' ? 'Views' : 'Downloads'}>{formatNumber(d.downloads) ?? ''}</td>
      <td className="num" data-label="Size">{formatSize(d) ?? ''}</td>
      <td className="num" data-label="Updated">{formatDate(d.lastModified) ?? ''}</td>
    </tr>
  )
}

export default function Catalogue({ rows, title }) {
  const [sort, setSort] = useState('relevance')
  const [only, setOnly] = useState('all')

  const counts = useMemo(() => {
    const c = {}
    rows.forEach((r) => { c[r.source] = (c[r.source] || 0) + 1 })
    return c
  }, [rows])

  const visible = useMemo(() => {
    const filtered = only === 'all' ? rows : rows.filter((r) => r.source === only)
    const real = sortRows(filtered.filter((r) => !isExternalSearch(r)), sort)
    return [...real, ...filtered.filter(isExternalSearch)]
  }, [rows, sort, only])

  const sourceIds = Object.keys(counts)

  return (
    <section aria-label="Results">
      <div className="summary">
        <h2>{title}</h2>
        <div className="controls">
          {sourceIds.length > 1 && (
            <div className="seg" role="group" aria-label="Filter by source">
              <button type="button" aria-pressed={only === 'all'} onClick={() => setOnly('all')}>All {rows.length}</button>
              {sourceIds.map((id) => (
                <button key={id} type="button" aria-pressed={only === id} onClick={() => setOnly(id)}>
                  {sourceOf(id).label} {counts[id]}
                </button>
              ))}
            </div>
          )}
          <div className="seg" role="group" aria-label="Sort">
            {SORTS.map((s) => (
              <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      <table className="catalogue">
        <thead>
          <tr>
            <th scope="col">Dataset</th>
            <th scope="col">Source</th>
            <th scope="col" className="num">Downloads</th>
            <th scope="col" className="num">Size</th>
            <th scope="col" className="num">Updated</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((d) => <Row key={`${d.source}:${d.id}`} d={d} />)}
        </tbody>
      </table>
    </section>
  )
}
