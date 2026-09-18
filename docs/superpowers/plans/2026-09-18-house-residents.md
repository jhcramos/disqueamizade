# House residents implementation plan

**Goal:** Deliver physical resident interactions, usable household objects and autonomous routines in the existing house.
**Architecture:** Pure simulation model and object registry; Three renderer; scene adapter with contextual UI. Local shared state is explicitly separate from the prepared server-authoritative endpoint and optional DeepInfra generation.
**Tech Stack:** TypeScript, Three.js, React, existing pathfinding, BroadcastChannel, Supabase compare-and-swap, server-only DeepInfra.

- [x] Create model.ts with typed registry, actors, state transitions and bounded memories. Verify range/ownership before every action. Unit tests cover rejected distant actions, carrying, gifting and dog actions.
- [x] Create visuals.ts with original boxer, adult resident models and household props; sync(state, visitor positions, time); hit targets; dispose shared geometry/material once.
- [x] Create local coordinator transport with validated snapshots, tab ownership, bounded persisted state and cleanup.
- [x] Integrate scene selection, walk-to action, contextual buttons and transient speech; retain chat/cinema controls and prevent acting when frozen.
- [x] Verify unit tests and build; browser exercise pickup, deliver, pet and fetch, mobile overlay and persistence.
- [x] Review changes, scan staged patch for secrets, commit and push authorized origin; deploy and smoke test.


## Activation and verification

Implemented `api/house-residents.ts` with server-issued signed anonymous identity, short bounded memories, CAS updates and at most one GLM-5.3-Flash generation per two minutes globally. The browser receives no provider credentials. Expired sessions renew without reloading. Residents are explicitly labeled virtual and excluded from real visitor counts.

Local validation: 19 unit/API tests; frontend and API typechecks; production build (499 prerendered pages); Chrome pickup/fetch/return/mobile layout/session renewal test. API database operations use a test double; no real database or provider request was used for these tests.

Initial activation checklist (resolved below except provider authorization):
1. Connect the authorized Supabase project for Disque Amizade. The currently available connector only exposes an unrelated project; it must not receive this schema.
2. Apply `supabase/migrations/20260918111017_house_residents.sql` to the correct database. Its state table is service-role-only, with RLS and no anonymous/authenticated grants.
3. Configure `DEEPINFRA_API_KEY` in the protected Vercel production environment, plus the matching server `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never use a VITE_ prefix for these secrets.
4. Redeploy; verify two distinct browser contexts see the same residents and cannot acquire the same item. Exercise reconnect, return, fetch and an actual GLM-5.3-Flash response. Record latency and provider spend before raising cadence/capacity.

With no configured service the house uses prepared routines and local tab coordination, clearly labeled in its controls. Server mode currently supports one shared house with up to 100 recent resident visitors. It does not replace the existing real-visitor presence system. It is not a continuously running process: simulation advances on active visitor polls; there are no AI calls when nobody visits. No voice, current-news retrieval, unrestricted visitor/AI chat, model training or open-ended model-selected actions are included. Memories keep the last 12 completed events.


Deployment validation: production updated to `c350802` on 2026-09-18. Fixed TypeScript-to-ESM import rewriting for server functions; verified emitted JavaScript boots successfully. The live endpoint now returns the expected `503 {configured:false}` until the database is activated, rather than an invocation failure. Local fallback also handles initial HTTP 500 responses. Two-tab browser verification passed shared object ownership, duplicate pickup rejection, leave cleanup and coordinator takeover. No provider keys or unrelated database resources were modified.


## Provider selection update — GLM-5.3-Flash
User selected `zai-org/GLM-5.3-Flash` instead of Gemma. The request uses `reasoning_effort: "none"`, 100 maximum output tokens, the existing 6.5-second timeout and a shared two-minute reservation. Provider failures retain prepared household behavior and do not trigger immediate retries. The API test verifies model selection, direct-answer mode, shared request cadence, generated speech and failure fallback with an HTTP test double.

`DEEPINFRA_API_KEY` is confirmed present in Vercel Production (value never read or printed). The project list initially exposed only Urbix Agents; the user subsequently identified uquztttljpswheiikbkw and direct access to that authorized project succeeded. See the activation result below.

Provider references: https://deepinfra.com/zai-org/GLM-5.3-Flash/api and https://docs.deepinfra.com/chat/reasoning


## Live activation result
- User supplied the authorized Disque Amizade project `uquztttljpswheiikbkw`; applied the committed house_residents migration there.
- Confirmed RLS enabled, anonymous reads denied, authenticated writes denied and service-role access allowed. The advisor reports no RLS policies for this table; this is intentional because it is exclusively accessed by the service role (no browser-role grants).
- Deployed `3cdccd8` to disqueamizade.com.br. Resident API returns HTTP 200 with three shared residents. Two independent browser contexts passed pickup, exclusive ownership and return checks.
- Live provider request returned **401** from DeepInfra. Presence of the environment variable does not establish valid provider authorization. GLM is selected but improvised speech is not verified/active. Asked the user to replace DEEPINFRA_API_KEY in Production, then redeploy and repeat the generatedBy check.
- Generated speech carries a `generatedBy` marker for verification; prepared lines do not. Provider failure logs include only model and status, never credentials or conversation content. Generation waits for an available speech slot and preserves the shared two-minute budget.


## Key replacement and provider compatibility
The user authorized using the clipboard credential. It was held only in process memory, verified directly with DeepInfra HTTP 200, then installed in Vercel Production with `vercel env add --sensitive --force` (CLI update rejects an existing sensitive variable). No secret value was printed or saved to a local file.

Live validation exposed a model-specific issue: GLM-5.3-Flash requires thinking enabled according to https://docs.z.ai/guides/vlm/glm-5.3-flash . The initial generic `reasoning_effort: none` request produced incomplete analysis text. Changed to `low`, maximum 256 output tokens and accept only completed `finish_reason: stop` content without thinking tags. A direct low-effort request returned a complete Portuguese line in 2.47 seconds (36 completion tokens). Provider timeout is 15 seconds, client poll timeout 20 seconds, function maximum duration 30 seconds; shared generation cadence stays two minutes.


## Final production verification
Deployment `8d59df4` is live on disqueamizade.com.br. A fresh public API request returned HTTP 200, three residents, and a completed Portuguese line attributed to Dora with `generatedBy: "zai-org/GLM-5.3-Flash"`. This confirms the protected credential, authorized database, provider request and persisted/shared dialogue path together. The earlier 401 blocker is resolved. Eleven targeted tests and frontend typecheck passed before deployment; the Vercel build succeeded. No secrets were stored in the repository or output.
