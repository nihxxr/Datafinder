import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Catalogue from '../components/Catalogue'
import { Empty, ErrorNote, LoadingRows } from '../components/States'
import { searchDatasets } from '../utils/api'
import { SEARCHABLE, sourceOf } from '../lib/sources'

const SUGGESTIONS = ['image classification', 'sentiment analysis', 'medical imaging', 'time series forecasting', 'fraud detection', 'speech recognition', 'question answering']
const DEFAULT_SOURCES = ['huggingface', 'uci']
const SOURCE_NOTES = { kaggle: 'needs an API key, else links out', google: 'links out' }

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const activeSources = (params.get('sources') || DEFAULT_SOURCES.join(',')).split(',').filter((s) => SEARCHABLE.includes(s))

  const [draft, setDraft] = useState(q)
  const [sources, setSources] = useState(activeSources)
  const [state, setState] = useState({ loading: false, error: null, data: null })

  useEffect(() => { setDraft(q) }, [q])

  useEffect(() => {
    if (!q) { setState({ loading: false, error: null, data: null }); return }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    searchDatasets({ query: q, sources: activeSources })
      .then((data) => { if (!cancelled) setState({ loading: false, error: null, data }) })
      .catch((err) => { if (!cancelled) setState({ loading: false, error: err.message, data: null }) })
    return () => { cancelled = true }
    // activeSources is derived from params, so params covers it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const run = (query, srcs = sources) => {
    const next = query.trim()
    if (!next || srcs.length === 0) return
    setParams({ q: next, sources: srcs.join(',') })
  }

  const toggle = (id) => {
    const next = sources.includes(id) ? sources.filter((s) => s !== id) : [...sources, id]
    setSources(next)
    if (q && next.length) run(q, next)
  }

  const results = state.data?.results || []
  const failed = state.data?.errors || []

  return (
    <div className="page">
      <div className="intro">
        <h1>Find a dataset for your next model</h1>
        <p>One search across Hugging Face, the UCI Machine Learning Repository, Kaggle and Google Dataset Search.</p>
      </div>

      <form role="search" onSubmit={(e) => { e.preventDefault(); run(draft) }}>
        <div className="query">
          <label htmlFor="q" className="sr-only">Search datasets</label>
          <input
            id="q" type="search" value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="customer churn, bird species, legal contracts…" autoComplete="off" autoFocus={!q}
          />
          <button className="btn" type="submit" disabled={!draft.trim() || sources.length === 0}>Search</button>
        </div>
        <fieldset className="sources">
          <legend>Search in</legend>
          {SEARCHABLE.map((id) => (
            <label key={id} className="check" style={{ '--swatch': sourceOf(id).color }}>
              <input type="checkbox" checked={sources.includes(id)} onChange={() => toggle(id)} />
              {sourceOf(id).label}
              {SOURCE_NOTES[id] && <span className="note">({SOURCE_NOTES[id]})</span>}
            </label>
          ))}
        </fieldset>
      </form>

      {state.error && <ErrorNote>{state.error}. Check your connection and search again.</ErrorNote>}
      {failed.length > 0 && (
        <p className="alert alert-soft" role="status">
          {failed.map((f) => sourceOf(f.source).label).join(' and ')} didn&rsquo;t respond, so these results leave it out.
        </p>
      )}

      {state.loading && <LoadingRows />}

      {!state.loading && state.data && (
        results.length > 0
          ? <Catalogue rows={results} title={<>{results.filter((r) => !(r.tags || []).includes('external-search')).length} datasets <em>for &ldquo;{q}&rdquo;</em></>} />
          : <Empty title={`Nothing found for “${q}”`}>Try fewer or broader words, or switch on more sources above.</Empty>
      )}

      {!q && (
        <section className="suggest" aria-labelledby="suggest-title">
          <h2 id="suggest-title">Popular searches</h2>
          <ul className="suggest-list">
            {SUGGESTIONS.map((s) => <li key={s}><button type="button" onClick={() => run(s)}>{s}</button></li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
