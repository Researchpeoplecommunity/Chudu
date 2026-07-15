import type { IssueCategory } from '../types'

export const ISSUE_CATEGORIES: {
  id: IssueCategory
  emoji: string
  label: string
  color: string
}[] = [
  { id: 'no_water', emoji: '💧', label: 'No water supply / low pressure', color: '#0284c7' },
  { id: 'leakage', emoji: '🚰', label: 'Pipeline leakage / burst pipe', color: '#0ea5e9' },
  { id: 'manhole', emoji: '🕳️', label: 'Open manhole / broken cover', color: '#64748b' },
  { id: 'sewage', emoji: '🌊', label: 'Sewage overflow / drain blockage', color: '#7c3aed' },
  { id: 'contaminated', emoji: '🚱', label: 'Contaminated / discolored water', color: '#ca8a04' },
  { id: 'tanker', emoji: '🚛', label: 'Water tanker request / delay', color: '#059669' },
  { id: 'illegal_connection', emoji: '🏗️', label: 'Illegal water connection / tapping', color: '#dc2626' },
  { id: 'other', emoji: '📋', label: 'Other water/sewerage issue', color: '#475569' },
]

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export const STATUS_COLORS: Record<string, string> = {
  open: '#ef4444',
  in_progress: '#f59e0b',
  resolved: '#22c55e',
}

export function getCategoryMeta(id: IssueCategory) {
  return ISSUE_CATEGORIES.find((c) => c.id === id) ?? ISSUE_CATEGORIES[7]
}

export const HYDERABAD_CENTER: [number, number] = [17.385, 78.4867]
