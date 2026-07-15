export type IssueCategory =
  | 'no_water'
  | 'leakage'
  | 'manhole'
  | 'sewage'
  | 'contaminated'
  | 'tanker'
  | 'illegal_connection'
  | 'other'

export type ReportStatus = 'open' | 'in_progress' | 'resolved'

export interface WardRecord {
  ward_id: number
  ward: string
  circle: string
  division: string
  zone: string
  municipal_corporation: string
}

export interface HierarchyNested {
  [corporation: string]: {
    [zone: string]: {
      [division: string]: {
        [circle: string]: string[]
      }
    }
  }
}

export interface Report {
  id: string
  category: IssueCategory
  status: ReportStatus
  note?: string
  photoDataUrl: string
  lat: number
  lng: number
  ward_id: number
  ward: string
  circle: string
  division: string
  zone: string
  municipal_corporation: string
  deviceId: string
  phone?: string
  address?: string
  pincode?: string
  gpsAccuracy?: number
  createdAt: string
  resolvedAt?: string
  synced: boolean
}

export interface MapFilters {
  corporation?: string
  zone?: string
  division?: string
  circle?: string
  ward_id?: number
  category?: IssueCategory
  status?: ReportStatus
  dateFrom?: string
  dateTo?: string
}

export type LeaderboardLevel = 'zone' | 'circle' | 'division'

export interface LeaderboardEntry {
  key: string
  label: string
  corporation: string
  zone: string
  division: string
  circle?: string
  openCount: number
  totalCount: number
  resolvedCount: number
  resolvedPercent: number
  avgResolutionHours: number | null
}
