import { useEffect, useState } from 'react'
import type { HierarchyNested, MapFilters } from '../types'
import {
  getCircles,
  getCorporations,
  getDivisions,
  getWards,
  getZones,
  loadFlatHierarchy,
  loadNestedHierarchy,
} from '../lib/hierarchy'
import { ISSUE_CATEGORIES, STATUS_LABELS } from '../constants/categories'

interface FilterPanelProps {
  filters: MapFilters
  onChange: (filters: MapFilters) => void
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [nested, setNested] = useState<HierarchyNested | null>(null)
  const [wardOptions, setWardOptions] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    loadNestedHierarchy().then(setNested)
  }, [])

  useEffect(() => {
    if (!nested || !filters.corporation || !filters.zone || !filters.division || !filters.circle) {
      setWardOptions([])
      return
    }
    const wardNames = getWards(
      nested,
      filters.corporation,
      filters.zone,
      filters.division,
      filters.circle,
    )
    loadFlatHierarchy().then((flat) => {
      const opts = wardNames
        .map((name) => {
          const rec = flat.find(
            (w) =>
              w.ward === name &&
              w.circle === filters.circle &&
              w.zone === filters.zone,
          )
          return rec ? { id: rec.ward_id, name: rec.ward } : null
        })
        .filter(Boolean) as { id: number; name: string }[]
      setWardOptions(opts)
    })
  }, [nested, filters.corporation, filters.zone, filters.division, filters.circle])

  const update = (patch: Partial<MapFilters>) => {
    onChange({ ...filters, ...patch })
  }

  if (!nested) return null

  const corporations = getCorporations(nested)
  const zones = getZones(nested, filters.corporation)
  const divisions = getDivisions(nested, filters.corporation, filters.zone)
  const circles = getCircles(nested, filters.corporation, filters.zone, filters.division)

  return (
    <div className="filter-panel">
      <select
        value={filters.corporation ?? ''}
        onChange={(e) =>
          update({
            corporation: e.target.value || undefined,
            zone: undefined,
            division: undefined,
            circle: undefined,
            ward_id: undefined,
          })
        }
      >
        <option value="">All Corporations</option>
        {corporations.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filters.zone ?? ''}
        onChange={(e) =>
          update({
            zone: e.target.value || undefined,
            division: undefined,
            circle: undefined,
            ward_id: undefined,
          })
        }
        disabled={!filters.corporation}
      >
        <option value="">All Zones</option>
        {zones.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>

      <select
        value={filters.division ?? ''}
        onChange={(e) =>
          update({
            division: e.target.value || undefined,
            circle: undefined,
            ward_id: undefined,
          })
        }
        disabled={!filters.zone}
      >
        <option value="">All Divisions</option>
        {divisions.map((d) => (
          <option key={d} value={d}>
            Division {d}
          </option>
        ))}
      </select>

      <select
        value={filters.circle ?? ''}
        onChange={(e) =>
          update({ circle: e.target.value || undefined, ward_id: undefined })
        }
        disabled={!filters.division}
      >
        <option value="">All Circles</option>
        {circles.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filters.ward_id ?? ''}
        onChange={(e) =>
          update({ ward_id: e.target.value ? Number(e.target.value) : undefined })
        }
        disabled={!filters.circle}
      >
        <option value="">All Wards</option>
        {wardOptions.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      <select
        value={filters.category ?? ''}
        onChange={(e) =>
          update({ category: (e.target.value || undefined) as MapFilters['category'] })
        }
      >
        <option value="">All Categories</option>
        {ISSUE_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.label}
          </option>
        ))}
      </select>

      <select
        value={filters.status ?? ''}
        onChange={(e) =>
          update({ status: (e.target.value || undefined) as MapFilters['status'] })
        }
      >
        <option value="">All Statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom ?? ''}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        placeholder="From"
      />
      <input
        type="date"
        value={filters.dateTo ?? ''}
        onChange={(e) => update({ dateTo: e.target.value || undefined })}
        placeholder="To"
      />

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onChange({})}
      >
        Clear Filters
      </button>
    </div>
  )
}
