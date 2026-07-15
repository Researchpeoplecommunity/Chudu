import { useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_COLORS, STATUS_LABELS } from '../constants/categories'
import type { WardListEntry } from '../lib/listData'
import { formatReportSummary, formatZoneTag } from '../lib/listData'
import { formatAdminChain } from '../lib/wardNames'

interface IssueListViewProps {
  entries: WardListEntry[]
}

export default function IssueListView({ entries }: IssueListViewProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (entries.length === 0) {
    return (
      <div className="issue-list-empty">
        <p>No issues match your filters.</p>
        <Link to="/report" className="btn btn-primary">
          Report the first issue
        </Link>
      </div>
    )
  }

  return (
    <div className="issue-list">
      {entries.map((entry) => {
        const isOpen = expanded === entry.ward_id
        return (
          <div key={entry.ward_id} className={`issue-list-row${isOpen ? ' expanded' : ''}`}>
            <button
              type="button"
              className="issue-list-row-main"
              onClick={() => setExpanded(isOpen ? null : entry.ward_id)}
              aria-expanded={isOpen}
            >
              <span className="issue-count">{entry.openCount}</span>
              <div className="issue-info">
                <div className="issue-title-row">
                  <span className="issue-title">{entry.ward}</span>
                  <span className="issue-zone-tag">{formatZoneTag(entry)}</span>
                </div>
                <p className="issue-subtitle">
                  {entry.openCount} unresolved · {entry.accountableOffice}
                </p>
              </div>
              <span className={`issue-chevron${isOpen ? ' open' : ''}`} aria-hidden>
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="issue-list-detail">
                <p className="issue-detail-meta">
                  {formatAdminChain({
                    ward: entry.ward,
                    circle: entry.circle,
                    division: entry.division,
                    zone: entry.zone,
                    municipal_corporation: entry.corporation,
                  })} · {entry.totalCount} total report{entry.totalCount !== 1 ? 's' : ''}
                </p>
                <ul>
                  {entry.reports.map((r) => (
                    <li key={r.id}>
                      <span className="issue-report-cat">{formatReportSummary(r)}</span>
                      <span
                        className="status-pill"
                        style={{ background: STATUS_COLORS[r.status] }}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                      <span className="issue-report-date">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {r.note && <p className="issue-report-note">{r.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
