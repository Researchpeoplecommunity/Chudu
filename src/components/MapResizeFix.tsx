import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/** Leaflet needs invalidateSize when the map container flex/layout changes. */
export default function MapResizeFix() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const parent = container.parentElement

    const fix = () => {
      map.invalidateSize({ animate: false })
    }

    fix()
    const timers = [50, 150, 400, 800].map((ms) => window.setTimeout(fix, ms))

    const observer = new ResizeObserver(fix)
    observer.observe(container)
    if (parent) observer.observe(parent)

    window.addEventListener('resize', fix)
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      observer.disconnect()
      window.removeEventListener('resize', fix)
    }
  }, [map])

  return null
}
