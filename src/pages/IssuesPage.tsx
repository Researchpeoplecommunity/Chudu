import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FilterPanel from '../components/FilterPanel'
import { IconCamera, IconDot, LogoMark } from '../components/icons/Icons'
import IssueListView from '../components/IssueListView'
import MapPreviewCard from '../components/MapPreviewCard'
import MapView from '../components/MapView'
import ReportDetailModal from '../components/ReportDetailModal'
import ViewToggle from '../components/ViewToggle'
import { STATUS_LABELS } from '../constants/categories'
import { computeWardList, filterListReports, SEVERITY_LABELS, type Severity } from '../lib/listData'
import { fetchReports, filterReports, subscribeReports } from '../lib/reports'
import type { MapFilters, Report, ReportStatus } from '../types'

export default function IssuesPage() {
  const location = useLocation()
  const [allReports, setAllReports] = useState<Report[]>([])
  const [filters, setFilters] = useState<MapFilters>({})
  const [view, setView] = useState<'map' | 'list'>(
    location.pathname === '/map' ? 'map' : 'list',
  )
  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [status, setStatus] = useState<ReportStatus | 'all'>('all')
  const [showDigest, setShowDigest] = useState(
    () => localStorage.getItem('chudu-digest-dismissed') !== '1',
  )
  const [lang, setLang] = useState<'en' | 'te'>(() =>
    (localStorage.getItem('chudu-lang') as 'en' | 'te') || 'en',
  )
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [previewCount, setPreviewCount] = useState(1)
  const [detailReport, setDetailReport] = useState<Report | null>(null)

  const refresh = useCallback(() => {
    fetchReports().then(setAllReports)
  }, [])

  useEffect(() => {
    refresh()
    return subscribeReports(refresh)
  }, [refresh])

  useEffect(() => {
    setView(location.pathname === '/map' ? 'map' : 'list')
  }, [location.pathname])

  const filtered = useMemo(() => {
    const hierarchyFiltered = filterReports(allReports, filters)
    return filterListReports(hierarchyFiltered, { severity, status })
  }, [allReports, filters, severity, status])

  const listEntries = useMemo(() => computeWardList(filtered), [filtered])
  const openReports = useMemo(
    () => filtered.filter((r) => r.status !== 'resolved'),
    [filtered],
  )
  const activeCount = openReports.length
  const totalCount = filtered.length

  const dismissDigest = () => {
    setShowDigest(false)
    localStorage.setItem('chudu-digest-dismissed', '1')
  }

  const toggleLang = () => {
    const next = lang === 'en' ? 'te' : 'en'
    setLang(next)
    localStorage.setItem('chudu-lang', next)
  }

  const handleReportSelect = (report: Report) => {
    const wardCount = filtered.filter((r) => r.ward_id === report.ward_id).length
    setSelectedReport(report)
    setPreviewCount(wardCount)
    setDetailReport(null)
  }

  const handleOpenDetail = () => {
    if (selectedReport) setDetailReport(selectedReport)
  }

  const handleClosePreview = () => setSelectedReport(null)

  const handleReportUpdated = () => {
    refresh()
    window.dispatchEvent(new CustomEvent('chudu:reports-updated'))
  }

  const handleFiltersChange = (next: MapFilters) => {
    setFilters(next)
    setStatus(next.status ?? 'all')
  }

  const handleStatusChange = (next: ReportStatus | 'all') => {
    setStatus(next)
    setFilters((prev) => ({
      ...prev,
      status: next === 'all' ? undefined : next,
    }))
  }

  return (
    <div className="issues-page">
      <div className="issues-toolbar">
        <div className="issues-toolbar-left">
          <span className="issues-brand">
            <LogoMark size={22} />
            Chudu
            <span className="issues-version">v0.1</span>
          </span>
        </div>
        <div className="issues-toolbar-right">
          <button type="button" className="lang-btn" onClick={toggleLang} title="Switch language">
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>
      </div>

      {showDigest && (
        <div className="digest-bar">
          <span>
            <IconDot /> Join Hyderabad&apos;s weekly water issues digest
          </span>
          <button type="button" onClick={dismissDigest} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="issues-filters">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity | 'all')}
          className="issues-select"
        >
          {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as ReportStatus | 'all')}
          className="issues-select"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        {view === 'map' && (
          <div className="map-stat-counters">
            <span className="counter active">{activeCount} Active</span>
            <span className="counter total">{totalCount} Reports</span>
          </div>
        )}

        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === 'map' && (
        <div className="issues-map-wrap">
          <details className="issues-advanced-filters">
            <summary>More filters (zone, circle, ward…)</summary>
            <FilterPanel filters={filters} onChange={handleFiltersChange} />
          </details>

          <MapView
            reports={filtered}
            className="issues-map"
            mode="choropleth"
            showBoundaries
            showCityBoundary
            mapTint
            selectedReportId={selectedReport?.id ?? null}
            onReportSelect={handleReportSelect}
          />

          {selectedReport && !detailReport && (
            <MapPreviewCard
              report={selectedReport}
              reportCount={previewCount}
              onOpenDetail={handleOpenDetail}
              onClose={handleClosePreview}
            />
          )}
        </div>
      )}

      {view === 'list' && <IssueListView entries={listEntries} />}

      {detailReport && (
        <ReportDetailModal
          report={detailReport}
          onClose={() => setDetailReport(null)}
          onUpdated={handleReportUpdated}
        />
      )}

      <Link to="/report" className="issues-report-footer">
        <IconCamera size={18} />
        {lang === 'te' ? 'సమస్య నివేదించండి' : 'Report an Issue'}
      </Link>
    </div>
  )
}
