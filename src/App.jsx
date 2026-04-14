import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Search from './pages/Search'
import Recommender from './pages/Recommender'
import QualityChecker from './pages/QualityChecker'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          <Routes>
            <Route path="/"        element={<Search />} />
            <Route path="/recommend" element={<Recommender />} />
            <Route path="/quality"   element={<QualityChecker />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <footer
        style={{
          textAlign: 'center',
          padding: '24px 16px',
          fontSize: 12,
          color: '#1e293b',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        DatasetFinder &mdash; Powered by HuggingFace, UCI ML, Kaggle & Google Dataset APIs
      </footer>
    </div>
  )
}
