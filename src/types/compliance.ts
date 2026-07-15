import type { Report } from '../types'

/**
 * Generic compliance record — any future record type can map into this shape
 * and appear on the map without further implementation.
 */
export interface ComplianceRecord {
  id: string
  lat: number
  lng: number
  ward_id: number
  ward: string
  circle: string
  division: string
  zone: string
  municipal_corporation: string
  status: Report['status']
  category: Report['category']
  createdAt: string
  /** Original payload for detail views / modals */
  source: Report
}

export function reportToComplianceRecord(report: Report): ComplianceRecord {
  return {
    id: report.id,
    lat: report.lat,
    lng: report.lng,
    ward_id: report.ward_id,
    ward: report.ward,
    circle: report.circle,
    division: report.division,
    zone: report.zone,
    municipal_corporation: report.municipal_corporation,
    status: report.status,
    category: report.category,
    createdAt: report.createdAt,
    source: report,
  }
}

export function complianceRecordsFromReports(reports: Report[]): ComplianceRecord[] {
  return reports.map(reportToComplianceRecord)
}

/** Zoom at which individual PIP-placed points replace clusters */
export const HIGH_ZOOM_INDIVIDUAL = 14

export type ClusterMode = 'low' | 'medium' | 'high'

export function clusterModeForZoom(zoom: number): ClusterMode {
  if (zoom >= HIGH_ZOOM_INDIVIDUAL) return 'high'
  if (zoom >= 11) return 'medium'
  return 'low'
}
