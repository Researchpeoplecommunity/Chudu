import type { WardRecord } from '../types'

/** Normalize ward/circle names for matching OSM ↔ HMWSSB hierarchy */
export function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeCompact(name: string): string {
  return normalizeName(name).replace(/\s/g, '')
}

/** Extract ward label from OSM polygon name e.g. "Ward 91 Khairatabad" */
export function extractWardNameFromOsm(osmName: string): string {
  const match = osmName.match(/^Ward\s+\d+\s+(.+)$/i)
  return normalizeName(match ? match[1] : osmName)
}

/**
 * OSM / legacy GHMC name → HMWSSB hierarchy ward name.
 * Verified against chudu-hierarchy-flat.json (292 wards).
 */
export const OSM_TO_HIERARCHY_ALIASES: Record<string, string> = {
  'MACHA BOLARUM': 'MACHABOLLARAM',
  'DR A S RAO NAGAR': 'DR AS RAO NAGAR',
  'CHILKA NAGAR': 'CHILKANAGAR',
  'EAST ANAND BAGH': 'EAST ANANDBAGH',
  'JAGATHGIRIGUTTA': 'JAGATHGIRI GUTTA',
  'ALWYN COLONY': 'ALLWYN COLONY',
  'SUBASH NAGAR': 'SUBHASH NAGAR',
  'CHANDANAGAR': 'CHANDA NAGAR',
  'HIMAYATH NAGAR': 'HIMAYATHNAGAR',
  'GANDHINAGAR': 'GANDHI NAGAR',
  'GANDHINAGARA': 'GANDHI NAGAR',
  'BANSILAPET': 'BANSILALPET',
  'LALITHABAGH': 'LALITHA BAGH',
  'RAMNASPURA': 'RAMNASTHPURA',
  'PURANAPOOL': 'PURANA PUL',
  'PATTHERGATTI': 'PATHERGATTI',
  'MANGALHAT': 'MANGHALHAT',
  'MAILARDEV PALLY': 'MAILARDEVPALLY',
  'VIJAY NAGAR COLONY': 'VIJAYANAGAR COLONY',
  'NANAL NAGAR': 'NANALNAGAR',
  'SANATH NAGAR': 'SANATHNAGAR',
  'RAHMATH NAGAR': 'RAHAMATH NAGAR',
  'RANGAREDDY NAGAR': 'RANGA REDDY NAGAR',
  'HYDERNAGAR': 'HYDER NAGAR',
  'MOULA ALI': 'MOULALI',
  'GAUTHAM NAGAR': 'GOUTHAM NAGAR',
  'GADDIANNARAM': 'GADDIANNAARAM',
  'AKBARBAGH': 'AKBERBAGH',
  'SANTHOSH NAGAR': 'SANTOSH NAGAR',
  'BHARATI NAGAR': 'BHARATHI NAGAR',
  'SHALIBANDA': 'SHAH ALI BANDA',
  'CHAWNI': 'CHAWANI',
  'JEEDIMETLA': 'QUTHBULLAPUR',
  'UPPUGUDA': 'HABSIGUDA',
  'MOGHALPURA': 'GOWLIPURA',
  'KURMAGUDA': 'KARMANGHAT',
  'SESHADRIPURAM': 'GANDHI NAGAR',
  'RC PURAM': 'RAMACHANDRAPURAM (RC PURAM)',
  'RAMACHANDRAPURAM': 'RAMACHANDRAPURAM (RC PURAM)',
  'HAYATHNAGAR': 'HAYATHNAGAR',
  'HAYATH NAGAR': 'HAYATHNAGAR',
  'RAJENDRA NAGAR': 'RAJENDRA NAGAR',
  'LB NAGAR': 'LB NAGAR',
  'BK GUDA': 'BK GUDA',
}

export function resolveHierarchyName(osmExtracted: string): string {
  const key = normalizeName(osmExtracted)
  return OSM_TO_HIERARCHY_ALIASES[key] ?? key
}

export function findWardInFlat(flat: WardRecord[], hierarchyName: string): WardRecord | undefined {
  const target = normalizeName(hierarchyName)
  const compact = normalizeCompact(hierarchyName)

  const exact = flat.filter((w) => normalizeName(w.ward) === target)
  if (exact.length === 1) return exact[0]
  if (exact.length > 1) return exact[0]

  const compactMatch = flat.filter((w) => normalizeCompact(w.ward) === compact)
  if (compactMatch.length >= 1) return compactMatch[0]

  const circleMatch = flat.filter((w) => normalizeName(w.circle) === target)
  if (circleMatch.length >= 1) {
    const sameName = circleMatch.find((w) => normalizeName(w.ward) === target)
    return sameName ?? circleMatch[0]
  }

  const partial = flat.filter(
    (w) =>
      normalizeName(w.ward).includes(target) || target.includes(normalizeName(w.ward)),
  )
  if (partial.length === 1) return partial[0]

  return undefined
}

export function resolveOsmNameToWard(
  osmName: string,
  flat: WardRecord[],
): WardRecord | undefined {
  const extracted = extractWardNameFromOsm(osmName)
  const hierarchyName = resolveHierarchyName(extracted)
  return findWardInFlat(flat, hierarchyName)
}

export function formatAdminChain(record: Pick<
  WardRecord,
  'ward' | 'circle' | 'division' | 'zone' | 'municipal_corporation'
>): string {
  return `${record.ward} · ${record.circle} · Div ${record.division} · ${record.zone} · ${record.municipal_corporation}`
}

export function formatAdminShort(record: Pick<WardRecord, 'zone' | 'division' | 'circle'>): string {
  return `${record.zone} · Div ${record.division} · ${record.circle}`
}

export function formatWardTag(record: Pick<WardRecord, 'zone' | 'division' | 'ward_id'>): string {
  return `${record.zone} #${record.division}`
}

export function getHmwssbAccountability(record: Pick<
  WardRecord,
  'circle' | 'division' | 'zone' | 'municipal_corporation'
>): {
  circleOffice: string
  divisionOffice: string
  zoneOffice: string
  corporation: string
} {
  return {
    circleOffice: `HMWSSB ${record.circle} Circle Office`,
    divisionOffice: `Division ${record.division} Deputy General Manager`,
    zoneOffice: `${record.zone} Zone Office`,
    corporation: `${record.municipal_corporation} Municipal Corporation`,
  }
}
