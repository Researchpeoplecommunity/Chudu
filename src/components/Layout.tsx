import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  IconCamera,
  IconChart,
  IconHome,
  IconInfo,
  IconMap,
  LogoMark,
} from './icons/Icons'
import GpsStatusChip from './GpsStatusChip'
import OfflineBanner from './OfflineBanner'
import InstallPrompt from './InstallPrompt'

export default function Layout() {
  const location = useLocation()
  const isIssuesPage = location.pathname === '/map' || location.pathname === '/list'
  const isHomePage = location.pathname === '/'
  const isCameraOpen = false

  return (
    <div className={`app-shell${isIssuesPage ? ' issues-layout' : ''}${isHomePage ? ' home-layout' : ''}`}>
      <OfflineBanner />
      <InstallPrompt />
      {!isIssuesPage && !isCameraOpen && (
        <header className="app-header">
          <div className="app-header-top">
            <h1>
              <LogoMark size={26} />
              Chudu
            </h1>
            <GpsStatusChip compact />
          </div>
          <p className="tagline">Chusa, Cheppa — See it. Report it. Fix it.</p>
        </header>
      )}
      <main className="app-main">
        <Outlet />
      </main>
      {!isCameraOpen && (
        <nav className="bottom-nav">
          <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
            <span className="icon">
              <IconHome />
            </span>
            Home
          </NavLink>
          <NavLink to="/report" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">
              <IconCamera />
            </span>
            Report
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">
              <IconMap />
            </span>
            Issues
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">
              <IconChart />
            </span>
            Rank
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="icon">
              <IconInfo />
            </span>
            About
          </NavLink>
        </nav>
      )}
    </div>
  )
}
