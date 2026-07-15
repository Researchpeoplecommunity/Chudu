import type { Report } from '../types'
import { formatAdminShort, formatWardTag } from '../lib/wardNames'

interface MapPreviewCardProps {
  report: Report
  reportCount?: number
  onOpenDetail: () => void
  onClose: () => void
}

export default function MapPreviewCard({
  report,
  reportCount = 1,
  onOpenDetail,
  onClose,
}: MapPreviewCardProps) {
  return (
    <div className="map-preview-card">
      <button type="button" className="map-preview-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <button type="button" className="map-preview-body" onClick={onOpenDetail}>
        <h3>{report.ward}</h3>
        <p className="map-preview-location">{formatWardTag(report)} · {report.circle}</p>
        <p className="map-preview-sub">{formatAdminShort(report)} · {report.municipal_corporation}</p>
        <p className="map-preview-count">
          {reportCount} report{reportCount !== 1 ? 's' : ''}
        </p>
        <span className="map-preview-cta">Tap for details →</span>
      </button>
    </div>
  )
}
