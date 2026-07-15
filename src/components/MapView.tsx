import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { GeoJSON as GeoJSONType } from 'geojson'
import 'leaflet/dist/leaflet.css'
import type { Report } from '../types'
import { HYDERABAD_CENTER } from '../constants/categories'
import {
  buildWardMapData,
  choroplethFill,
  loadCityBoundary,
} from '../lib/wardMapData'
import { loadFlatHierarchy } from '../lib/hierarchy'
import ComplianceClusterLayer from './ComplianceClusterLayer'
import MapResizeFix from './MapResizeFix'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FitHyderabad({ geoData }: { geoData: GeoJSONType | null }) {
  const map = useMap()
  useEffect(() => {
    if (!geoData) return
    const layer = L.geoJSON(geoData)
    const bounds = layer.getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 })
    }
  }, [geoData, map])
  return null
}

function CityLabel() {
  const map = useMap()
  useEffect(() => {
    const label = L.marker(HYDERABAD_CENTER, {
      icon: L.divIcon({
        className: 'city-label-marker',
        html: '<div class="city-label">HYDERABAD</div>',
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      }),
      interactive: false,
    })
    label.addTo(map)
    return () => {
      label.remove()
    }
  }, [map])
  return null
}

interface MapViewProps {
  reports: Report[]
  className?: string
  interactive?: boolean
  center?: [number, number]
  zoom?: number
  onLocationPick?: (lat: number, lng: number) => void
  pickMode?: boolean
  pickLocation?: { lat: number; lng: number } | null
  mode?: 'choropleth' | 'pins'
  showBoundaries?: boolean
  showCityBoundary?: boolean
  /** Dynamic supercluster + PIP placement (default true for compliance map) */
  enableClustering?: boolean
  selectedReportId?: string | null
  onReportSelect?: (report: Report) => void
  mapTint?: boolean
  /** Fill parent absolutely — use on Issues map page */
  fill?: boolean
}

export default function MapView({
  reports,
  className = '',
  interactive = true,
  center,
  zoom = 11,
  onLocationPick,
  pickMode,
  pickLocation,
  mode = 'choropleth',
  showBoundaries = true,
  showCityBoundary = true,
  enableClustering = true,
  selectedReportId,
  onReportSelect,
  mapTint = false,
  fill = false,
}: MapViewProps) {
  const mapCenter = center ?? HYDERABAD_CENTER
  const containerRef = useRef<HTMLDivElement>(null)
  const needsDeferredMount = fill || className.includes('issues-map')
  const [mapReady, setMapReady] = useState(!needsDeferredMount)
  const [enrichedGeo, setEnrichedGeo] = useState<GeoJSONType | null>(null)
  const [cityBoundary, setCityBoundary] = useState<GeoJSONType | null>(null)
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    loadFlatHierarchy().then(() => setDataReady(true))
    if (showCityBoundary) loadCityBoundary().then(setCityBoundary)
  }, [showCityBoundary])

  useLayoutEffect(() => {
    if (!needsDeferredMount) return
    const el = containerRef.current
    if (!el) return

    const check = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height >= 120) setMapReady(true)
    }

    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    const fallback = window.setTimeout(() => setMapReady(true), 500)

    return () => {
      ro.disconnect()
      window.clearTimeout(fallback)
    }
  }, [needsDeferredMount])

  useEffect(() => {
    if (mode !== 'choropleth' || !dataReady) return
    buildWardMapData(reports).then(({ enrichedGeo: geo }) => {
      setEnrichedGeo(geo)
    })
  }, [reports, dataReady, mode])

  const wardStyle = useCallback((feature?: GeoJSON.Feature) => {
    const count = Number(feature?.properties?.open_count ?? 0)
    return {
      fillColor: choroplethFill(count),
      fillOpacity: count > 0 ? 0.72 : 0.35,
      color: count > 0 ? '#0A0A0A' : '#D1D1D1',
      weight: count > 0 ? 1.25 : 0.75,
      opacity: 0.9,
      dashArray: count > 0 ? undefined : '4 4',
    }
  }, [])

  const onEachWard = useCallback((feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties ?? {}
    const name = props.ward_name ?? 'Unknown ward'
    const open = props.open_count ?? 0
    const total = props.total_count ?? 0
    const chain = props.admin_chain ?? ''
    if (props.ward_name) {
      layer.bindPopup(
        `<strong>${name}</strong>${chain ? `<br/><small>${chain}</small>` : ''}<br/>${open} open · ${total} total report${total !== 1 ? 's' : ''}`,
      )
    }
    layer.on({
      mouseover: (e) => {
        const l = e.target as L.Path
        l.setStyle({ weight: 2, fillOpacity: 0.7 })
      },
      mouseout: (e) => {
        const l = e.target as L.Path
        const count = Number(feature.properties?.open_count ?? 0)
        l.setStyle({
          weight: count > 0 ? 1 : 0.5,
          fillOpacity: count > 0 ? 0.55 : 0.25,
        })
      },
    })
  }, [])

  const cityBoundaryStyle = {
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#0A0A0A',
    weight: 2,
    opacity: 0.75,
    dashArray: '10 8',
  }

  const showComplianceLayer = enableClustering && !pickMode && reports.length > 0

  return (
    <div
      ref={containerRef}
      className={`map-container ${className}${fill ? ' map-fill' : ''}${mapTint ? ' map-tinted' : ''}`}
    >
      {mapReady ? (
      <MapContainer
        key={needsDeferredMount ? 'issues-leaflet-map' : 'leaflet-map'}
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="leaflet-map-root"
        style={{ height: '100%', width: '100%', minHeight: needsDeferredMount ? 280 : undefined }}
        zoomControl={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        <MapResizeFix />

        {showCityBoundary && cityBoundary && (
          <GeoJSON data={cityBoundary} style={cityBoundaryStyle} interactive={false} />
        )}

        {showBoundaries && enrichedGeo && mode === 'choropleth' && (
          <GeoJSON data={enrichedGeo} style={wardStyle} onEachFeature={onEachWard} />
        )}

        {mode === 'choropleth' && enrichedGeo && <FitHyderabad geoData={enrichedGeo} />}
        {mode === 'choropleth' && <CityLabel />}

        {showComplianceLayer && (
          <ComplianceClusterLayer
            reports={reports}
            selectedReportId={selectedReportId}
            onReportSelect={onReportSelect}
            enabled
          />
        )}

        {pickLocation && (
          <Marker position={[pickLocation.lat, pickLocation.lng]} icon={defaultIcon} />
        )}
        {pickMode && onLocationPick && <LocationPicker onPick={onLocationPick} />}
      </MapContainer>
      ) : (
        <div className="map-loading-placeholder" aria-hidden />
      )}
      {mapTint && <div className="map-tint-overlay" aria-hidden />}
    </div>
  )
}

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onPick(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map, onPick])
  return null
}
