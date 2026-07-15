interface ViewToggleProps {
  view: 'map' | 'list'
  onChange: (view: 'map' | 'list') => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle">
      <button
        type="button"
        className={view === 'map' ? 'active' : ''}
        onClick={() => onChange('map')}
      >
        Map
      </button>
      <button
        type="button"
        className={view === 'list' ? 'active' : ''}
        onClick={() => onChange('list')}
      >
        List
      </button>
    </div>
  )
}
