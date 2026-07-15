import type { LeaderboardEntry, LeaderboardLevel, Report } from '../types'

function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3600000
}

export function computeLeaderboard(
  reports: Report[],
  level: LeaderboardLevel,
): LeaderboardEntry[] {
  const groups = new Map<string, Report[]>()

  for (const r of reports) {
    let key: string
    switch (level) {
      case 'zone':
        key = `${r.municipal_corporation}::${r.zone}`
        break
      case 'circle':
        key = `${r.municipal_corporation}::${r.zone}::${r.circle}`
        break
      case 'division':
        key = `${r.municipal_corporation}::${r.zone}::${r.division}`
        break
    }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const entries: LeaderboardEntry[] = []

  for (const [key, items] of groups) {
    const sample = items[0]
    const openCount = items.filter((r) => r.status === 'open').length
    const inProgress = items.filter((r) => r.status === 'in_progress').length
    const resolved = items.filter((r) => r.status === 'resolved')
    const totalCount = items.length
    const resolvedCount = resolved.length

    const resolutionTimes = resolved
      .filter((r) => r.resolvedAt)
      .map((r) => hoursBetween(r.createdAt, r.resolvedAt!))

    const avgResolutionHours =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : null

    let label: string
    switch (level) {
      case 'zone':
        label = sample.zone
        break
      case 'circle':
        label = sample.circle
        break
      case 'division':
        label = `Division ${sample.division}`
        break
    }

    entries.push({
      key,
      label,
      corporation: sample.municipal_corporation,
      zone: sample.zone,
      division: sample.division,
      circle: level === 'circle' ? sample.circle : undefined,
      openCount: openCount + inProgress,
      totalCount,
      resolvedCount,
      resolvedPercent: totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0,
      avgResolutionHours,
    })
  }

  return entries
}

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  mode: 'worst' | 'best',
): LeaderboardEntry[] {
  const sorted = [...entries]
  if (mode === 'worst') {
    sorted.sort((a, b) => {
      if (b.openCount !== a.openCount) return b.openCount - a.openCount
      return a.resolvedPercent - b.resolvedPercent
    })
  } else {
    sorted.sort((a, b) => {
      if (a.resolvedPercent !== b.resolvedPercent) return b.resolvedPercent - a.resolvedPercent
      const aTime = a.avgResolutionHours ?? Infinity
      const bTime = b.avgResolutionHours ?? Infinity
      return aTime - bTime
    })
  }
  return sorted
}

export function getCityStats(reports: Report[]) {
  const total = reports.length
  const resolved = reports.filter((r) => r.status === 'resolved').length
  const open = reports.filter((r) => r.status !== 'resolved').length

  const wardCounts = new Map<number, { ward: string; count: number }>()
  for (const r of reports.filter((x) => x.status !== 'resolved')) {
    const cur = wardCounts.get(r.ward_id) ?? { ward: r.ward, count: 0 }
    cur.count++
    wardCounts.set(r.ward_id, cur)
  }

  let hotspot = { ward: '—', count: 0 }
  for (const [, v] of wardCounts) {
    if (v.count > hotspot.count) hotspot = v
  }

  return { total, resolved, open, hotspot }
}
