import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="about-section">
      <h2 className="page-title">How Chudu Works</h2>

      <p>
        <strong>Chudu</strong> (Telugu: &quot;look/see&quot;) is a civic reporting tool for water
        supply and sewerage issues in Hyderabad. You see the problem — we make the authority see it
        too.
      </p>

      <h3>30-Second Reporting</h3>
      <ul>
        <li>Snap a photo of the issue</li>
        <li>GPS auto-detects your ward</li>
        <li>Pick one category — done</li>
        <li>No login required</li>
      </ul>

      <h3>Administrative Routing</h3>
      <p>Every report is mapped to the exact office responsible:</p>
      <div className="hierarchy-flow">
        <span>Ward</span>
        <span className="arrow">→</span>
        <span>Circle</span>
        <span className="arrow">→</span>
        <span>Division</span>
        <span className="arrow">→</span>
        <span>Zone</span>
        <span className="arrow">→</span>
        <span>Municipal Corporation</span>
      </div>
      <p>
        Hyderabad has 292 wards across 60 circles, 24 divisions, 12 zones, and 3 municipal
        corporations (Hyderabad, Cyberabad, Malkajgiri) — all managed by HMWSSB.
      </p>

      <h3>Accountability</h3>
      <p>
        The public live map and leaderboard rank zones, circles, and divisions by open complaints
        and resolution rates — attributing to the <em>office</em>, not named individuals.
      </p>

      <h3>Open Stack</h3>
      <ul>
        <li>OpenStreetMap for maps (free, no API key)</li>
        <li>GHMC ward boundaries from open civic data</li>
        <li>Works offline — reports queue and sync later</li>
        <li>Install as a PWA on your phone</li>
      </ul>

      <Link to="/report" className="btn btn-primary btn-lg" style={{ marginTop: '1.5rem' }}>
        Report an Issue Now
      </Link>
    </div>
  )
}
