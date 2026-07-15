import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Report } from '../types'

interface ChuduDB extends DBSchema {
  reports: {
    key: string
    value: Report
    indexes: {
      'by-status': string
      'by-device': string
      'by-created': string
      'by-synced': number
    }
  }
  queue: {
    key: string
    value: Report
  }
}

let dbPromise: Promise<IDBPDatabase<ChuduDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ChuduDB>('chudu-db', 1, {
      upgrade(db) {
        const reports = db.createObjectStore('reports', { keyPath: 'id' })
        reports.createIndex('by-status', 'status')
        reports.createIndex('by-device', 'deviceId')
        reports.createIndex('by-created', 'createdAt')
        reports.createIndex('by-synced', 'synced')

        db.createObjectStore('queue', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function getAllReports(): Promise<Report[]> {
  const db = await getDB()
  return db.getAll('reports')
}

export async function getReport(id: string): Promise<Report | undefined> {
  const db = await getDB()
  return db.get('reports', id)
}

export async function saveReport(report: Report): Promise<void> {
  const db = await getDB()
  await db.put('reports', report)
}

export async function updateReportStatus(
  id: string,
  status: Report['status'],
): Promise<void> {
  const db = await getDB()
  const report = await db.get('reports', id)
  if (!report) return
  report.status = status
  if (status === 'resolved') {
    report.resolvedAt = new Date().toISOString()
  }
  await db.put('reports', report)
}

export async function getReportsByDevice(deviceId: string): Promise<Report[]> {
  const db = await getDB()
  return db.getAllFromIndex('reports', 'by-device', deviceId)
}

export async function addToQueue(report: Report): Promise<void> {
  const db = await getDB()
  await db.put('queue', report)
}

export async function getQueue(): Promise<Report[]> {
  const db = await getDB()
  return db.getAll('queue')
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('queue', id)
}

export async function clearQueue(): Promise<void> {
  const db = await getDB()
  const items = await db.getAll('queue')
  const tx = db.transaction('queue', 'readwrite')
  await Promise.all([...items.map((i) => tx.store.delete(i.id)), tx.done])
}
