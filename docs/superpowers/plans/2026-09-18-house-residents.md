# House residents implementation plan

**Goal:** Deliver physical resident interactions, usable household objects and autonomous routines in the existing house.
**Architecture:** Pure simulation model and object registry; Three renderer; scene adapter with contextual UI. Local shared state is explicitly separate from the prepared server-authoritative endpoint and optional DeepInfra generation.
**Tech Stack:** TypeScript, Three.js, React, existing pathfinding, BroadcastChannel, Supabase compare-and-swap, server-only DeepInfra.

- [x] Create model.ts with typed registry, actors, state transitions and bounded memories. Verify range/ownership before every action. Unit tests cover rejected distant actions, carrying, gifting and dog actions.
- [x] Create visuals.ts with original boxer, adult resident models and household props; sync(state, visitor positions, time); hit targets; dispose shared geometry/material once.
- [x] Create local coordinator transport with validated snapshots, tab ownership, bounded persisted state and cleanup.
- [x] Integrate scene selection, walk-to action, contextual buttons and transient speech; retain chat/cinema controls and prevent acting when frozen.
- [x] Verify unit tests and build; browser exercise pickup, deliver, pet and fetch, mobile overlay and persistence.
- [ ] Review changes, scan staged patch for secrets, commit and push authorized origin; deploy and smoke test if available.


## Activation and verification

Implemented `api/house-residents.ts` with server-issued signed anonymous identity, short bounded memories, CAS updates and at most one Gemma generation per two minutes globally. The browser receives no provider credentials. Expired sessions renew without reloading. Residents are explicitly labeled virtual and excluded from real visitor counts.

Local validation: 19 unit/API tests; frontend and API typechecks; production build (499 prerendered pages); Chrome pickup/fetch/return/mobile layout/session renewal test. API database operations use a test double; no real database or provider request was used for these tests.

Pending online activation:
1. Connect the authorized Supabase project for Disque Amizade. The currently available connector only exposes an unrelated project; it must not receive this schema.
2. Apply `supabase/migrations/20260918111017_house_residents.sql` to the correct database. Its state table is service-role-only, with RLS and no anonymous/authenticated grants.
3. Configure `DEEPINFRA_API_KEY` in the protected Vercel production environment, plus the matching server `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never use a VITE_ prefix for these secrets.
4. Redeploy; verify two distinct browser contexts see the same residents and cannot acquire the same item. Exercise reconnect, return, fetch and an actual Gemma response. Record latency and provider spend before raising cadence/capacity.

With no configured service the house uses prepared routines and local tab coordination, clearly labeled in its controls. Server mode currently supports one shared house with up to 100 recent resident visitors. It does not replace the existing real-visitor presence system. It is not a continuously running process: simulation advances on active visitor polls; there are no AI calls when nobody visits. No voice, current-news retrieval, unrestricted visitor/AI chat, model training or open-ended model-selected actions are included. Memories keep the last 12 completed events.
