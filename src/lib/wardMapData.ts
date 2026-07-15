import type { FeatureCollection } from 'geojson'
import type { Report } from '../types'
import { formatAdminChain } from './wardNames'
import { loadOsmWardMap, loadWardBoundaries, type OsmWardEntry } from './wardLookup'

export function choroplethFill(count: number): string {
  if (count <= 0) return '#F2F2F2'
  if (count <= 2) return '#E8E8E8'
  if (count <= 5) return '#D1D1D1'
  if (count <= 10) return '#B3B3B3'
  if (count <= 20) return '#888888'
  if (count <= 40) return '#555555'
  return '#D71921'
}

export function bubbleFill(count: number): string {
  if (count <= 0) return '#D1D1D1'
  if (count <= 5) return '#888888'
  if (count <= 15) return '#555555'
  if (count <= 30) return '#0A0A0A'
  return '#D71921'
}

export function bubbleSize(count: number): number {
  if (count <= 0) return 0
  return Math.min(72, Math.max(28, 20 + Math.sqrt(count) * 10))
}

export interface WardBubble {
  wardId: number
  wardName: string
  circle: string
  zone: string
  division: string
  corporation: string
  count: number
  openCount: number
  lat: number
  lng: number
}

export async function buildWardMapData(reports: Report[]): Promise<{
  enrichedGeo: FeatureCollection
  maxCount: number
}> {
  const geo = await loadWardBoundaries()
  const osmMap = await loadOsmWardMap()

  const countByWard = new Map<
    number,
    { total: number; open: number; meta: OsmWardEntry }
  >()

  for (const r of reports) {
    const cur = countByWard.get(r.ward_id) ?? {
      total: 0,
      open: 0,
      meta: {
        ward_id: r.ward_id,
        ward: r.ward,
        circle: r.circle,
        division: r.division,
        zone: r.zone,
        municipal_corporation: r.municipal_corporation,
      },
    }
    cur.total++
    if (r.status !== 'resolved') cur.open++
    countByWard.set(r.ward_id, cur)
  }

  let maxCount = 0

  const enrichedFeatures = geo.features.map((feature) => {
    const osmName = String(feature.properties?.name ?? '')
    const hierarchy = osmMap[osmName] ?? null
    const wardId = hierarchy?.ward_id ?? null
    const stats = wardId ? countByWard.get(wardId) : undefined
    const count = stats?.open ?? 0
    const total = stats?.total ?? 0

    if (count > maxCount) maxCount = count

    const meta = hierarchy ?? stats?.meta

    return {
      ...feature,
      properties: {
        ...feature.properties,
        ward_id: wardId,
        osm_name: osmName,
        open_count: count,
        total_count: total,
        ward_name: meta?.ward ?? null,
        circle: meta?.circle ?? null,
        division: meta?.division ?? null,
        zone: meta?.zone ?? null,
        municipal_corporation: meta?.municipal_corporation ?? null,
        admin_chain: meta ? formatAdminChain(meta) : null,
      },
    }
  })

  return {
    enrichedGeo: { type: 'FeatureCollection', features: enrichedFeatures },
    maxCount,
  }
}

let cityBoundaryCache: FeatureCollection | null = null

export async function loadCityBoundary(): Promise<FeatureCollection | null> {
  if (cityBoundaryCache) return cityBoundaryCache
  try {
    const res = await fetch('/data/ghmc-area.geojson')
    if (!res.ok) return null
    cityBoundaryCache = await res.json()
    return cityBoundaryCache
  } catch {
    return null
  }
}
