import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import destination from '@turf/destination'
import pointOnFeature from '@turf/point-on-feature'
import { point } from '@turf/helpers'
import type { Feature, Polygon, MultiPolygon } from 'geojson'

export interface PipResult {
  lat: number
  lng: number
  insidePolygon: boolean
  method: 'gps' | 'pip-offset' | 'pip-snap'
}

/**
 * Place a compliance point inside its ward polygon.
 * - Uses GPS when inside polygon (PIP verified)
 * - Snaps to an interior point via pointOnFeature when outside
 * - Applies a small spread offset when multiple records share a ward
 */
export function placePointInPolygon(
  lat: number,
  lng: number,
  polygon: Feature<Polygon | MultiPolygon>,
  spreadIndex = 0,
  spreadTotal = 1,
): PipResult {
  const pt = point([lng, lat])

  if (booleanPointInPolygon(pt, polygon)) {
    if (spreadTotal <= 1) {
      return { lat, lng, insidePolygon: true, method: 'gps' }
    }
    const offset = spreadPoint(pt, polygon, spreadIndex, spreadTotal)
    return { lat: offset.lat, lng: offset.lng, insidePolygon: true, method: 'pip-offset' }
  }

  const interior = pointOnFeature(polygon)
  const [iLng, iLat] = interior.geometry.coordinates

  if (spreadTotal <= 1) {
    return { lat: iLat, lng: iLng, insidePolygon: false, method: 'pip-snap' }
  }

  const offset = spreadPoint(interior, polygon, spreadIndex, spreadTotal)
  return { lat: offset.lat, lng: offset.lng, insidePolygon: false, method: 'pip-snap' }
}

function spreadPoint(
  base: ReturnType<typeof point>,
  polygon: Feature<Polygon | MultiPolygon>,
  index: number,
  total: number,
): { lat: number; lng: number } {
  const bearing = (index / total) * 360
  const distanceKm = 0.015 + (index % 3) * 0.008

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = destination(base, distanceKm + attempt * 0.005, bearing + attempt * 12, {
      units: 'kilometers',
    })
    const [cLng, cLat] = candidate.geometry.coordinates
    if (booleanPointInPolygon(point([cLng, cLat]), polygon)) {
      return { lat: cLat, lng: cLng }
    }
  }

  const [lng, lat] = base.geometry.coordinates
  return { lat, lng }
}
