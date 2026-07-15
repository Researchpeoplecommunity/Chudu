import { getStampLines, type PhotoStampData } from '../lib/photoStamp'

interface PhotoStampOverlayProps {
  data: PhotoStampData
  className?: string
}

export default function PhotoStampOverlay({ data, className = '' }: PhotoStampOverlayProps) {
  const lines = getStampLines(data)

  return (
    <div className={`photo-stamp-overlay ${className}`.trim()} aria-hidden>
      {lines.map((line, i) => (
        <p key={i} className={line.accent ? 'stamp-accent' : undefined}>
          {line.text}
        </p>
      ))}
    </div>
  )
}
