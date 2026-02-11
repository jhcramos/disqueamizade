import { useState, useEffect, useCallback, useRef } from 'react'

export interface StageUser {
  userId: string
  username: string
  joinedAt: number
  isMicOn: boolean
  isCameraOn: boolean
}

export interface QueueEntry {
  userId: string
  username: string
  requestedAt: number
}

export interface StageState {
  performer: StageUser | null
  queue: QueueEntry[]
  isTransitioning: boolean
}

const BOT_STAGE_NAMES = [
  'gabizinha_22', 'thiago.m', 'bruninha💜', 'duda_carioca', 'leoferreira',
  'juh.santos', 'marquinhos_zl', 'carol.vibes', 'ricardooo', 'natyyy_',
]

export function useStage(currentUserId: string, currentUsername: string) {
  const [performer, setPerformer] = useState<StageUser | null>(null)
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [stageTimer, setStageTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const botQueueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stage timer
  useEffect(() => {
    if (performer) {
      setStageTimer(0)
      timerRef.current = setInterval(() => {
        setStageTimer(prev => prev + 1)
      }, 1000)
    } else {
      setStageTimer(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [performer?.userId])

  // Simulate bots joining queue randomly
  useEffect(() => {
    const scheduleBotQueue = () => {
      const delay = 20000 + Math.random() * 40000
      botQueueTimerRef.current = setTimeout(() => {
        const availableBots = BOT_STAGE_NAMES.filter(
          name => performer?.username !== name && !queue.some(q => q.username === name)
        )
        if (availableBots.length > 0 && Math.random() < 0.4) {
          const botName = availableBots[Math.floor(Math.random() * availableBots.length)]
          setQueue(prev => [...prev, {
            userId: `bot-${botName}`,
            username: botName,
            requestedAt: Date.now(),
          }])
        }
        scheduleBotQueue()
      }, delay)
    }
    scheduleBotQueue()
    return () => { if (botQueueTimerRef.current) clearTimeout(botQueueTimerRef.current) }
  }, [performer, queue])

  // Simulate bot performer leaving after 30-90s
  useEffect(() => {
    if (!performer || !performer.userId.startsWith('bot-')) return
    const duration = 30000 + Math.random() * 60000
    const timer = setTimeout(() => {
      leaveStage()
    }, duration)
    return () => clearTimeout(timer)
  }, [performer?.userId])

  const joinStage = useCallback(() => {
    if (performer) {
      // Add to queue
      if (queue.some(q => q.userId === currentUserId)) return
      setQueue(prev => [...prev, {
        userId: currentUserId,
        username: currentUsername,
        requestedAt: Date.now(),
      }])
      return 'queued'
    }
    // Stage is free
    setPerformer({
      userId: currentUserId,
      username: currentUsername,
      joinedAt: Date.now(),
      isMicOn: true,
      isCameraOn: true,
    })
    return 'on-stage'
  }, [performer, queue, currentUserId, currentUsername])

  const leaveStage = useCallback(() => {
    if (!performer) return null
    const leavingName = performer.username

    setIsTransitioning(true)

    // Promote next in queue
    if (queue.length > 0) {
      const next = queue[0]
      setTimeout(() => {
        setPerformer({
          userId: next.userId,
          username: next.username,
          joinedAt: Date.now(),
          isMicOn: true,
          isCameraOn: true,
        })
        setQueue(prev => prev.slice(1))
        setIsTransitioning(false)
      }, 1500)
    } else {
      setPerformer(null)
      setTimeout(() => setIsTransitioning(false), 1000)
    }

    const nextName = queue.length > 0 ? queue[0].username : null
    return { leavingName, nextName }
  }, [performer, queue])

  const leaveQueue = useCallback(() => {
    setQueue(prev => prev.filter(q => q.userId !== currentUserId))
  }, [currentUserId])

  const toggleStageMic = useCallback(() => {
    if (performer?.userId === currentUserId) {
      setPerformer(prev => prev ? { ...prev, isMicOn: !prev.isMicOn } : null)
    }
  }, [performer, currentUserId])

  const toggleStageCamera = useCallback(() => {
    if (performer?.userId === currentUserId) {
      setPerformer(prev => prev ? { ...prev, isCameraOn: !prev.isCameraOn } : null)
    }
  }, [performer, currentUserId])

  const isOnStage = performer?.userId === currentUserId
  const isInQueue = queue.some(q => q.userId === currentUserId)
  const queuePosition = queue.findIndex(q => q.userId === currentUserId) + 1

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    performer,
    queue,
    isTransitioning,
    stageTimer,
    formatTimer,
    joinStage,
    leaveStage,
    leaveQueue,
    toggleStageMic,
    toggleStageCamera,
    isOnStage,
    isInQueue,
    queuePosition,
  }
}
