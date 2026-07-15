import Supercluster from 'supercluster'
import type { Feature, Polygon, MultiPolygon, Point } from 'geojson'
import type { ComplianceRecord } from '../types/compliance'
import { HIGH_ZOOM_INDIVIDUAL } from '../types/compliance'
import { placePointInPolygon } from './pipPlacement'
import { loadOsmWardMap, loadWardBoundaries } from './wardLookup'

export interface PlacedCompliancePoint {
  record: ComplianceRecord
  lat: number
  lng: number
  pipMethod: 'gps' | 'pip-offset' | 'pip-snap'
}

type ClusterProperties = {
  cluster?: boolean
  cluster_id?: number
  point_count?: number
  point_count_abbreviated?: string | number
  record?: ComplianceRecord
  pipMethod?: string
}

type ClusterFeature = Feature<Point, ClusterProperties>

let wardPolygonById: Map<number, Feature<Polygon | MultiPolygon>> | null = null

async function ensureWardPolygons(): Promise<Map<number, Feature<Polygon | MultiPolygon>>> {
  if (wardPolygonById) return wardPolygonById

  const geo = await loadWardBoundaries()
  const osmMap = await loadOsmWardMap()
  const map = new Map<number, Feature<Polygon | MultiPolygon>>()

  for (const feature of geo.features) {
    const osmName = String(feature.properties?.name ?? '')
    const entry = osmMap[osmName]
    if (entry?.ward_id) {
      map.set(entry.ward_id, feature as Feature<Polygon | MultiPolygon>)
    }
  }

  wardPolygonById = map
  return map
}

export async function buildPlacedCompliancePoints(
  records: ComplianceRecord[],
): Promise<PlacedCompliancePoint[]> {
  const polygons = await ensureWardPolygons()

  const byWard = new Map<number, ComplianceRecord[]>()
  for (const r of records) {
    const list = byWard.get(r.ward_id) ?? []
    list.push(r)
    byWard.set(r.ward_id, list)
  }

  const placed: PlacedCompliancePoint[] = []

  for (const [, wardRecords] of byWard) {
    wardRecords.forEach((record, index) => {
      const polygon = polygons.get(record.ward_id)
      if (polygon) {
        const pip = placePointInPolygon(
          record.lat,
          record.lng,
          polygon,
          index,
          wardRecords.length,
        )
        placed.push({
          record,
          lat: pip.lat,
          lng: pip.lng,
          pipMethod: pip.method,
        })
      } else {
        placed.push({
          record,
          lat: record.lat,
          lng: record.lng,
          pipMethod: 'gps',
        })
      }
    })
  }

  return placed
}

export function createComplianceClusterIndex(
  placed: PlacedCompliancePoint[],
): Supercluster<ClusterProperties, ClusterProperties> {
  const features: ClusterFeature[] = placed.map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    properties: {
      record: p.record,
      pipMethod: p.pipMethod,
    },
  }))

  const index = new Supercluster<ClusterProperties, ClusterProperties>({
    radius: 60,
    maxZoom: HIGH_ZOOM_INDIVIDUAL - 1,
    minPoints: 2,
    extent: 512,
    nodeSize: 64,
  })

  index.load(features)
  return index
}

export function getClustersForViewport(
  index: Supercluster<ClusterProperties, ClusterProperties>,
  bbox: [number, number, number, number],
  zoom: number,
): ClusterFeature[] {
  return index.getClusters(bbox, Math.floor(zoom)) as ClusterFeature[]
}

export function getClusterExpansionZoom(
  index: Supercluster<ClusterProperties, ClusterProperties>,
  clusterId: number,
): number {
  return index.getClusterExpansionZoom(clusterId)
}

export function getLeaves(
  index: Supercluster<ClusterProperties, ClusterProperties>,
  clusterId: number,
  limit = 20,
): ClusterFeature[] {
  return index.getLeaves(clusterId, limit) as ClusterFeature[]
}

export function invalidateWardPolygonCache(): void {
  wardPolygonById = null
}
