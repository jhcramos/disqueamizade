/**
 * GrainOverlay - Subtle TV static effect for 90s nostalgia
 * 
 * Add this component once at the root of your app (App.tsx)
 * It will overlay a subtle grain texture on the entire screen
 */

interface GrainOverlayProps {
  opacity?: number // 0-1, default 0.03
  enabled?: boolean
}

export const GrainOverlay = ({ opacity = 0.03, enabled = true }: GrainOverlayProps) => {
  if (!enabled) return null

  return (
    <div
      className="grain-overlay"
      style={{ opacity }}
      aria-hidden="true"
    />
  )
}

export default GrainOverlay
