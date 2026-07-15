import type { IssueCategory, Report, ReportStatus, WardRecord } from '../types'
import { getCategoryMeta } from '../constants/categories'
import { getHmwssbAccountability, formatWardTag } from './wardNames'

export type Severity = 'critical' | 'high' | 'normal'

export const SEVERITY_LABELS: Record<Severity | 'all', string> = {
  all: 'All Severity',
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
}

export const CATEGORY_SEVERITY: Record<IssueCategory, Severity> = {
  no_water: 'critical',
  sewage: 'critical',
  contaminated: 'critical',
  leakage: 'high',
  manhole: 'high',
  tanker: 'normal',
  illegal_connection: 'normal',
  other: 'normal',
}

export interface WardListEntry {
  ward_id: number
  ward: string
  circle: string
  division: string
  zone: string
  corporation: string
  openCount: number
  totalCount: number
  accountableOffice: string
  reports: Report[]
}

export function getAccountableOffice(
  record: Pick<WardRecord, 'circle' | 'division' | 'zone' | 'municipal_corporation'>,
): string {
  const offices = getHmwssbAccountability(record)
  return `${offices.circleOffice} · ${offices.divisionOffice}`
}

export function computeWardList(reports: Report[]): WardListEntry[] {
  const byWard = new Map<number, Report[]>()

  for (const r of reports) {
    const list = byWard.get(r.ward_id) ?? []
    list.push(r)
    byWard.set(r.ward_id, list)
  }

  const entries: WardListEntry[] = []

  for (const [ward_id, items] of byWard) {
    const sample = items[0]
    const openCount = items.filter((r) => r.status !== 'resolved').length
    entries.push({
      ward_id,
      ward: sample.ward,
      circle: sample.circle,
      division: sample.division,
      zone: sample.zone,
      corporation: sample.municipal_corporation,
      openCount,
      totalCount: items.length,
      accountableOffice: getAccountableOffice(sample),
      reports: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    })
  }

  return entries.sort((a, b) => b.openCount - a.openCount || b.totalCount - a.totalCount)
}

export function filterListReports(
  reports: Report[],
  opts: { severity?: Severity | 'all'; status?: ReportStatus | 'all'; category?: IssueCategory },
): Report[] {
  return reports.filter((r) => {
    if (opts.severity && opts.severity !== 'all') {
      if (CATEGORY_SEVERITY[r.category] !== opts.severity) return false
    }
    if (opts.category && r.category !== opts.category) return false
    if (opts.status && opts.status !== 'all' && r.status !== opts.status) return false
    return true
  })
}

export function formatZoneTag(entry: WardListEntry): string {
  return formatWardTag(entry)
}

export function formatReportSummary(report: Report): string {
  const cat = getCategoryMeta(report.category)
  return `${cat.emoji} ${cat.label}`
}
