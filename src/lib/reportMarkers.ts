import type { Report } from '../types'
import { CATEGORY_SEVERITY, type Severity } from './listData'
import { formatAdminShort } from './wardNames'

export function getReportSeverity(report: Report): Severity {
  return CATEGORY_SEVERITY[report.category]
}

export function getSeverityLabel(severity: Severity): string {
  return severity === 'critical' ? 'CRITICAL' : severity === 'high' ? 'HIGH' : 'NORMAL'
}

export function getDaysOpen(report: Report): number {
  const start = new Date(report.createdAt).getTime()
  const end = report.resolvedAt ? new Date(report.resolvedAt).getTime() : Date.now()
  return Math.max(1, Math.ceil((end - start) / 86400000))
}

export function getDotColor(report: Report): string {
  if (report.status === 'resolved') return '#B3B3B3'
  const sev = getReportSeverity(report)
  if (sev === 'critical') return '#D71921'
  if (sev === 'high') return '#0A0A0A'
  if (report.status === 'in_progress') return '#666666'
  return '#888888'
}

export function getDotGlow(report: Report): boolean {
  return report.status !== 'resolved' && getReportSeverity(report) === 'critical'
}

export function formatLocationLine(report: Report): string {
  return formatAdminShort(report)
}

export function getDirectionsUrl(report: Report): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}`
}

export function getSeenCount(reportId: string): number {
  const raw = localStorage.getItem(`chudu-seen-${reportId}`)
  return raw ? Number(raw) : 0
}

export function incrementSeenCount(reportId: string): number {
  const next = getSeenCount(reportId) + 1
  localStorage.setItem(`chudu-seen-${reportId}`, String(next))
  return next
}
