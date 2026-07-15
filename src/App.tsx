import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import Layout from './components/Layout'
import { GpsProvider } from './context/GpsContext'
import Home from './pages/Home'
import Report from './pages/Report'
import IssuesPage from './pages/IssuesPage'
import Leaderboard from './pages/Leaderboard'
import MyReports from './pages/MyReports'
import About from './pages/About'
import { initWardLookup } from './lib/wardLookup'
import { seedDemoReports, syncOfflineQueue } from './lib/reports'

export default function App() {
  useEffect(() => {
    registerSW({ immediate: true })
    initWardLookup()
    seedDemoReports()
    syncOfflineQueue()

    const onOnline = () => syncOfflineQueue()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <GpsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="report" element={<Report />} />
            <Route path="map" element={<IssuesPage />} />
            <Route path="list" element={<IssuesPage />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="my-reports" element={<MyReports />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GpsProvider>
  )
}
