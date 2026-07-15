type IconProps = { size?: number; className?: string; strokeWidth?: number }

function base({ size = 22, className = '', strokeWidth = 1.75 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `icon-svg ${className}`.trim(),
    'aria-hidden': true,
  }
}

export function IconHome(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  )
}

export function IconCamera(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <path d="M4 8h2.5l1.5-2h8l1.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3.25" />
    </svg>
  )
}

export function IconMap(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

export function IconChart(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <path d="M5 19V9M10 19V5M15 19v-7M20 19V11" />
    </svg>
  )
}

export function IconInfo(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

export function IconClose(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

export function IconChevronDown(props: IconProps) {
  const p = base(props)
  return (
    <svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconDot({ className = '' }: { className?: string }) {
  return <span className={`brand-dot ${className}`.trim()} aria-hidden />
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <circle cx="16" cy="14" r="5.5" stroke="#fff" strokeWidth="1.75" />
      <circle cx="16" cy="14" r="1.75" fill="#D71921" />
      <path d="M10 24c2-2 4-3 6-3s4 1 6 3" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}
