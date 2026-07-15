import { createContext, useContext, type ReactNode } from 'react'
import { useGpsLock } from '../hooks/useGpsLock'
import type { GpsLockState, GpsReading } from '../lib/geolocation'

interface GpsContextValue {
  state: GpsLockState
  reading: GpsReading | null
  error: string | null
  start: () => void
  retry: () => void
}

const GpsContext = createContext<GpsContextValue | null>(null)

export function GpsProvider({ children }: { children: ReactNode }) {
  const gps = useGpsLock({ enabled: true })

  return <GpsContext.Provider value={gps}>{children}</GpsContext.Provider>
}

export function useGps(): GpsContextValue {
  const ctx = useContext(GpsContext)
  if (!ctx) {
    throw new Error('useGps must be used within GpsProvider')
  }
  return ctx
}
