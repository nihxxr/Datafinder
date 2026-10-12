export function LoadingRows({ label = 'Searching' }) {
  return (
    <div className="loading-rows" role="status" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => <div key={i} />)}
    </div>
  )
}

export function ErrorNote({ children }) {
  return <p className="alert" role="alert">{children}</p>
}

export function Empty({ title, children }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      <p className="muted">{children}</p>
    </div>
  )
}
