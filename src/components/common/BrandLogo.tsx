/** Shared horizontal lockup of the approved vintage-phone + video-camera mark. */
export function BrandLogo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return <span className={`brand-logo ${compact ? 'brand-logo-compact' : ''} ${className}`} aria-label="Disque Amizade" role="img">
    <img src="/brand/mark.svg" width="48" height="44" alt="" aria-hidden="true" />
    {!compact && <span aria-hidden="true">disque amizade</span>}
  </span>
}
