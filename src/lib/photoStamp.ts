export interface PhotoStampData {
  lat: number
  lng: number
  address: string
  streetName: string | null
  pincode: string | null
  wardName: string | null
  capturedAt: Date
  issueType: string
}

export interface StampLine {
  text: string
  accent?: boolean
}

const MAX_ISSUE_LEN = 36
const MAX_STREET_LEN = 32
const MAX_WARD_LEN = 24

export function formatStampDateTime(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function streetAndWardPrefix(data: PhotoStampData): string {
  const parts: string[] = []
  if (data.streetName) parts.push(truncate(data.streetName, MAX_STREET_LEN))
  if (data.wardName) parts.push(truncate(data.wardName, MAX_WARD_LEN))
  return parts.length ? `${parts.join(' · ')} · ` : ''
}

/** Compact 2-line stamp — keeps the frame clear for computer vision. */
export function getStampLines(data: PhotoStampData): StampLine[] {
  const { date, time } = formatStampDateTime(data.capturedAt)
  const pin = data.pincode ? ` · ${data.pincode}` : ''
  const coords = `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`
  const place = streetAndWardPrefix(data)

  return [
    { text: truncate(data.issueType, MAX_ISSUE_LEN), accent: true },
    { text: `${place}${coords}${pin} · ${date} ${time}` },
  ]
}

function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
): void {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.lineWidth = Math.max(2, ctx.lineWidth)
  ctx.lineJoin = 'round'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
}

export function drawPhotoStamp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: PhotoStampData,
): void {
  const lines = getStampLines(data)
  const pad = Math.max(8, Math.round(width * 0.02))
  const fontSize = Math.max(10, Math.round(width * 0.022))
  const lineHeight = Math.round(fontSize * 1.35)

  ctx.font = `600 ${fontSize}px "IBM Plex Mono", ui-monospace, monospace`
  ctx.textBaseline = 'bottom'

  const startY = height - pad

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    const y = startY - (lines.length - 1 - i) * lineHeight
    const fill = line.accent ? '#D71921' : '#FFFFFF'
    drawOutlinedText(ctx, line.text, pad, y, fill)
  }
}

export async function captureVideoFrameWithStamp(
  video: HTMLVideoElement,
  data: PhotoStampData,
): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 1280
  canvas.height = video.videoHeight || 720
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  drawPhotoStamp(ctx, canvas.width, canvas.height, data)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  )
  if (!blob) throw new Error('Capture failed')

  return new File([blob], `chudu-${Date.now()}.jpg`, { type: 'image/jpeg' })
}

export function buildStampData(
  lat: number,
  lng: number,
  address: string,
  pincode: string | null,
  issueType: string,
  capturedAt = new Date(),
  wardName: string | null = null,
  streetName: string | null = null,
): PhotoStampData {
  return {
    lat,
    lng,
    address,
    streetName,
    pincode,
    wardName,
    issueType,
    capturedAt,
  }
}

/** Structured metadata for CV / downstream pipelines (stored with report). */
export function stampToCvMetadata(data: PhotoStampData) {
  const { date, time } = formatStampDateTime(data.capturedAt)
  return {
    issue_type: data.issueType,
    street_name: data.streetName,
    ward_name: data.wardName,
    latitude: data.lat,
    longitude: data.lng,
    pincode: data.pincode,
    address: data.address,
    captured_date: date,
    captured_time: time,
    captured_at_iso: data.capturedAt.toISOString(),
  }
}
