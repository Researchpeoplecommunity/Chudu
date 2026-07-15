import { IconDot } from './icons/Icons'
import { useGps } from '../context/GpsContext'
import { formatAccuracy, isSecureContextForGps } from '../lib/geolocation'

interface GpsStatusChipProps {
  compact?: boolean
  showEnable?: boolean
}

export default function GpsStatusChip({ compact = false, showEnable = true }: GpsStatusChipProps) {
  const gps = useGps()
  const locked = gps.state === 'locked'
  const searching = gps.state === 'searching'
  const needsEnable = gps.state === 'idle' || gps.state === 'error'
  const insecure = !isSecureContextForGps()

  if (compact) {
    return (
      <div className={`gps-chip${locked ? ' locked' : searching ? ' searching' : ''}`}>
        <span className={`gps-lock-dot${locked ? ' locked' : searching ? ' searching' : ''}`} />
        <span className="gps-chip-label">
          {locked && gps.reading
            ? `GPS ${formatAccuracy(gps.reading.accuracy)}`
            : searching
              ? 'GPS locking…'
              : insecure
                ? 'GPS needs HTTPS'
                : needsEnable
                  ? 'GPS off'
                  : 'GPS…'}
        </span>
        {showEnable && needsEnable && (
          <button type="button" className="gps-chip-btn" onClick={gps.start}>
            Enable
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="gps-status-bar">
      <span className={`gps-lock-dot${locked ? ' locked' : searching ? ' searching' : ''}`} />
      <div className="gps-status-text">
        <strong>
          {locked ? 'GPS locked' : searching ? 'Locking GPS…' : needsEnable ? 'GPS required' : 'GPS'}
        </strong>
        {locked && gps.reading && (
          <span>
            {formatAccuracy(gps.reading.accuracy)}
            {gps.reading.address?.pincode ? ` · ${gps.reading.address.pincode}` : ''}
          </span>
        )}
        {gps.error && (
          <span className="gps-status-error">
            <IconDot /> {gps.error}
          </span>
        )}
      </div>
      {showEnable && needsEnable && (
        <button type="button" className="gps-chip-btn" onClick={gps.start}>
          {gps.state === 'error' ? 'Retry' : 'Enable GPS'}
        </button>
      )}
    </div>
  )
}
