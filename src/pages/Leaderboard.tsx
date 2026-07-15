import { useEffect, useMemo, useState } from 'react'
import LeaderboardTable from '../components/LeaderboardTable'
import { fetchReports, subscribeReports } from '../lib/reports'
import { computeLeaderboard, sortLeaderboard } from '../lib/stats'
import type { LeaderboardLevel } from '../types'

export default function Leaderboard() {
  const [level, setLevel] = useState<LeaderboardLevel>('zone')
  const [mode, setMode] = useState<'worst' | 'best'>('worst')
  const [reports, setReports] = useState<Awaited<ReturnType<typeof fetchReports>>>([])

  useEffect(() => {
    fetchReports().then(setReports)
    return subscribeReports(() => fetchReports().then(setReports))
  }, [])

  const entries = useMemo(() => {
    const computed = computeLeaderboard(reports, level)
    return sortLeaderboard(computed, mode)
  }, [reports, level, mode])

  return (
    <div>
      <h2 className="page-title">Accountability Leaderboard</h2>
      <p style={{ color: 'var(--slate-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Rankings by HMWSSB zone, circle, and division — holding offices accountable, not
        individuals.
      </p>

      <div className="toggle-group">
        {(['zone', 'circle', 'division'] as LeaderboardLevel[]).map((l) => (
          <button
            key={l}
            type="button"
            className={`toggle-btn${level === l ? ' active' : ''}`}
            onClick={() => setLevel(l)}
          >
            {l.charAt(0).toUpperCase() + l.slice(1)}s
          </button>
        ))}
      </div>

      <div className="toggle-group">
        <button
          type="button"
          className={`toggle-btn${mode === 'worst' ? ' active' : ''}`}
          onClick={() => setMode('worst')}
        >
          Worst Performing
        </button>
        <button
          type="button"
          className={`toggle-btn${mode === 'best' ? ' active' : ''}`}
          onClick={() => setMode('best')}
        >
          Best Performing
        </button>
      </div>

      <LeaderboardTable entries={entries} mode={mode} />
    </div>
  )
}
