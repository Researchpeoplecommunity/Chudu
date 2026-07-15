import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getLocationPermissionState,
  isGeolocationAvailable,
  isSecureContextForGps,
  startGpsLock,
  type GpsLockState,
  type GpsReading,
} from '../lib/geolocation'

interface UseGpsLockOptions {
  enabled?: boolean
}

export function useGpsLock({ enabled = true }: UseGpsLockOptions = {}) {
  const [state, setState] = useState<GpsLockState>('idle')
  const [reading, setReading] = useState<GpsReading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const startedRef = useRef(false)

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    startedRef.current = false
  }, [])

  const start = useCallback(() => {
    if (!enabled) return

    if (!isGeolocationAvailable()) {
      setError('GPS is not available on this device.')
      setState('error')
      return
    }

    if (!isSecureContextForGps()) {
      setError(
        'GPS needs a secure connection. Use https:// or open via localhost — not a plain http:// IP address.',
      )
      setState('error')
      return
    }

    stop()
    startedRef.current = true
    setState('searching')
    setError(null)
    setReading(null)

    stopRef.current = startGpsLock({
      onUpdate: (next, locked) => {
        setReading(next)
        setState(locked ? 'locked' : 'searching')
        if (locked) setError(null)
      },
      onError: (message) => {
        setError(message)
        setState('error')
      },
    })
  }, [enabled, stop])

  useEffect(() => {
    if (!enabled) {
      stop()
      setState('idle')
      return
    }

    let cancelled = false

    async function maybeAutoStart() {
      if (!isGeolocationAvailable()) {
        setState('error')
        setError('GPS is not available on this device.')
        return
      }

      if (!isSecureContextForGps()) {
        setState('error')
        setError(
          'GPS needs a secure connection. Use https:// or open via localhost — not a plain http:// IP address.',
        )
        return
      }

      const permission = await getLocationPermissionState()
      if (cancelled || startedRef.current) return

      if (permission === 'granted') {
        start()
      } else if (permission === 'denied') {
        setState('error')
        setError(
          'Location blocked for this site. Enable location in browser settings, then tap Enable GPS.',
        )
      } else {
        setState('idle')
      }
    }

    maybeAutoStart()

    return () => {
      cancelled = true
      stop()
    }
  }, [enabled, start, stop])

  return { state, reading, error, start, retry: start, stop }
}
