import { InteractiveGlobe } from './InteractiveGlobe'
import './compliance-orbit.css'

/** Decorative counterpart to the main globe, without payment routes or controls. */
export function ComplianceOrbit() {
  return (
    <div className="compliance-orbit" aria-hidden="true">
      <InteractiveGlobe variant="ambient" />
    </div>
  )
}
