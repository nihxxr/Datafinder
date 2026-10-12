import { NavLink, Link } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Search', end: true },
  { to: '/recommend', label: 'Recommend' },
  { to: '/quality', label: 'Check quality' },
]

export default function Header() {
  return (
    <header className="masthead">
      <div className="page masthead-inner">
        <Link to="/" className="wordmark" aria-label="DatasetFinder home">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect x="1" y="2" width="20" height="4" rx="1" fill="var(--src-hf)" />
            <rect x="1" y="9" width="20" height="4" rx="1" fill="var(--src-kaggle)" />
            <rect x="1" y="16" width="13" height="4" rx="1" fill="var(--src-uci)" />
          </svg>
          DatasetFinder
        </Link>
        <nav className="tabs" aria-label="Tools">
          {TABS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <a className="masthead-link" href="https://github.com/nihxxr/Datafinder">Source on GitHub</a>
      </div>
    </header>
  )
}
