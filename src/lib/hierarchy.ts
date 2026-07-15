import type { HierarchyNested, WardRecord } from '../types'

let flatCache: WardRecord[] | null = null
let nestedCache: HierarchyNested | null = null

export async function loadFlatHierarchy(): Promise<WardRecord[]> {
  if (flatCache) return flatCache
  const res = await fetch('/data/chudu-hierarchy-flat.json')
  flatCache = await res.json()
  return flatCache!
}

export async function loadNestedHierarchy(): Promise<HierarchyNested> {
  if (nestedCache) return nestedCache
  const res = await fetch('/data/chudu-hierarchy-nested.json')
  nestedCache = await res.json()
  return nestedCache!
}

export function getWardById(flat: WardRecord[], wardId: number): WardRecord | undefined {
  return flat.find((w) => w.ward_id === wardId)
}

export function getCorporations(nested: HierarchyNested): string[] {
  return Object.keys(nested)
}

export function getZones(nested: HierarchyNested, corporation?: string): string[] {
  if (!corporation) return []
  return Object.keys(nested[corporation] ?? {})
}

export function getDivisions(
  nested: HierarchyNested,
  corporation?: string,
  zone?: string,
): string[] {
  if (!corporation || !zone) return []
  return Object.keys(nested[corporation]?.[zone] ?? {})
}

export function getCircles(
  nested: HierarchyNested,
  corporation?: string,
  zone?: string,
  division?: string,
): string[] {
  if (!corporation || !zone || !division) return []
  return Object.keys(nested[corporation]?.[zone]?.[division] ?? {})
}

export function getWards(
  nested: HierarchyNested,
  corporation?: string,
  zone?: string,
  division?: string,
  circle?: string,
): string[] {
  if (!corporation || !zone || !division || !circle) return []
  return nested[corporation]?.[zone]?.[division]?.[circle] ?? []
}

export function findWardRecord(
  flat: WardRecord[],
  opts: { ward?: string; circle?: string; ward_id?: number },
): WardRecord | undefined {
  if (opts.ward_id) return getWardById(flat, opts.ward_id)
  if (!opts.ward) return undefined
  const matches = flat.filter(
    (w) =>
      w.ward === opts.ward &&
      (!opts.circle || w.circle === opts.circle),
  )
  return matches[0]
}
