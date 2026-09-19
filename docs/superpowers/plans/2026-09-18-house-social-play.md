# Social hosts and Biscoito implementation plan

**Goal:** Finish the approved fetch game and make Dora and Téo introduce consenting visitors through shared activities.

**Architecture:** Extend the existing authoritative household simulation. Deterministic, validated actions own ball movement and invitations; the language model only supplies occasional short public lines. No automatic chat, microphone or camera activation.

**Approved behavior:** Biscoito approaches whoever holds his ball, looks at them and makes intermittent playful hops. Throwing has an arc/bounce, fetching, mouth carry and return. Passing the turn requires the recipient to accept. Hosts offer introductions or a shared activity; the requester opts in by asking, the recipient explicitly accepts. Solo mode, busy visitors, blocking, expiry and disconnects prevent invitations. Accepted visitors can walk to a shared meeting point. Hosts give one conversation starter and resume household life.

## Work
- [x] Extend simulation and snapshot validation for ball flight and anticipation; test fetching, moving holders, interruption and ownership.
- [x] Add a separate social coordinator with invitation lifecycle, solo preference, blocking and eligibility; test mutual consent and expiry.
- [x] Integrate signed server identities and local transport, expose only each visitor's invitations, and preserve existing poker state.
- [x] Add contextual buttons, discreet invitation card and shared-meeting navigation, respecting mobile layout and reduced motion.
- [x] Update resident mission prompt without adding language-model calls.
- [x] Run unit/API and browser checks, scan for secrets, commit, push, deploy and verify production.

## Verification
- 24 focused simulation/API tests passed, including signed invitation ownership and poker-state preservation.
- TypeScript and production build passed (499 prerendered pages).
- Browser checks passed for fetch/return, two independent visitors, consent, meeting navigation, solo mode and mobile layout.
- Full history (521 commits) and versioned-tree secret scans passed; only exact, unchanged truncated documentation examples were excluded.
- Implementation committed/pushed as `75260db` and published to disqueamizade.com.br.
- Production browser smoke passed: shared residents API, host actions, solo preference persistence, mobile bounds and no page errors.
