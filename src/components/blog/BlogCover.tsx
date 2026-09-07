import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

/** Keeps editorial cards composed even when an older article has no cover. */
export function BlogCover({ src, alt }: { src?: string; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | undefined>()
  const candidate = src === failedSource ? src?.replace(/\.png$/, '.webp') : src
  const [failedFallback, setFailedFallback] = useState<string | undefined>()
  return <div className="journal-cover">
    <div aria-hidden="true" className="journal-cover-art"><MessageCircle strokeWidth={1} /><span>conversas<br /><em>que conectam.</em></span></div>
    {candidate && candidate !== failedFallback && <img src={candidate} alt={alt} loading="lazy" onError={() => {
      if (src === failedSource || candidate === candidate.replace(/\.png$/, '.webp')) setFailedFallback(candidate)
      else setFailedSource(src)
    }} />}
  </div>
}
