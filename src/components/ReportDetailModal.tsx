import { useState } from 'react'
import { getCategoryMeta, STATUS_COLORS, STATUS_LABELS } from '../constants/categories'
import { getHmwssbAccountability, formatAdminChain } from '../lib/wardNames'
import {
  getDaysOpen,
  getDirectionsUrl,
  getReportSeverity,
  getSeenCount,
  getSeverityLabel,
  incrementSeenCount,
} from '../lib/reportMarkers'
import { updateReportStatus } from '../lib/db'
import type { Report } from '../types'

interface ReportDetailModalProps {
  report: Report
  onClose: () => void
  onUpdated?: () => void
}

export default function ReportDetailModal({ report, onClose, onUpdated }: ReportDetailModalProps) {
  const [seenCount, setSeenCount] = useState(() => getSeenCount(report.id))
  const cat = getCategoryMeta(report.category)
  const severity = getReportSeverity(report)
  const days = getDaysOpen(report)
  const isResolved = report.status === 'resolved'
  const offices = getHmwssbAccountability(report)

  const handleSeen = () => {
    setSeenCount(incrementSeenCount(report.id))
  }

  const handleResolve = async () => {
    await updateReportStatus(report.id, 'resolved')
    onUpdated?.()
    onClose()
  }

  const handleFlag = async () => {
    if (confirm('Flag this report as incorrect? It will be hidden from the public map.')) {
      await updateReportStatus(report.id, 'resolved')
      onUpdated?.()
      onClose()
    }
  }

  return (
    <div className="report-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="report-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div className="report-modal-header">
          <div className="report-modal-badges">
            {report.status !== 'resolved' && (
              <span className={`severity-badge ${severity}`}>
                {getSeverityLabel(severity)}
              </span>
            )}
            <span
              className="status-badge"
              style={{ background: STATUS_COLORS[report.status] }}
            >
              {STATUS_LABELS[report.status]}
            </span>
          </div>
          <button type="button" className="report-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <h2 id="report-modal-title" className="report-modal-title">
          {report.ward}
        </h2>
        <p className="report-modal-address">
          📍 {formatAdminChain(report)}
        </p>
        <a
          href={getDirectionsUrl(report)}
          target="_blank"
          rel="noopener noreferrer"
          className="report-modal-directions"
        >
          ↗ Get directions
        </a>

        <div className="report-modal-photo">
          <img src={report.photoDataUrl} alt={cat.label} />
          <button type="button" className="seen-btn" onClick={handleSeen}>
            👍 I&apos;ve seen this {seenCount > 0 ? `(${seenCount})` : ''}
          </button>
        </div>

        <div className="report-modal-stats">
          <div>
            <span className="stat-val">{seenCount}</span>
            <span className="stat-lbl">Also seen</span>
          </div>
          <div>
            <span className="stat-val">{days}</span>
            <span className="stat-lbl">Days</span>
          </div>
          <div>
            <span className="stat-val">{cat.emoji}</span>
            <span className="stat-lbl">{cat.label.split('/')[0].trim()}</span>
          </div>
        </div>

        {report.note && <p className="report-modal-note">{report.note}</p>}

        <div className="accountability-section">
          <h4>ACCOUNTABILITY</h4>
          <div className="accountability-tree">
            <div className="acc-node ward-node">
              Your Ward: {report.ward} · {report.zone} #{report.division}
            </div>
            <div className="acc-row">
              <div className="acc-node">
                <span className="acc-icon">🏢</span>
                <div>
                  <strong>{offices.circleOffice}</strong>
                  <p>{report.circle} Circle · HMWSSB</p>
                </div>
              </div>
              <div className="acc-node">
                <span className="acc-icon">📋</span>
                <div>
                  <strong>{offices.divisionOffice}</strong>
                  <p>Division {report.division} · HMWSSB</p>
                </div>
              </div>
            </div>
            <div className="acc-node corp-node">
              <span className="acc-badge">ZONE</span>
              <div>
                <strong>{offices.zoneOffice}</strong>
                <p>{offices.corporation}</p>
              </div>
            </div>
          </div>
        </div>

        {!isResolved && (
          <div className="report-modal-actions">
            <button type="button" className="btn-resolve" onClick={handleResolve}>
              ✓ Verify Fixed
            </button>
            <button type="button" className="btn-flag" onClick={handleFlag}>
              ⚑ Flag Incorrect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
