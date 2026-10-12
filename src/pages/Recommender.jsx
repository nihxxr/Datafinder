import { useState } from 'react'
import Catalogue from '../components/Catalogue'
import { Empty, ErrorNote, LoadingRows } from '../components/States'
import { recommendDatasets } from '../utils/api'

const EXAMPLES = [
  { title: 'Spam filter for SMS', text: 'I want to build a spam classifier for short SMS messages. I need labelled examples of spam and normal texts.' },
  { title: 'Card fraud', text: 'Detect fraudulent credit card transactions in tabular data where fraud is rare.' },
  { title: 'Plant disease photos', text: 'Classify plant leaf images by disease so farmers can spot problems early.' },
  { title: 'Retail demand', text: 'Forecast weekly sales for a chain of shops using past sales and holidays.' },
]

export default function Recommender() {
  const [text, setText] = useState('')
  const [state, setState] = useState({ loading: false, error: null, data: null })

  const run = async (description) => {
    const d = description.trim()
    if (d.length < 10) return
    setState({ loading: true, error: null, data: null })
    try {
      setState({ loading: false, error: null, data: await recommendDatasets({ description: d }) })
    } catch (err) {
      setState({ loading: false, error: err.message, data: null })
    }
  }

  const data = state.data
  const tooShort = text.trim().length < 10

  return (
    <div className="page">
      <div className="intro">
        <h1>Describe your project, get datasets</h1>
        <p>Say what you want to build in a sentence or two. DatasetFinder picks out the task and domain, searches Hugging Face and UCI for each, and ranks what comes back.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(text) }}>
        <div className="query query-stack">
          <label htmlFor="desc" className="sr-only">Project description</label>
          <textarea
            id="desc" value={text} onChange={(e) => setText(e.target.value)} rows={4}
            placeholder="I want to predict which customers of a telecom company will cancel their contract next month."
          />
          <div className="query-bar">
            <span className="muted" style={{ fontSize: 'var(--step--1)' }}>
              {tooShort ? 'A sentence is enough' : `${text.trim().split(/\s+/).length} words`}
            </span>
            <button className="btn" type="submit" disabled={tooShort || state.loading}>Find datasets</button>
          </div>
        </div>
      </form>

      {state.error && <ErrorNote>{state.error}. Try again in a moment.</ErrorNote>}

      {data && (
        <section className="reading" aria-labelledby="reading-title">
          <h2 id="reading-title">How your description was read</h2>
          <div className="reading-row">
            <span>Matched tasks</span>
            {data.matchedDomains?.length
              ? <span className="chips">{data.matchedDomains.map((m) => <span key={m} className="chip">{m}</span>)}</span>
              : <span className="muted">None matched, so the search used your keywords alone</span>}
          </div>
          <div className="reading-row">
            <span>Keywords</span>
            <span className="chips">{(data.extractedKeywords || []).map((k) => <span key={k} className="chip chip-plain">{k}</span>)}</span>
          </div>
        </section>
      )}

      {state.loading && <LoadingRows label="Finding datasets" />}

      {data && (data.results?.length
        ? <Catalogue rows={data.results} title={`${data.results.length} datasets ranked for your project`} />
        : <Empty title="No close matches">Add the kind of data you expect (images, text, tables) or the field you work in.</Empty>)}

      {!data && !state.loading && (
        <section className="suggest" aria-labelledby="ex-title">
          <h2 id="ex-title">Start from an example</h2>
          <ul className="suggest-cards">
            {EXAMPLES.map((ex) => (
              <li key={ex.title}>
                <button type="button" onClick={() => { setText(ex.text); run(ex.text) }}>
                  <strong>{ex.title}</strong>
                  <span>{ex.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
