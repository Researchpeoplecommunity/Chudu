import { useEffect, useState } from 'react'
import { getCategoryMeta, STATUS_COLORS, STATUS_LABELS } from '../constants/categories'
import { getDeviceId } from '../lib/reports'
import { getReportsByDevice } from '../lib/db'
import type { Report } from '../types'

export default function MyReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [phone, setPhone] = useState(localStorage.getItem('chudu-phone') ?? '')

  useEffect(() => {
    const deviceId = getDeviceId()
    getReportsByDevice(deviceId).then(setReports)
  }, [])

  const savePhone = () => {
    localStorage.setItem('chudu-phone', phone)
  }

  return (
    <div>
      <h2 className="page-title">My Reports</h2>
      <p style={{ color: 'var(--slate-600)', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Optional: save your phone number to track reports on this device.
      </p>

      <div className="card" style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--teal-100)' }}
        />
        <button type="button" className="btn btn-secondary" onClick={savePhone}>
          Save
        </button>
      </div>

      {reports.length === 0 ? (
        <p style={{ color: 'var(--slate-600)', marginTop: '1rem' }}>
          No reports from this device yet.
        </p>
      ) : (
        reports.map((r) => {
          const cat = getCategoryMeta(r.category)
          return (
            <div key={r.id} className="report-list-item">
              <img src={r.photoDataUrl} alt={cat.label} />
              <div className="meta">
                <strong>
                  {cat.emoji} {cat.label}
                </strong>
                <br />
                <span
                  className="status-pill"
                  style={{ background: STATUS_COLORS[r.status], marginTop: 4 }}
                >
                  {STATUS_LABELS[r.status]}
                </span>
                <br />
                <small>
                  {r.ward}, {r.circle} · {new Date(r.createdAt).toLocaleDateString()}
                </small>
                {!r.synced && (
                  <>
                    <br />
                    <small style={{ color: 'var(--amber-500)' }}>Pending sync</small>
                  </>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
