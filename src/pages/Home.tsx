import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { IconCamera } from '../components/icons/Icons'

import MapPreviewCard from '../components/MapPreviewCard'

import MapView from '../components/MapView'

import ReportDetailModal from '../components/ReportDetailModal'

import { fetchReports, subscribeReports } from '../lib/reports'

import { getCityStats } from '../lib/stats'

import type { Report } from '../types'



export default function Home() {

  const [reports, setReports] = useState<Report[]>([])

  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const [previewCount, setPreviewCount] = useState(1)

  const [detailReport, setDetailReport] = useState<Report | null>(null)

  const stats = getCityStats(reports)



  useEffect(() => {

    fetchReports().then(setReports)

    return subscribeReports(() => fetchReports().then(setReports))

  }, [])



  const openReports = reports.filter((r) => r.status !== 'resolved')



  const handleReportSelect = (report: Report) => {

    const wardCount = openReports.filter((r) => r.ward_id === report.ward_id).length

    setSelectedReport(report)

    setPreviewCount(wardCount)

    setDetailReport(null)

  }



  return (

    <div className="home-map-page">

      <div className="map-hero">

        <MapView

          reports={openReports}

          className="hero"

          mode="choropleth"

          showBoundaries

          showCityBoundary

          mapTint

          selectedReportId={selectedReport?.id ?? null}

          onReportSelect={handleReportSelect}

        />



        <div className="map-overlay map-overlay-top">

          <Link to="/report" className="btn btn-primary report-fab">

            <IconCamera size={18} />

            Report an Issue

          </Link>

        </div>



        <div className="map-overlay map-overlay-stats">

          <div className="map-stat-pill">

            <span className="num">{stats.total}</span>

            <span className="lbl">Total</span>

          </div>

          <div className="map-stat-pill resolved">

            <span className="num">{stats.resolved}</span>

            <span className="lbl">Fixed</span>

          </div>

          <div className="map-stat-pill open">

            <span className="num">{stats.open}</span>

            <span className="lbl">Open</span>

          </div>

        </div>



        {selectedReport && !detailReport && (

          <MapPreviewCard

            report={selectedReport}

            reportCount={previewCount}

            onOpenDetail={() => setDetailReport(selectedReport)}

            onClose={() => setSelectedReport(null)}

          />

        )}



        {stats.hotspot.count > 0 && !selectedReport && (

          <div className="map-overlay map-overlay-hotspot">

            Hotspot · <strong>{stats.hotspot.ward}</strong> ({stats.hotspot.count} open)

          </div>

        )}

      </div>



      <div className="home-links">

        <Link to="/map">Issues map →</Link>

        <Link to="/leaderboard">Rankings →</Link>

      </div>



      {detailReport && (

        <ReportDetailModal

          report={detailReport}

          onClose={() => setDetailReport(null)}

          onUpdated={() => {

            fetchReports().then(setReports)

            window.dispatchEvent(new CustomEvent('chudu:reports-updated'))

          }}

        />

      )}

    </div>

  )

}


