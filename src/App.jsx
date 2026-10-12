import { Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import QualityChecker from './pages/QualityChecker'
import Recommender from './pages/Recommender'
import Search from './pages/Search'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/recommend" element={<Recommender />} />
          <Route path="/quality" element={<QualityChecker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="page">
          Results come live from the Hugging Face, UCI and Kaggle APIs. Built by{' '}
          <a href="https://niharg-portfolio.netlify.app/">Nihar Girish</a>.
        </div>
      </footer>
    </>
  )
}
