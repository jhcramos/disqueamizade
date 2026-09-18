# House residents implementation plan

**Goal:** Deliver physical resident interactions, usable household objects and autonomous routines in the existing house.
**Architecture:** Pure simulation model and object registry; Three renderer; scene adapter with contextual UI. Local shared state is explicitly separate from future server-authoritative generative AI.
**Tech Stack:** TypeScript, Three.js, React, existing pathfinding, BroadcastChannel.

- [ ] Create model.ts with typed registry, actors, state transitions and bounded memories. Verify range/ownership before every action. Unit tests cover rejected distant actions, carrying, gifting and dog actions.
- [ ] Create visuals.ts with original boxer, adult resident models and household props; sync(state, visitor positions, time); hit targets; dispose shared geometry/material once.
- [ ] Create local coordinator transport with validated snapshots, tab ownership, bounded persisted state and cleanup.
- [ ] Integrate scene selection, walk-to action, contextual buttons and transient speech; retain chat/cinema controls and prevent acting when frozen.
- [ ] Verify unit tests and build; browser exercise pickup, deliver, pet and fetch, mobile overlay and persistence.
- [ ] Review changes, scan staged patch for secrets, commit and push authorized origin; deploy and smoke test if available.
