export interface GeoAddress {
  line: string
  street: string | null
  pincode: string | null
  locality: string | null
}

export interface GpsReading {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
  address?: GeoAddress
}

export type GpsLockState = 'idle' | 'searching' | 'locked' | 'error'

export type LocationPermissionState = PermissionState | 'unsupported'

/** Target accuracy for instant lock (meters) */
export const GPS_GOOD_ACCURACY = 20
/** Acceptable accuracy after brief wait (meters) */
export const GPS_OK_ACCURACY = 50
/** Fallback lock after this duration (ms) */
export const GPS_MAX_WAIT_MS = 25000
/** Minimum wait before accepting OK accuracy (ms) */
export const GPS_OK_WAIT_MS = 6000

export function isSecureContextForGps(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

export async function getLocationPermissionState(): Promise<LocationPermissionState> {
  if (!navigator.permissions?.query) return 'unsupported'
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'unsupported'
  }
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export function formatAccuracy(meters: number): string {
  return `±${Math.round(meters)}m`
}

function buildAddressLine(data: Record<string, string | undefined>): GeoAddress {
  const pincode = data.postcode ?? null
  const street =
    data.road ??
    data.pedestrian ??
    data.footway ??
    data.residential ??
    data.neighbourhood ??
    null
  const parts = [
    street,
    data.neighbourhood ?? data.suburb,
    data.city_district ?? data.city ?? data.town,
    data.state,
  ].filter(Boolean)

  return {
    line: parts.join(', ') || 'Address unavailable',
    street,
    pincode,
    locality: data.city_district ?? data.suburb ?? data.city ?? null,
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    return { line: 'Address lookup failed', street: null, pincode: null, locality: null }
  }

  const json = (await res.json()) as { address?: Record<string, string> }
  return buildAddressLine(json.address ?? {})
}

function readingFromPosition(pos: GeolocationPosition): GpsReading {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    timestamp: pos.timestamp,
  }
}

export function geolocationErrorMessage(err: GeolocationPositionError): string {
  if (!isSecureContextForGps()) {
    return 'GPS needs a secure connection. Use https:// or open via localhost — not a plain http:// IP address.'
  }
  if (err.code === err.PERMISSION_DENIED) {
    return 'Location blocked. Tap Enable GPS and allow when prompted, or enable location for this site in browser settings.'
  }
  if (err.code === err.TIMEOUT) {
    return 'GPS timed out. Move near a window or outdoors, then try again.'
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return 'GPS unavailable. Turn on device location services and try again.'
  }
  return 'Could not get GPS fix.'
}

function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/** Prime permission + first fix — must be called from a user gesture when permission is "prompt". */
export async function getPositionWithFallback(): Promise<GpsReading> {
  if (!isGeolocationAvailable()) {
    throw new Error('GPS is not available on this device.')
  }
  if (!isSecureContextForGps()) {
    throw new Error(
      'GPS needs a secure connection. Use https:// or open via localhost — not a plain http:// IP address.',
    )
  }

  try {
    const pos = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 22000,
      maximumAge: 0,
    })
    return readingFromPosition(pos)
  } catch (err) {
    const geoErr = err as GeolocationPositionError
    if (geoErr.code === geoErr.TIMEOUT) {
      const pos = await getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 120000,
      })
      return readingFromPosition(pos)
    }
    throw new Error(geolocationErrorMessage(geoErr))
  }
}

export interface GpsLockCallbacks {
  onUpdate: (reading: GpsReading, locked: boolean) => void
  onError: (message: string) => void
}

export function startGpsLock(callbacks: GpsLockCallbacks): () => void {
  if (!isGeolocationAvailable()) {
    callbacks.onError('GPS is not available on this device.')
    return () => {}
  }
  if (!isSecureContextForGps()) {
    callbacks.onError(
      'GPS needs a secure connection. Use https:// or open via localhost — not a plain http:// IP address.',
    )
    return () => {}
  }

  const startTime = Date.now()
  let best: GpsReading | null = null
  let locked = false
  let geocodeSeq = 0
  let geocodeTimer: ReturnType<typeof setTimeout> | null = null
  let watchId: number | null = null
  let cancelled = false

  const scheduleGeocode = (reading: GpsReading) => {
    if (geocodeTimer) clearTimeout(geocodeTimer)
    geocodeTimer = setTimeout(async () => {
      const seq = ++geocodeSeq
      try {
        const address = await reverseGeocode(reading.lat, reading.lng)
        if (seq !== geocodeSeq || cancelled) return
        const enriched = { ...reading, address }
        if (best && best.timestamp === reading.timestamp) {
          best = enriched
        }
        callbacks.onUpdate(enriched, locked)
      } catch {
        /* keep coords without address */
      }
    }, 500)
  }

  const evaluateLock = (reading: GpsReading) => {
    const elapsed = Date.now() - startTime
    return (
      reading.accuracy <= GPS_GOOD_ACCURACY ||
      (elapsed >= GPS_OK_WAIT_MS && reading.accuracy <= GPS_OK_ACCURACY) ||
      (elapsed >= GPS_MAX_WAIT_MS && reading.accuracy <= 120) ||
      elapsed >= GPS_MAX_WAIT_MS + 5000
    )
  }

  const applyReading = (reading: GpsReading) => {
    if (cancelled) return

    if (!best || reading.accuracy < best.accuracy) {
      best = reading
      scheduleGeocode(reading)
    }

    const current = best ?? reading

    if (!locked && evaluateLock(current)) {
      locked = true
      callbacks.onUpdate(current, true)
      return
    }

    if (!locked) {
      callbacks.onUpdate(current, false)
    }
  }

  const beginWatch = () => {
    watchId = navigator.geolocation.watchPosition(
      (pos) => applyReading(readingFromPosition(pos)),
      (err) => {
        if (cancelled || locked) return
        callbacks.onError(geolocationErrorMessage(err))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    )
  }

  getPositionWithFallback()
    .then((reading) => {
      if (cancelled) return
      applyReading(reading)
      beginWatch()
    })
    .catch((err) => {
      if (cancelled) return
      callbacks.onError(err instanceof Error ? err.message : 'Could not get GPS fix.')
    })

  return () => {
    cancelled = true
    if (geocodeTimer) clearTimeout(geocodeTimer)
    if (watchId != null) navigator.geolocation.clearWatch(watchId)
  }
}
