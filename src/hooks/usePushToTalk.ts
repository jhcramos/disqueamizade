import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePushToTalkOptions {
  onTalkStart?: () => void
  onTalkEnd?: () => void
  enabled?: boolean
}

export function usePushToTalk({ onTalkStart, onTalkEnd, enabled = true }: UsePushToTalkOptions = {}) {
  const [isTalking, setIsTalking] = useState(false)
  const talkingRef = useRef(false)

  const holdToTalk = useCallback(() => {
    if (!enabled || talkingRef.current) return
    talkingRef.current = true
    setIsTalking(true)
    onTalkStart?.()
  }, [enabled, onTalkStart])

  const releaseTalk = useCallback(() => {
    if (!talkingRef.current) return
    talkingRef.current = false
    setIsTalking(false)
    onTalkEnd?.()
  }, [onTalkEnd])

  // Spacebar listener
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target as HTMLElement)?.closest('input, textarea, [contenteditable]')) {
        e.preventDefault()
        holdToTalk()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        releaseTalk()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled, holdToTalk, releaseTalk])

  // Safety: release on blur/visibility change
  useEffect(() => {
    const release = () => releaseTalk()
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', release)
    return () => {
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', release)
    }
  }, [releaseTalk])

  return { isTalking, holdToTalk, releaseTalk }
}
