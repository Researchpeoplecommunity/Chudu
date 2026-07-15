import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import centroid from '@turf/centroid'
import distance from '@turf/distance'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'
import type { WardRecord } from '../types'
import { findWardRecord, loadFlatHierarchy } from './hierarchy'
import { resolveOsmNameToWard } from './wardNames'

export interface OsmWardEntry {
  ward_id: number
  ward: string
  circle: string
  division: string
  zone: string
  municipal_corporation: string
}

let geoCache: FeatureCollection | null = null
let osmMapCache: Record<string, OsmWardEntry> | null = null

export async function loadWardBoundaries(): Promise<FeatureCollection> {
  if (geoCache) return geoCache
  const res = await fetch('/data/ghmc-wards.geojson')
  geoCache = await res.json()
  return geoCache!
}

export async function loadOsmWardMap(): Promise<Record<string, OsmWardEntry>> {
  if (osmMapCache) return osmMapCache
  const res = await fetch('/data/osm-ward-map.json')
  osmMapCache = await res.json()
  return osmMapCache!
}

export async function initWardLookup(): Promise<void> {
  await loadFlatHierarchy()
  await loadWardBoundaries()
  await loadOsmWardMap()
}

function osmEntryToWardRecord(entry: OsmWardEntry): WardRecord {
  return {
    ward_id: entry.ward_id,
    ward: entry.ward,
    circle: entry.circle,
    division: entry.division,
    zone: entry.zone,
    municipal_corporation: entry.municipal_corporation,
  }
}

export async function resolveWardFromOsmName(osmName: string): Promise<WardRecord | null> {
  const osmMap = await loadOsmWardMap()
  const entry = osmMap[osmName]
  if (entry) return osmEntryToWardRecord(entry)

  const flat = await loadFlatHierarchy()
  const ward = resolveOsmNameToWard(osmName, flat)
  return ward ?? null
}

export async function resolveWardFromCoords(
  lat: number,
  lng: number,
): Promise<{ ward: WardRecord; method: 'polygon' | 'nearest' | 'manual' } | null> {
  const geo = await loadWardBoundaries()
  const pt = point([lng, lat])

  let matchedFeature: Feature<Polygon | MultiPolygon> | null = null

  for (const feature of geo.features) {
    const geom = feature as Feature<Polygon | MultiPolygon>
    if (booleanPointInPolygon(pt, geom)) {
      matchedFeature = geom
      break
    }
  }

  if (matchedFeature?.properties?.name) {
    const ward = await resolveWardFromOsmName(String(matchedFeature.properties.name))
    if (ward) return { ward, method: 'polygon' }
  }

  let nearest: WardRecord | null = null
  let minDist = Infinity

  for (const feature of geo.features) {
    const geom = feature as Feature<Polygon | MultiPolygon>
    const center = centroid(geom)
    const d = distance(pt, center, { units: 'kilometers' })
    if (d < minDist && feature.properties?.name) {
      const ward = await resolveWardFromOsmName(String(feature.properties.name))
      if (ward) {
        minDist = d
        nearest = ward
      }
    }
  }

  if (nearest && minDist < 5) {
    return { ward: nearest, method: 'nearest' }
  }

  return null
}

export async function resolveWardById(wardId: number): Promise<WardRecord | undefined> {
  const flat = await loadFlatHierarchy()
  return findWardRecord(flat, { ward_id: wardId })
}
