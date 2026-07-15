import imageCompression from 'browser-image-compression'
import {
  addToQueue,
  getAllReports,
  getQueue,
  removeFromQueue,
  saveReport,
} from './db'
import type { IssueCategory, MapFilters, Report, ReportStatus } from '../types'
import { randomUUID } from './uuid'

const DEVICE_KEY = 'chudu-device-id'
const RATE_KEY = 'chudu-rate-limit'

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function checkRateLimit(): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now()
  const raw = localStorage.getItem(RATE_KEY)
  const history: number[] = raw ? JSON.parse(raw) : []
  const hourAgo = now - 60 * 60 * 1000
  const recent = history.filter((t) => t > hourAgo)

  if (recent.length >= 5) {
    const oldest = recent[0]
    const waitMs = oldest + 60 * 60 * 1000 - now
    return { allowed: false, waitMinutes: Math.ceil(waitMs / 60000) }
  }
  return { allowed: true }
}

function recordSubmission(): void {
  const now = Date.now()
  const raw = localStorage.getItem(RATE_KEY)
  const history: number[] = raw ? JSON.parse(raw) : []
  history.push(now)
  localStorage.setItem(RATE_KEY, JSON.stringify(history.slice(-10)))
}

export async function compressPhoto(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
  })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(compressed)
  })
}

export interface SubmitReportInput {
  category: IssueCategory
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
  phone?: string
  address?: string
  pincode?: string
  gpsAccuracy?: number
}

export async function submitReport(input: SubmitReportInput): Promise<Report> {
  const rate = checkRateLimit()
  if (!rate.allowed) {
    throw new Error(`Rate limit reached. Try again in ${rate.waitMinutes} minutes.`)
  }

  const report: Report = {
    id: randomUUID(),
    ...input,
    status: 'open',
    deviceId: getDeviceId(),
    createdAt: new Date().toISOString(),
    synced: navigator.onLine,
  }

  if (navigator.onLine) {
    await saveReport(report)
    recordSubmission()
  } else {
    await addToQueue(report)
    await saveReport({ ...report, synced: false })
    recordSubmission()
  }

  window.dispatchEvent(new CustomEvent('chudu:reports-updated'))
  return report
}

export async function syncOfflineQueue(): Promise<number> {
  if (!navigator.onLine) return 0
  const queue = await getQueue()
  let synced = 0
  for (const item of queue) {
    await saveReport({ ...item, synced: true })
    await removeFromQueue(item.id)
    synced++
  }
  if (synced > 0) {
    window.dispatchEvent(new CustomEvent('chudu:reports-updated'))
  }
  return synced
}

export function filterReports(reports: Report[], filters: MapFilters): Report[] {
  return reports.filter((r) => {
    if (filters.corporation && r.municipal_corporation !== filters.corporation) return false
    if (filters.zone && r.zone !== filters.zone) return false
    if (filters.division && r.division !== filters.division) return false
    if (filters.circle && r.circle !== filters.circle) return false
    if (filters.ward_id && r.ward_id !== filters.ward_id) return false
    if (filters.category && r.category !== filters.category) return false
    if (filters.status && r.status !== filters.status) return false
    if (filters.dateFrom && r.createdAt < filters.dateFrom) return false
    if (filters.dateTo && r.createdAt > filters.dateTo + 'T23:59:59') return false
    return true
  })
}

export async function fetchReports(filters?: MapFilters): Promise<Report[]> {
  const all = await getAllReports()
  return filters ? filterReports(all, filters) : all
}

export function subscribeReports(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener('chudu:reports-updated', handler)
  window.addEventListener('online', handler)
  return () => {
    window.removeEventListener('chudu:reports-updated', handler)
    window.removeEventListener('online', handler)
  }
}

export async function seedDemoReports(): Promise<void> {
  const existing = await getAllReports()
  if (existing.length > 0) return

  const demos: (Omit<SubmitReportInput, 'photoDataUrl'> & { status?: ReportStatus })[] = [
    {
      category: 'leakage',
      lat: 17.4434,
      lng: 78.3772,
      ward_id: 23,
      ward: 'GACHIBOWLI',
      circle: 'SERILINGAMPALLY',
      division: '20',
      zone: 'SERILINGAMPALLY',
      municipal_corporation: 'CYBERABAD',
      note: 'Burst pipe near main road',
    },
    {
      category: 'sewage',
      lat: 17.3616,
      lng: 78.4747,
      ward_id: 169,
      ward: 'KHAIRATABAD',
      circle: 'KHAIRATABAD',
      division: '15',
      zone: 'KHAIRATABAD',
      municipal_corporation: 'HYDERABAD',
    },
    {
      category: 'no_water',
      lat: 17.4948,
      lng: 78.3996,
      ward_id: 41,
      ward: 'KUKATPALLY',
      circle: 'KUKATPALLY',
      division: '22',
      zone: 'KUKATPALLY',
      municipal_corporation: 'CYBERABAD',
    },
    {
      category: 'manhole',
      status: 'in_progress',
      lat: 17.4065,
      lng: 78.5247,
      ward_id: 245,
      ward: 'MALKAJGIRI',
      circle: 'MALKAJGIRI',
      division: '2',
      zone: 'MALKAJGIRI',
      municipal_corporation: 'MALKAJGIRI',
    },
    {
      category: 'contaminated',
      lat: 17.3841,
      lng: 78.4564,
      ward_id: 121,
      ward: 'YAKUTPURA',
      circle: 'YAKUTPURA',
      division: '11',
      zone: 'CHARMINAR',
      municipal_corporation: 'HYDERABAD',
    },
  ]

  const placeholder =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#0d9488" width="400" height="300"/><text x="200" y="160" text-anchor="middle" fill="white" font-size="24" font-family="sans-serif">Chudu</text></svg>',
    )

  for (const d of demos) {
    const status = d.status ?? 'open'
    const report: Report = {
      id: randomUUID(),
      category: d.category,
      status,
      note: d.note,
      photoDataUrl: placeholder,
      lat: d.lat,
      lng: d.lng,
      ward_id: d.ward_id,
      ward: d.ward,
      circle: d.circle,
      division: d.division,
      zone: d.zone,
      municipal_corporation: d.municipal_corporation,
      deviceId: 'demo-seed',
      createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
      synced: true,
      ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {}),
    }
    await saveReport(report)
  }
}
