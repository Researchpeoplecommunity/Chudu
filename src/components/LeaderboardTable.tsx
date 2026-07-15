import type { LeaderboardEntry } from '../types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  mode: 'worst' | 'best'
}

export default function LeaderboardTable({ entries, mode }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <p style={{ color: '#475569' }}>No data yet. Be the first to report an issue!</p>
  }

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Area</th>
            <th>Corp</th>
            <th>Open</th>
            <th>Resolved %</th>
            <th>Avg fix (hrs)</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.key}>
              <td>
                <span className={`rank-badge${i < 3 && mode === 'worst' ? ' top' : ''}`}>
                  {i + 1}
                </span>
              </td>
              <td>
                <strong>{e.label}</strong>
                <br />
                <small style={{ color: '#64748b' }}>
                  {e.zone}
                  {e.circle ? ` · ${e.circle}` : ''}
                </small>
              </td>
              <td>{e.corporation}</td>
              <td style={{ color: e.openCount > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                {e.openCount}
              </td>
              <td>{e.resolvedPercent}%</td>
              <td>{e.avgResolutionHours != null ? e.avgResolutionHours.toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
