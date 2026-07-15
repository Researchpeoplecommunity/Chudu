import { useCallback, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../types'
import { complianceRecordsFromReports, clusterModeForZoom } from '../types/compliance'
import {
  buildPlacedCompliancePoints,
  createComplianceClusterIndex,
  getClusterExpansionZoom,
  getClustersForViewport,
  type PlacedCompliancePoint,
} from '../lib/complianceMap'
import { bubbleFill, bubbleSize } from '../lib/wardMapData'
import { getDotColor, getDotGlow } from '../lib/reportMarkers'
import type Supercluster from 'supercluster'

function createClusterIcon(count: number) {
  const size = bubbleSize(count)
  const bg = bubbleFill(count)
  return L.divIcon({
    className: 'compliance-cluster-icon',
    html: `<div class="ward-bubble compliance-cluster" style="width:${size}px;height:${size}px;background:${bg};font-size:${size > 40 ? 14 : 12}px">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createIndividualIcon(report: Report, selected: boolean) {
  const color = getDotColor(report)
  const glow = getDotGlow(report)
  const size = selected ? 18 : 14
  const glowStyle = glow
    ? `box-shadow:0 0 0 8px rgba(215,25,33,0.28), 0 0 0 16px rgba(215,25,33,0.12);`
    : `box-shadow:0 2px 6px rgba(0,0,0,0.28);`
  const border = selected ? '3px solid #0A0A0A' : '2.5px solid #FFFFFF'
  return L.divIcon({
    className: 'report-dot-icon',
    html: `<div class="report-dot" style="width:${size}px;height:${size}px;background:${color};border:${border};${glowStyle}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

interface ComplianceClusterLayerProps {
  reports: Report[]
  selectedReportId?: string | null
  onReportSelect?: (report: Report) => void
  enabled?: boolean
}

export default function ComplianceClusterLayer({
  reports,
  selectedReportId,
  onReportSelect,
  enabled = true,
}: ComplianceClusterLayerProps) {
  const map = useMap()
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const indexRef = useRef<Supercluster | null>(null)
  const placedRef = useRef<PlacedCompliancePoint[]>([])
  const onSelectRef = useRef(onReportSelect)
  const selectedIdRef = useRef(selectedReportId)

  onSelectRef.current = onReportSelect
  selectedIdRef.current = selectedReportId

  const renderClusters = useCallback(() => {
    const group = layerGroupRef.current
    const index = indexRef.current
    if (!group || !index || !enabled) return

    group.clearLayers()

    const bounds = map.getBounds()
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    const zoom = map.getZoom()
    const mode = clusterModeForZoom(zoom)
    const clusters = getClustersForViewport(index, bbox, zoom)

    for (const feature of clusters) {
      const [lng, lat] = feature.geometry.coordinates
      const props = feature.properties

      if (props.cluster) {
        const count = props.point_count ?? 0
        const marker = L.marker([lat, lng], {
          icon: createClusterIcon(count),
          zIndexOffset: 1000,
        })

        marker.on('click', () => {
          const clusterId = props.cluster_id
          if (clusterId != null) {
            const expansionZoom = getClusterExpansionZoom(index, clusterId)
            map.setView([lat, lng], expansionZoom, { animate: true })
          }
        })

        marker.bindTooltip(
          `${count} record${count !== 1 ? 's' : ''} · zoom in to split`,
          { direction: 'top', opacity: 0.9 },
        )

        group.addLayer(marker)
      } else if (props.record) {
        const report = props.record.source
        const selected = selectedIdRef.current === report.id
        const marker = L.marker([lat, lng], {
          icon: createIndividualIcon(report, selected),
          zIndexOffset: selected ? 2000 : 1500,
        })

        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          onSelectRef.current?.(report)
        })

        if (mode === 'high') {
          marker.bindTooltip(`${report.ward}`, { direction: 'top', opacity: 0.85 })
        }

        group.addLayer(marker)
      }
    }
  }, [map, enabled])

  useEffect(() => {
    if (!enabled) {
      layerGroupRef.current?.clearLayers()
      return
    }

    const records = complianceRecordsFromReports(reports)
    let cancelled = false

    buildPlacedCompliancePoints(records).then((placed) => {
      if (cancelled) return
      placedRef.current = placed
      indexRef.current = createComplianceClusterIndex(placed)
      renderClusters()
    })

    return () => {
      cancelled = true
    }
  }, [reports, enabled, renderClusters])

  useEffect(() => {
    if (!enabled) return

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map)
    }

    map.on('zoomend', renderClusters)
    map.on('moveend', renderClusters)

    return () => {
      map.off('zoomend', renderClusters)
      map.off('moveend', renderClusters)
    }
  }, [map, enabled, renderClusters])

  useEffect(() => {
    if (enabled && indexRef.current) renderClusters()
  }, [selectedReportId, enabled, renderClusters])

  useEffect(() => {
    return () => {
      layerGroupRef.current?.clearLayers()
      layerGroupRef.current?.remove()
      layerGroupRef.current = null
      indexRef.current = null
    }
  }, [map])

  return null
}
