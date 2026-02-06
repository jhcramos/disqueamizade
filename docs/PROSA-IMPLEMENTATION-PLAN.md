# 🗣️ PROSA - Implementation Plan
## From Disque Amizade → Friendship-Focused Platform

**Strategy:** MINIMUM CHANGES for MAXIMUM IMPACT  
**Philosophy:** Keep what works, enhance what matters, remove noise

---

## 📊 EXECUTIVE SUMMARY

| Category | Count | Effort |
|----------|-------|--------|
| KEEP (as-is) | 8 features | 0 days |
| MODIFY | 5 features | 5-7 days |
| ADD | 6 new features | 10-14 days |
| REMOVE | 3 features | 1 day |

**Total Estimated:** 16-22 development days

---

## ✅ KEEP (Preserve These - They're Great!)

### 1. Auth System
- **Files:** `src/store/authStore.ts`, `src/components/auth/*`, `src/pages/AuthPage.tsx`
- **Why keep:** Solid Supabase integration, guest mode, Google OAuth ready
- **No changes needed**

### 2. Video Infrastructure
- **Files:** `src/hooks/useCamera.ts`, `src/hooks/useLiveKit.ts`, `src/components/video/VideoRoom.tsx`
- **Why keep:** LiveKit ready, camera hooks working, video stream management
- **Enhancement:** Will be reused for Sala de Dois and Turma de 7

### 3. AI Face Masks (Filtros)
- **Files:** `src/components/video/masks/*`, `src/pages/VideoFiltersPage.tsx`
- **Why keep:** Fun, unique differentiator (Jaspion, anime, etc.)
- **Rename opportunity:** "Filtros de Prosa" - use masks to break ice

### 4. Fichas System (Virtual Currency)
- **Files:** `src/store/fichaStore.ts`, `src/components/fichas/*`, `src/pages/PricingPage.tsx`
- **Why keep:** Monetization is essential
- **Repurpose:** Fichas unlock premium activities, not just gifts

### 5. Mobile Navigation
- **Files:** `src/components/common/MobileNav.tsx`, `src/components/common/Header.tsx`
- **Why keep:** Clean, functional, mobile-first

### 6. Profile System
- **Files:** `src/pages/ProfilePage.tsx`, `src/types/index.ts` (Profile type)
- **Why keep:** Base for friendship/XP progression
- **Enhance:** Add XP, friends list, journey progress

### 7. Stories/Reels
- **Files:** `src/pages/StoriesPage.tsx`, `src/data/mockStories.ts`
- **Why keep:** Engagement feature, show personality before matching
- **Rename:** "Momentos" - share what you're doing

### 8. Toast/Notification System
- **Files:** `src/components/common/ToastContainer.tsx`, `src/store/notificationStore.ts`
- **Why keep:** Essential UX infrastructure

---

## 🔄 MODIFY (Adjust These Features)

### MOD-1: Transform Roulette → Sala de Dois
**Files to modify:**
- `src/pages/RoulettePage.tsx` → Rename to `SalaDeDoisPage.tsx`
- `src/types/index.ts` (add conversation phase types)

**Changes:**
```typescript
// NEW: Add to types/index.ts
export type ConversationPhase = 'pipoca' | 'cafe' | 'cachaca'
export type ConversationPrompt = {
  id: string
  phase: ConversationPhase
  text_pt: string
  category: 'leve' | 'pessoal' | 'profunda'
}

export interface SalaDeDoisSession {
  id: string
  partner: RouletteMatch['partner']
  phase: ConversationPhase
  prompts_used: string[]
  started_at: string
  xp_earned: number
}
```

**UI Changes:**
1. Replace "Roleta 1:1" branding → "Sala de Dois"
2. Add phase indicator (🍿 → ☕ → 🥃)
3. Add floating prompt cards that appear every 2-3 minutes
4. Add "Avançar Fase" button (after 5 min in current phase)
5. Add timer showing time together (builds connection)

**Effort:** 2-3 days

---

### MOD-2: Simplify Rooms → Entry Point for Turma de 7
**Files to modify:**
- `src/pages/RoomsPage.tsx`
- `src/data/mockRooms.ts` (reduce from 55 to ~15 essential rooms)

**Changes:**
1. Keep ONLY these room categories:
   - 5 major cities (SP, RJ, BH, CWB, POA)
   - 5 hobbies (Música, Games, Filmes, Livros, Fitness)
   - 5 special (Geral, Noite, LGBTQ+, +40, English)
   
2. Add "Encontrar Turma" CTA in each room
3. Rooms become DISCOVERY zones, not main feature

**Effort:** 1 day

---

### MOD-3: Enhance Profile → Friendship Journey Profile
**Files to modify:**
- `src/pages/ProfilePage.tsx`
- `src/types/index.ts` (extend Profile type)

**Add to Profile type:**
```typescript
// Extend existing Profile
export interface ProseProfile extends Profile {
  xp_total: number
  level: number
  level_title: string // "Novato" → "Amigo" → "Parceiro" → "Irmão"
  
  // Friends system
  friends: FriendConnection[]
  pending_requests: string[]
  turmas: string[] // IDs of Turmas de 7
  
  // Journey stats
  conversations_completed: number
  phases_unlocked: number
  longest_friendship_days: number
  
  // Preferences
  preferred_phase: ConversationPhase
  active_hours: string[]
}

export interface FriendConnection {
  user_id: string
  met_at: string
  journey_day: number // 1-7
  last_chat: string
  shared_activities: string[]
  intimacy_level: 'stranger' | 'known' | 'friend' | 'close_friend'
}
```

**UI Changes:**
1. Add XP bar and level badge to profile
2. Add "Minhas Turmas" section
3. Add "Amigos" tab with journey progress per friend
4. Add achievement badges

**Effort:** 2 days

---

### MOD-4: HomePage → Prosa-Focused Entry Points
**Files to modify:**
- `src/pages/HomePage.tsx`
- Update hero, CTAs, features section

**Changes:**
1. New hero: "Faça amigos de verdade"
2. Primary CTA: "Iniciar Conversa" → Sala de Dois
3. Secondary: "Encontrar Turma" → Turma de 7 matching
4. Remove: Marketplace focus from hero
5. Add: "Sua Jornada" progress widget (if logged in)
6. Add: "Amigos Online" quick list

**Effort:** 1 day

---

### MOD-5: Rename App → Prosa
**Files to modify:**
- `index.html` (title)
- `src/data/mockRooms.ts` (owner username)
- `README.md`
- `package.json` (name)

**Global find/replace:**
- "Disque Amizade" → "Prosa"
- "disqueamizade" → "prosa"
- "disque_amizade" → "prosa_oficial"

**Effort:** 0.5 day

---

## ➕ ADD (New Features to Build)

### ADD-1: Conversa Guiada System (Core Feature!)
**New files:**
- `src/data/conversationPrompts.ts`
- `src/components/prosa/PromptCard.tsx`
- `src/components/prosa/PhaseIndicator.tsx`
- `src/hooks/useConversation.ts`

**conversationPrompts.ts:**
```typescript
export const prompts: ConversationPrompt[] = [
  // 🍿 PIPOCA (Light, fun, safe)
  { id: 'p1', phase: 'pipoca', text_pt: 'Qual foi o último filme que te fez chorar?', category: 'leve' },
  { id: 'p2', phase: 'pipoca', text_pt: 'Se você pudesse jantar com qualquer pessoa, quem seria?', category: 'leve' },
  { id: 'p3', phase: 'pipoca', text_pt: 'Qual sua comfort food?', category: 'leve' },
  { id: 'p4', phase: 'pipoca', text_pt: 'Você é mais praia ou montanha?', category: 'leve' },
  { id: 'p5', phase: 'pipoca', text_pt: 'Qual música você não aguenta mais ouvir?', category: 'leve' },
  
  // ☕ CAFÉ (Personal, getting deeper)
  { id: 'c1', phase: 'cafe', text_pt: 'O que te faz perder a noção do tempo?', category: 'pessoal' },
  { id: 'c2', phase: 'cafe', text_pt: 'Qual foi o melhor conselho que você já recebeu?', category: 'pessoal' },
  { id: 'c3', phase: 'cafe', text_pt: 'O que você queria ser quando criança?', category: 'pessoal' },
  { id: 'c4', phase: 'cafe', text_pt: 'Qual foi sua maior virada de jogo na vida?', category: 'pessoal' },
  { id: 'c5', phase: 'cafe', text_pt: 'O que você faria se não tivesse medo?', category: 'pessoal' },
  
  // 🥃 CACHAÇA (Deep, vulnerable, meaningful)
  { id: 'x1', phase: 'cachaca', text_pt: 'Qual foi a última vez que você se sentiu realmente em paz?', category: 'profunda' },
  { id: 'x2', phase: 'cachaca', text_pt: 'O que você gostaria de ter aprendido mais cedo?', category: 'profunda' },
  { id: 'x3', phase: 'cachaca', text_pt: 'Qual relacionamento moldou quem você é hoje?', category: 'profunda' },
  { id: 'x4', phase: 'cachaca', text_pt: 'O que você ainda quer realizar antes de morrer?', category: 'profunda' },
  { id: 'x5', phase: 'cachaca', text_pt: 'Sobre o que você mudou de opinião nos últimos anos?', category: 'profunda' },
]

export const phaseConfig = {
  pipoca: { emoji: '🍿', name: 'Pipoca', color: 'amber', minMinutes: 5 },
  cafe: { emoji: '☕', name: 'Café', color: 'orange', minMinutes: 10 },
  cachaca: { emoji: '🥃', name: 'Cachaça', color: 'purple', minMinutes: 15 },
}
```

**PromptCard.tsx:**
- Floating card that appears with a prompt
- "Responder" button to dismiss and earn XP
- Can skip (but no XP)
- Appears every 2-3 minutes during conversation

**Effort:** 2-3 days

---

### ADD-2: Turma de 7 (Persistent Friend Groups)
**New files:**
- `src/pages/TurmaPage.tsx`
- `src/pages/TurmasPage.tsx` (list of your turmas)
- `src/components/turma/TurmaCard.tsx`
- `src/components/turma/TurmaChat.tsx`
- `src/store/turmaStore.ts`
- `src/types/turma.ts`

**Data structure:**
```typescript
// src/types/turma.ts
export interface Turma {
  id: string
  name: string
  emoji: string
  members: TurmaMember[]
  created_at: string
  last_activity: string
  chat_room_id: string
  activities_completed: number
  next_scheduled?: string
}

export interface TurmaMember {
  user_id: string
  username: string
  avatar_url: string
  role: 'founder' | 'member'
  joined_at: string
  xp_contributed: number
  is_online: boolean
}

export type TurmaActivity = 
  | 'movie_night'
  | 'game_session'
  | 'cooking_together'
  | 'karaoke'
  | 'book_club'
  | 'workout'
  | 'just_chat'
```

**Features:**
1. Create turma from successful Sala de Dois matches
2. Invite up to 6 others (7 total including you)
3. Group video chat with activity modes
4. Scheduled meetups (notifications)
5. Turma XP (collective progress)

**Effort:** 3-4 days

---

### ADD-3: XP & Level System
**New files:**
- `src/store/xpStore.ts`
- `src/components/xp/XPBar.tsx`
- `src/components/xp/LevelBadge.tsx`
- `src/data/xpConfig.ts`

**xpConfig.ts:**
```typescript
export const XP_ACTIONS = {
  // Conversations
  complete_pipoca: 10,
  complete_cafe: 25,
  complete_cachaca: 50,
  answer_prompt: 5,
  first_conversation_today: 15,
  
  // Friendships
  add_friend: 20,
  complete_journey_day: 30,
  complete_7_day_journey: 200,
  
  // Turmas
  create_turma: 50,
  join_turma: 25,
  turma_activity: 40,
  
  // Engagement
  daily_login: 5,
  streak_7_days: 100,
  refer_friend: 150,
}

export const LEVELS = [
  { level: 1, title: 'Novato', xp_required: 0, emoji: '🌱' },
  { level: 2, title: 'Curioso', xp_required: 100, emoji: '🔍' },
  { level: 3, title: 'Prosador', xp_required: 300, emoji: '💬' },
  { level: 4, title: 'Amigo', xp_required: 600, emoji: '🤝' },
  { level: 5, title: 'Parceiro', xp_required: 1000, emoji: '⭐' },
  { level: 6, title: 'Irmão', xp_required: 2000, emoji: '👑' },
  { level: 7, title: 'Lenda', xp_required: 5000, emoji: '🏆' },
]
```

**Effort:** 1-2 days

---

### ADD-4: Jornada de 7 Dias (Friendship Progression)
**New files:**
- `src/components/journey/JourneyTracker.tsx`
- `src/components/journey/DayCard.tsx`
- `src/hooks/useFriendship.ts`

**Concept:**
- When you "add friend" after Sala de Dois, a 7-day journey starts
- Each day has a suggested activity/topic
- Complete all 7 = permanent friend + big XP bonus
- Tracks: last chat, streak, shared memories

**Journey Days:**
```typescript
export const JOURNEY_DAYS = [
  { day: 1, theme: 'Apresentação', activity: 'Share 3 fun facts about yourself' },
  { day: 2, theme: 'Curiosidades', activity: 'Play 2 truths 1 lie' },
  { day: 3, theme: 'Memórias', activity: 'Share a childhood memory' },
  { day: 4, theme: 'Sonhos', activity: 'Discuss bucket list items' },
  { day: 5, theme: 'Desafios', activity: 'Share a challenge you overcame' },
  { day: 6, theme: 'Valores', activity: 'What matters most to you?' },
  { day: 7, theme: 'Futuro', activity: 'Where do you want to be in 5 years?' },
]
```

**Effort:** 2 days

---

### ADD-5: Atividade Junto (In-Call Activities)
**New files:**
- `src/components/activities/ActivitySelector.tsx`
- `src/components/activities/MovieSync.tsx`
- `src/components/activities/TriviaGame.tsx`
- `src/components/activities/KaraokeMode.tsx`

**Activities to build (MVP):**
1. **Trivia Game** - Questions on screen, both answer
2. **Would You Rather** - Swipe left/right, see matches
3. **Movie Sync** - YouTube/Netflix watch party (embed)
4. **Karaoke** - Lyrics display + microphone modes

**Effort:** 3-4 days (start with 2 activities)

---

### ADD-6: Modo Roda (Structured Group Turn-Taking)
**New files:**
- `src/components/roda/RodaMode.tsx`
- `src/components/roda/SpeakerSpotlight.tsx`
- `src/components/roda/TurnQueue.tsx`

**Concept:**
- In group calls (Turma or Rooms), activate "Modo Roda"
- One person speaks at a time (spotlight)
- Timer per person (2-3 min default)
- Queue system: "Raise hand" to join queue
- AI moderator suggests prompts

**Effort:** 2 days

---

## ❌ REMOVE (Cut These Features)

### REM-1: SecretCabinsPage
**Files to remove:**
- `src/pages/SecretCabinsPage.tsx`
- Remove route from `App.tsx`
- Remove from navigation

**Reason:** Adult-focused, conflicts with friendship vibe

---

### REM-2: MarketplacePage (Deprioritize)
**Files to modify:**
- `src/pages/MarketplacePage.tsx` → Keep but hide from main nav
- Remove from `MobileNav.tsx` primary items

**Reason:** Services marketplace distracts from core friendship mission. Keep for Phase 2.

---

### REM-3: Excess Rooms (55 → 15)
**Files to modify:**
- `src/data/mockRooms.ts` → Reduce to 15 essential rooms

**Reason:** Too many choices = paradox of choice. Less is more.

---

## 📋 PRIORITY ORDER (Sprint Plan)

### 🚀 Sprint 1: Core Identity (Days 1-5)
| # | Ticket | Type | Est |
|---|--------|------|-----|
| 1 | MOD-5: Rename to Prosa | Modify | 0.5d |
| 2 | REM-3: Simplify rooms to 15 | Remove | 0.5d |
| 3 | REM-1: Remove SecretCabins | Remove | 0.5d |
| 4 | MOD-1: Roulette → Sala de Dois | Modify | 2d |
| 5 | ADD-1: Conversa Guiada prompts | Add | 2d |

**Sprint 1 Outcome:** Users can have guided 1-on-1 conversations with the core Prosa experience.

---

### 🌱 Sprint 2: Progression & Depth (Days 6-10)
| # | Ticket | Type | Est |
|---|--------|------|-----|
| 6 | ADD-3: XP & Level System | Add | 1.5d |
| 7 | MOD-3: Enhanced Profile | Modify | 2d |
| 8 | ADD-4: Jornada de 7 Dias | Add | 2d |
| 9 | MOD-4: HomePage redesign | Modify | 1d |

**Sprint 2 Outcome:** Users have progression, levels, and can build lasting friendships over 7 days.

---

### 👥 Sprint 3: Groups & Activities (Days 11-16)
| # | Ticket | Type | Est |
|---|--------|------|-----|
| 10 | ADD-2: Turma de 7 | Add | 3d |
| 11 | ADD-5: Atividade Junto (2 activities) | Add | 2.5d |
| 12 | ADD-6: Modo Roda | Add | 2d |
| 13 | REM-2: Deprioritize Marketplace | Modify | 0.5d |

**Sprint 3 Outcome:** Users can form persistent friend groups with structured activities.

---

## 📁 FINAL FILE STRUCTURE

```
src/
├── pages/
│   ├── HomePage.tsx          # Modified (Prosa focus)
│   ├── AuthPage.tsx          # Keep
│   ├── ProfilePage.tsx       # Modified (XP, friends)
│   ├── SalaDeDoisPage.tsx    # Renamed from RoulettePage
│   ├── RoomsPage.tsx         # Simplified (15 rooms)
│   ├── RoomPage.tsx          # Keep (add Modo Roda)
│   ├── TurmasPage.tsx        # NEW
│   ├── TurmaPage.tsx         # NEW
│   ├── StoriesPage.tsx       # Keep (rename to Momentos?)
│   ├── ExclusivePage.tsx     # Keep
│   ├── VideoFiltersPage.tsx  # Keep
│   ├── PricingPage.tsx       # Keep
│   └── MarketplacePage.tsx   # Keep (hidden from nav)
│
├── components/
│   ├── prosa/                # NEW
│   │   ├── PromptCard.tsx
│   │   └── PhaseIndicator.tsx
│   │
│   ├── turma/                # NEW
│   │   ├── TurmaCard.tsx
│   │   └── TurmaChat.tsx
│   │
│   ├── xp/                   # NEW
│   │   ├── XPBar.tsx
│   │   └── LevelBadge.tsx
│   │
│   ├── journey/              # NEW
│   │   ├── JourneyTracker.tsx
│   │   └── DayCard.tsx
│   │
│   ├── activities/           # NEW
│   │   ├── ActivitySelector.tsx
│   │   ├── TriviaGame.tsx
│   │   └── WouldYouRather.tsx
│   │
│   ├── roda/                 # NEW
│   │   ├── RodaMode.tsx
│   │   └── SpeakerSpotlight.tsx
│   │
│   └── [existing components...] # Keep
│
├── data/
│   ├── conversationPrompts.ts  # NEW
│   ├── xpConfig.ts             # NEW
│   ├── journeyDays.ts          # NEW
│   ├── mockRooms.ts            # Simplified
│   └── [others...]             # Keep
│
├── store/
│   ├── authStore.ts          # Keep
│   ├── fichaStore.ts         # Keep
│   ├── xpStore.ts            # NEW
│   ├── turmaStore.ts         # NEW
│   └── friendshipStore.ts    # NEW
│
├── types/
│   ├── index.ts              # Extended
│   ├── turma.ts              # NEW
│   ├── journey.ts            # NEW
│   └── prosa.ts              # NEW
│
└── hooks/
    ├── useCamera.ts          # Keep
    ├── useLiveKit.ts         # Keep
    ├── useConversation.ts    # NEW
    ├── useFriendship.ts      # NEW
    └── useXP.ts              # NEW
```

---

## 🎯 SUCCESS METRICS

### MVP Launch Criteria
- [ ] Sala de Dois with Conversa Guiada working
- [ ] XP system tracking progress
- [ ] Friend connections with 7-day journey
- [ ] At least 1 group activity (Trivia)
- [ ] Turma de 7 creation flow

### User Experience Goals
- Average conversation length: 15+ minutes (vs 3 min on Omegle)
- Friend connection rate: 20% of conversations → friend request
- 7-day journey completion: 10% of started journeys
- Return rate: 40% DAU/MAU

---

## 💡 IMPLEMENTATION NOTES

### Quick Wins (Can do in 1-2 hours each)
1. Rename app to "Prosa" globally
2. Update hero copy on HomePage
3. Hide SecretCabins from nav
4. Reduce mockRooms.ts to 15 rooms
5. Add phase emojis (🍿☕🥃) to RoulettePage

### Technical Considerations
1. **LiveKit** is already integrated → reuse for Turma video calls
2. **Supabase** schema needs: `friendships`, `turmas`, `xp_events`, `journey_progress` tables
3. **Zustand** stores are modular → easy to add new stores
4. **Real-time:** Supabase Realtime for friend online status, turma activity

### UX Principles for Prosa
1. **Slow is good** - Don't rush users through conversations
2. **Progress is visible** - XP bars, level badges everywhere
3. **Commitment > Matching** - 7-day journey creates investment
4. **Small groups > Big rooms** - Turma de 7 is the goal, not 30-person rooms

---

*Created: 2026-02-06*
*Author: Product Architecture Analysis*
*Next: Review with team, prioritize Sprint 1*
