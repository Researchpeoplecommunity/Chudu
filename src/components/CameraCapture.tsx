import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconClose } from './icons/Icons'
import PhotoStampOverlay from './PhotoStampOverlay'
import {
  formatAccuracy,
  reverseGeocode,
  type GpsReading,
} from '../lib/geolocation'
import {
  buildStampData,
  captureVideoFrameWithStamp,
  type PhotoStampData,
} from '../lib/photoStamp'

interface CameraCaptureProps {
  location: GpsReading
  issueTypeLabel: string
  wardName?: string | null
  onCapture: (file: File, location: GpsReading, stamp: PhotoStampData) => void
  onClose: () => void
}

export default function CameraCapture({
  location,
  issueTypeLabel,
  wardName = null,
  onCapture,
  onClose,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [liveLocation, setLiveLocation] = useState(location)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    setLiveLocation(location)
    if (location.address) return
    let cancelled = false
    reverseGeocode(location.lat, location.lng).then((address) => {
      if (cancelled) return
      setLiveLocation((prev) => ({ ...prev, address }))
    })
    return () => {
      cancelled = true
    }
  }, [location])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function openCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play()
          setReady(true)
        }
      } catch {
        setError('Camera access denied. Allow camera permission and try again.')
      }
    }

    openCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const stampPreview = useMemo(
    () =>
      buildStampData(
        liveLocation.lat,
        liveLocation.lng,
        liveLocation.address?.line ?? 'Resolving address…',
        liveLocation.address?.pincode ?? null,
        issueTypeLabel,
        now,
        wardName,
        liveLocation.address?.street ?? null,
      ),
    [issueTypeLabel, liveLocation, now, wardName],
  )

  const handleCapture = useCallback(async () => {
    const video = videoRef.current
    if (!video || !ready || capturing) return

    setCapturing(true)
    try {
      const capturedAt = new Date()
      const stamp = buildStampData(
        liveLocation.lat,
        liveLocation.lng,
        liveLocation.address?.line ?? 'Address unavailable',
        liveLocation.address?.pincode ?? null,
        issueTypeLabel,
        capturedAt,
        wardName,
        liveLocation.address?.street ?? null,
      )
      const file = await captureVideoFrameWithStamp(video, stamp)
      onCapture(file, liveLocation, stamp)
    } catch {
      setError('Could not capture photo. Try again.')
      setCapturing(false)
    }
  }, [capturing, issueTypeLabel, liveLocation, onCapture, ready, wardName])

  return (
    <div className="camera-overlay">
      <div className="camera-topbar">
        <button type="button" className="camera-icon-btn" onClick={onClose} aria-label="Close camera">
          <IconClose size={20} />
        </button>
        <div className="camera-status">
          <span className="gps-lock-dot locked" />
          <span>GPS locked {formatAccuracy(liveLocation.accuracy)}</span>
        </div>
      </div>

      <div className="camera-viewport">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Go back
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="camera-video" playsInline muted autoPlay />
            {!ready && <div className="camera-loading">Starting camera…</div>}
            {ready && <PhotoStampOverlay data={stampPreview} className="camera-stamp-preview" />}
            {!error && ready && (
              <div className="camera-controls-float">
                <button
                  type="button"
                  className="camera-shutter"
                  onClick={handleCapture}
                  disabled={capturing}
                  aria-label="Capture photo"
                >
                  <span className="camera-shutter-ring" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
