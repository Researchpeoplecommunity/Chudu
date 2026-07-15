import { IconCamera, IconDot } from './icons/Icons'
import { formatAccuracy, isSecureContextForGps } from '../lib/geolocation'
import type { GpsLockState, GpsReading } from '../lib/geolocation'

interface GpsLockPanelProps {
  state: GpsLockState
  reading: GpsReading | null
  error: string | null
  onEnable: () => void
  onOpenCamera: () => void
}

export default function GpsLockPanel({
  state,
  reading,
  error,
  onEnable,
  onOpenCamera,
}: GpsLockPanelProps) {
  const locked = state === 'locked'
  const searching = state === 'searching'
  const needsEnable = state === 'idle' || state === 'error'
  const insecure = !isSecureContextForGps()

  return (
    <div className="gps-lock-panel">
      <div className="gps-lock-header">
        <span
          className={`gps-lock-dot${locked ? ' locked' : searching ? ' searching' : state === 'error' ? ' error' : ''}`}
        />
        <div>
          <p className="gps-lock-title">
            {locked
              ? 'GPS locked'
              : searching
                ? 'Locking GPS…'
                : state === 'error'
                  ? 'GPS blocked'
                  : 'GPS required'}
          </p>
          <p className="gps-lock-sub">
            {locked && reading
              ? `Accuracy ${formatAccuracy(reading.accuracy)} — ready to capture`
              : searching
                ? 'Hold steady outdoors for best accuracy'
                : insecure
                  ? 'Open via localhost or HTTPS for GPS to work'
                  : 'Tap Enable GPS and allow location when prompted'}
          </p>
        </div>
      </div>

      {reading && (
        <div className="gps-lock-preview">
          <div className="gps-lock-row">
            <span className="k">Lat</span>
            <span className="v">{reading.lat.toFixed(6)}</span>
          </div>
          <div className="gps-lock-row">
            <span className="k">Lng</span>
            <span className="v">{reading.lng.toFixed(6)}</span>
          </div>
          {reading.address && (
            <>
              <div className="gps-lock-row wide">
                <span className="k">Address</span>
                <span className="v">{reading.address.line}</span>
              </div>
              <div className="gps-lock-row">
                <span className="k">Pincode</span>
                <span className="v">{reading.address.pincode ?? '—'}</span>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="gps-lock-error">
          <IconDot /> {error}
        </p>
      )}

      {needsEnable ? (
        <button type="button" className="btn btn-primary btn-lg" onClick={onEnable}>
          {state === 'error' ? 'Retry GPS' : 'Enable GPS'}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-lg report-open-camera"
          disabled={!locked || searching}
          onClick={onOpenCamera}
        >
          <IconCamera size={18} />
          {locked ? 'Open Camera' : 'Waiting for GPS…'}
        </button>
      )}
    </div>
  )
}
