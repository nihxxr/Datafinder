import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ErrorNote, LoadingRows } from '../components/States'
import { checkQuality } from '../utils/api'
import { formatNumber } from '../lib/format'
import { sourceOf } from '../lib/sources'

const EXAMPLES = ['imdb', 'stanfordnlp/sst2', 'dair-ai/emotion', 'rajpurkar/squad', 'fancyzhx/ag_news']

function grade(score) {
  if (score >= 80) return { tone: 'good', label: 'Ready to use' }
  if (score >= 55) return { tone: 'warn', label: 'Usable with care' }
  return { tone: 'bad', label: 'Needs cleaning' }
}

function Bars({ items, valueText, tone }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="bars">
      {items.map((i) => (
        <li key={i.label} className="bar">
          <span className="bar-label" title={i.label}>{i.label}</span>
          <span className="bar-track"><span className={tone?.(i)} style={{ '--w': `${(i.value / max) * 100}%` }} /></span>
          <span className="bar-value">{valueText(i)}</span>
        </li>
      ))}
    </ul>
  )
}

function Report({ r }) {
  const g = grade(r.qualityScore)
  const missing = (r.columnStats || [])
    .map((c) => ({ label: c.name, value: c.nullPercent }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
  const classes = (r.classDistribution || []).slice(0, 10).map((c) => ({ label: String(c.label), value: c.count, percent: c.percent }))

  return (
    <div className="report">
      <header className="report-head">
        <div>
          <h2><a href={r.url} target="_blank" rel="noreferrer" className="mono" style={{ color: 'inherit', textDecoration: 'none' }}>{r.name}</a></h2>
          {r.description && <p className="desc">{r.description}</p>}
          <div className="meta">
            <span className="tag">{sourceOf(r.source).label}</span>
            {r.license && <span className="tag">License: {r.license}</span>}
            {(r.languages || []).map((l) => <span key={l} className="tag">{l}</span>)}
          </div>
        </div>
        <div className={`score score-${g.tone}`}>
          <p className="score-num">{r.qualityScore}<small> /100</small></p>
          <p className="score-label">{g.label}</p>
          <div className="meter" aria-hidden="true"><span style={{ '--w': `${r.qualityScore}%` }} /></div>
        </div>
      </header>

      <dl className="facts">
        <div><dt>Rows</dt><dd>{r.rows ? formatNumber(r.rows) : 'Unknown'}</dd></div>
        <div><dt>Columns</dt><dd>{r.columns ?? 'Unknown'}</dd></div>
        <div><dt>Format</dt><dd>{r.format || 'Unknown'}</dd></div>
        <div><dt>Size</dt><dd>{r.sizeHuman || 'Unknown'}</dd></div>
      </dl>

      <div className="report-cols">
        <section className="panel" aria-labelledby="issues-title">
          <h3 id="issues-title">What to watch for</h3>
          {r.issues?.length ? (
            <ul className="issues">
              {r.issues.map((i, n) => (
                <li key={n} className={`issue issue-${i.severity}`}>
                  <b>{i.severity === 'error' ? 'Problem' : i.severity === 'warning' ? 'Warning' : 'Note'}</b>
                  <span>{i.message}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No problems found in the metadata and statistics available.</p>}
        </section>

        {r.splits?.length > 0 && (
          <section className="panel" aria-labelledby="splits-title">
            <h3 id="splits-title">Splits</h3>
            <dl className="splits">
              {r.splits.map((s) => <div key={s.name}><dt>{s.name}</dt><dd>{s.rows ? s.rows.toLocaleString() : '?'} rows</dd></div>)}
            </dl>
          </section>
        )}
      </div>

      {(missing.length > 0 || classes.length > 0) && (
        <div className="report-cols">
          {missing.length > 0 && (
            <section className="panel" aria-labelledby="missing-title">
              <h3 id="missing-title">Missing values by column</h3>
              <Bars items={missing} valueText={(i) => `${i.value.toFixed(1)}%`} tone={(i) => (i.value > 20 ? 'bad' : i.value > 5 ? 'warn' : undefined)} />
            </section>
          )}
          {classes.length > 0 && (
            <section className="panel" aria-labelledby="classes-title">
              <h3 id="classes-title">Label balance</h3>
              <Bars items={classes} valueText={(i) => `${i.percent.toFixed(1)}%`} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default function QualityChecker() {
  const [params, setParams] = useSearchParams()
  const target = params.get('d') || ''
  const [draft, setDraft] = useState(target)
  const [state, setState] = useState({ loading: false, error: null, report: null })

  useEffect(() => {
    setDraft(target)
    if (!target) { setState({ loading: false, error: null, report: null }); return }
    let cancelled = false
    setState({ loading: true, error: null, report: null })
    checkQuality({ url: target })
      .then((report) => { if (!cancelled) setState({ loading: false, error: null, report }) })
      .catch((err) => { if (!cancelled) setState({ loading: false, error: err.message, report: null }) })
    return () => { cancelled = true }
  }, [target])

  const run = (value) => { const v = value.trim(); if (v) setParams({ d: v }) }

  return (
    <div className="page">
      <div className="intro">
        <h1>Check a dataset before you train on it</h1>
        <p>Paste a Hugging Face dataset ID or link to see its size, splits, missing values and label balance, scored out of 100. Other URLs get a basic file check.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(draft) }}>
        <div className="query">
          <label htmlFor="ds" className="sr-only">Dataset ID or URL</label>
          <input id="ds" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="stanfordnlp/imdb or a dataset URL" autoComplete="off" spellCheck="false" autoFocus={!target} />
          <button className="btn" type="submit" disabled={!draft.trim() || state.loading}>Check</button>
        </div>
      </form>

      {state.error && <ErrorNote>{state.error}</ErrorNote>}
      {state.loading && <LoadingRows label="Reading dataset statistics" />}
      {state.report && <Report r={state.report} />}

      {!target && (
        <section className="suggest" aria-labelledby="try-title">
          <h2 id="try-title">Try one</h2>
          <ul className="suggest-list">
            {EXAMPLES.map((ex) => <li key={ex}><button type="button" className="mono" onClick={() => run(ex)}>{ex}</button></li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
