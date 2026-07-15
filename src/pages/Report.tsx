import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CameraCapture from '../components/CameraCapture'
import GpsStatusChip from '../components/GpsStatusChip'
import { IconCamera, IconDot } from '../components/icons/Icons'
import MapView from '../components/MapView'
import { ISSUE_CATEGORIES, getCategoryMeta } from '../constants/categories'
import { useGps } from '../context/GpsContext'
import { formatAccuracy } from '../lib/geolocation'
import type { GpsReading } from '../lib/geolocation'
import type { PhotoStampData } from '../lib/photoStamp'
import { loadFlatHierarchy } from '../lib/hierarchy'
import { compressPhoto, submitReport } from '../lib/reports'
import { initWardLookup, resolveWardFromCoords } from '../lib/wardLookup'
import type { IssueCategory, WardRecord } from '../types'

type Step = 'category' | 'camera' | 'location' | 'note' | 'done'

export default function Report() {
  const gps = useGps()
  const [step, setStep] = useState<Step>('category')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [captureLocation, setCaptureLocation] = useState<GpsReading | null>(null)
  const [captureStamp, setCaptureStamp] = useState<PhotoStampData | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [ward, setWard] = useState<WardRecord | null>(null)
  const [lookupMethod, setLookupMethod] = useState<string>('')
  const [category, setCategory] = useState<IssueCategory | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pickMode, setPickMode] = useState(false)
  const [manualWardId, setManualWardId] = useState<number | ''>('')
  const [allWards, setAllWards] = useState<WardRecord[]>([])
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 })
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captureWardName, setCaptureWardName] = useState<string | null>(null)
  const [openingCamera, setOpeningCamera] = useState(false)

  useEffect(() => {
    initWardLookup()
    loadFlatHierarchy().then(setAllWards)
    setCaptcha({ a: Math.floor(Math.random() * 8) + 1, b: Math.floor(Math.random() * 8) + 1 })
  }, [])

  const captureGeo = useCallback(async (latitude: number, longitude: number) => {
    setLat(latitude)
    setLng(longitude)
    setLoading(true)
    setError('')
    try {
      const result = await resolveWardFromCoords(latitude, longitude)
      if (result) {
        setWard(result.ward)
        setLookupMethod(result.method)
      } else {
        setWard(null)
        setError('Could not auto-detect ward. Tap the map to set location or pick ward manually.')
        setPickMode(true)
      }
    } catch {
      setError('Ward lookup failed. Please select ward manually.')
      setPickMode(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleOpenCamera = async () => {
    if (!category || gps.state !== 'locked' || !gps.reading || openingCamera) return
    setOpeningCamera(true)
    let wardName: string | null = null
    try {
      const result = await resolveWardFromCoords(gps.reading.lat, gps.reading.lng)
      wardName = result?.ward.ward ?? null
    } catch {
      /* stamp without ward if lookup fails */
    }
    setCaptureWardName(wardName)
    setCaptureLocation(gps.reading)
    setStep('camera')
    setOpeningCamera(false)
  }

  const handleCameraClose = () => {
    setStep('category')
  }

  const handleCameraCapture = async (
    file: File,
    location: GpsReading,
    stamp: PhotoStampData,
  ) => {
    setPhotoFile(file)
    setPhoto(URL.createObjectURL(file))
    setCaptureLocation(location)
    setCaptureStamp(stamp)
    setLat(location.lat)
    setLng(location.lng)
    setStep('location')
    await captureGeo(location.lat, location.lng)
  }

  const handleMapPick = async (pickLat: number, pickLng: number) => {
    await captureGeo(pickLat, pickLng)
    setPickMode(false)
  }

  const handleManualWard = (wardId: number) => {
    const w = allWards.find((x) => x.ward_id === wardId)
    if (w) {
      setWard(w)
      setLookupMethod('manual')
      setManualWardId(wardId)
    }
  }

  const handleSubmit = async () => {
    if (!photoFile || !ward || !category || lat == null || lng == null) return

    if (showCaptcha) {
      if (Number(captchaAnswer) !== captcha.a + captcha.b) {
        setError('Incorrect captcha answer.')
        return
      }
    }

    setLoading(true)
    setError('')
    try {
      const photoDataUrl = await compressPhoto(photoFile)
      const mergedNote = [note.trim()].filter(Boolean).join(' · ')

      await submitReport({
        category,
        note: mergedNote || undefined,
        photoDataUrl,
        lat,
        lng,
        ward_id: ward.ward_id,
        ward: ward.ward,
        circle: ward.circle,
        division: ward.division,
        zone: ward.zone,
        municipal_corporation: ward.municipal_corporation,
        address: captureLocation?.address?.line ?? captureStamp?.address,
        pincode: captureLocation?.address?.pincode ?? captureStamp?.pincode ?? undefined,
        gpsAccuracy: captureLocation?.accuracy,
      })
      setStep('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      if (msg.includes('Rate limit')) {
        setShowCaptcha(true)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const issueLabel = category ? getCategoryMeta(category).label : ''

  if (step === 'camera' && captureLocation && category) {
    return (
      <CameraCapture
        location={captureLocation}
        issueTypeLabel={issueLabel}
        wardName={captureWardName}
        onCapture={handleCameraCapture}
        onClose={handleCameraClose}
      />
    )
  }

  if (step === 'done' && ward) {
    return (
      <div className="confirmation report-done">
        <div className="report-done-dot" />
        <h2>Report Submitted</h2>
        <p className="report-done-meta">
          Reported in <strong>{ward.ward}</strong> ward, <strong>{ward.circle}</strong> circle,
          Division <strong>{ward.division}</strong>, <strong>{ward.zone}</strong> zone —{' '}
          <strong>{ward.municipal_corporation}</strong>.
        </p>
        <Link to="/map" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          View on Map
        </Link>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: '0.75rem', width: '100%' }}
          onClick={() => window.location.reload()}
        >
          Report Another
        </button>
      </div>
    )
  }

  return (
    <div className="report-step">
      {step === 'category' && (
        <>
          <h2 className="page-title">What&apos;s the issue?</h2>
          <p className="report-lead">
            GPS locks when you open the app. Pick the issue type, then take a photo — coordinates,
            address, date, time, and pincode are stamped on the image footer.
          </p>

          <GpsStatusChip />

          <div className="category-grid">
            {ISSUE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`category-btn${category === c.id ? ' selected' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                <span className="emoji">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg report-open-camera"
            disabled={!category || gps.state !== 'locked' || openingCamera}
            onClick={handleOpenCamera}
          >
            <IconCamera size={18} />
            {openingCamera
              ? 'Detecting ward…'
              : gps.state === 'locked'
              ? 'Take Photo'
              : gps.state === 'searching'
                ? 'Waiting for GPS lock…'
                : 'Enable GPS to continue'}
          </button>
        </>
      )}

      {step === 'location' && photo && (
        <>
          <h2 className="page-title">Confirm Location</h2>
          <img src={photo} alt="Issue" className="photo-preview stamped" />

          {captureStamp && (
            <div className="location-footer-card">
              <div className="location-footer-row">
                <span className="k">Street</span>
                <span className="v">{captureStamp.streetName ?? '—'}</span>
              </div>
              <div className="location-footer-row">
                <span className="k">Ward</span>
                <span className="v">{captureStamp.wardName ?? ward?.ward ?? '—'}</span>
              </div>
              <div className="location-footer-row">
                <span className="k">Issue</span>
                <span className="v">{captureStamp.issueType}</span>
              </div>
              <div className="location-footer-row">
                <span className="k">GPS</span>
                <span className="v">
                  <IconDot /> Locked {captureLocation && formatAccuracy(captureLocation.accuracy)}
                </span>
              </div>
              <div className="location-footer-row">
                <span className="k">Lat / Lng</span>
                <span className="v">
                  {captureStamp.lat.toFixed(6)}, {captureStamp.lng.toFixed(6)}
                </span>
              </div>
              <div className="location-footer-row">
                <span className="k">Address</span>
                <span className="v">{captureStamp.address}</span>
              </div>
              <div className="location-footer-row">
                <span className="k">Pincode</span>
                <span className="v">{captureStamp.pincode ?? '—'}</span>
              </div>
            </div>
          )}

          {loading && <p className="report-status">Detecting ward from GPS…</p>}
          {error && <p className="report-error">{error}</p>}

          {lat != null && lng != null && (
            <MapView
              reports={[]}
              center={[lat, lng]}
              zoom={15}
              pickMode={pickMode}
              pickLocation={{ lat, lng }}
              onLocationPick={handleMapPick}
              mode="choropleth"
              showBoundaries
              showCityBoundary={false}
              enableClustering={false}
            />
          )}

          {ward && (
            <div className="location-info">
              <div className="location-info-label">Detected via {lookupMethod}</div>
              <div className="chain">
                {ward.ward} → {ward.circle} → Div {ward.division} → {ward.zone} →{' '}
                {ward.municipal_corporation}
              </div>
            </div>
          )}

          {!ward && (
            <div className="manual-ward">
              <label>Select ward manually</label>
              <select
                value={manualWardId}
                onChange={(e) => handleManualWard(Number(e.target.value))}
                className="issues-select"
              >
                <option value="">Choose ward…</option>
                {allWards.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>
                    {w.ward} ({w.circle}, {w.zone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={!ward || loading}
            onClick={() => setStep('note')}
          >
            Continue
          </button>
        </>
      )}

      {step === 'note' && (
        <>
          <h2 className="page-title">Anything else? (optional)</h2>
          {photo && <img src={photo} alt="Issue preview" className="photo-preview stamped small" />}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="One-line note (optional)"
            rows={3}
            className="report-textarea"
          />

          {showCaptcha && (
            <div className="card">
              <p>
                Quick check: What is {captcha.a} + {captcha.b}?
              </p>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="report-input"
              />
            </div>
          )}

          {error && <p className="report-error">{error}</p>}

          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </>
      )}
    </div>
  )
}
