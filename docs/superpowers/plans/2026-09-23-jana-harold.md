# Jana e Harold: household comedy implementation plan

> Execute with superpowers:subagent-driven-development for the independent prop/animation task; main agent owns shared simulation, API and integration. Existing user authorization covers implementation and publication.

**Goal:** Rename the hosts Jana and Harold and give them shared, affectionate domestic comedy scenes, visible chores, a guitar, thought bubbles and welcoming reactions to voluntarily public visitor interests.

**Architecture:** Keep persisted actor IDs dora/teo for compatibility. Add an optional versioned domestic-scene controller to LifeState. Code selects authored episodes, finds reachable meeting positions, waits for both hosts to be nearby, sequences alternating dialogue and chores, then releases them back to ordinary routines. A rate-limited GLM call may rewrite the current episode's authored lines; it cannot supply positions, activities or visitor facts. Keep Jev in its existing consent-based company selection role. A deterministic public-interest greeting runs once per arrival with per-person/global cooldowns; never reads private chat, orientation, account identifiers or freeform biography.

**Tech stack:** Existing TypeScript/React/Three.js, shared simulation and existing Vercel resident service. No new provider, dependency, microphone or audio autoplay.

- [x] Model/controller: create `domestic.ts` and household spot data. Episodes cover dishes/workload, laundry, mowing, guitar and Harold's travel/change-the-world daydreams. Alternate speakers only within 2.4 units; controlled actors face each other, pauses and interruptions remain usable. Thoughts have a distinct speech kind. Validate persistence, bound timeouts and route retries, preserve old snapshots.
- [x] Props/animation: guitar on a stand and held by Harold while playing; lawnmower in the garden; laundry and dish details. Use owned lightweight Three.js geometry, existing materials/disposal and reduced-motion behavior. Add task-specific arm poses.
- [x] Naming/UI: replace user-visible Dora/Téo with Jana/Harold across active interface and prompts, retain internal IDs. Thought bubbles stay small above the head and are distinguishable from spoken dialogue; honor existing mute.
- [x] Greetings: pass a sanitized list of existing public profile interest tags through the resident visitor payload; only allow known safe topics. Welcome an arriving available visitor near a host; reserve/cooldown before speech; praise their contribution without invented facts or pressure to join.
- [x] Generation: use existing GLM credentials and at most one reservation per 120 seconds, with a bounded batch of short JSON lines for an existing episode. Validate exact count/speaker structure, retain authored fallback, attach only to a matching fresh episode via CAS. Existing host-company Jev workflow unchanged.
- [x] Verify meaningful simulation tests for distance/alternation/chores/thoughts, interruption, malformed snapshots and greeting privacy; existing resident/network/concierge/dog regressions, typecheck/build and browser visuals. Scan secrets, commit/push, publish and check live behavior.


## Implementation and review evidence

- Three shared episodes: O solo da louça, A sociedade das meias, Revolução antes do café. Preserved persisted resident IDs and optional snapshot fields; visitor actions interrupt sketches. Completion records only completed stories.
- Red electric guitar, owned low-mesh props, articulated chores, short real mowing route and preserved mowing activity through network interpolation. Thought bubbles carry Harold's name; existing mute remains available.
- Safe voluntary hobby tags read from the visitor's own public profile. No biography, orientation or private chat sent to the model. Generic welcomes for guests and unknown tags; arrival/global cooldowns and solo/busy restrictions.
- Removed the previous loose-line generator in favor of one bounded episode rewrite. Code owns actions, positions, consent and story progression. Jev's company decisions remain unchanged.
- Review fixed mower/partner clearance, mower interpolation and externally interrupted dialogue. Narrow-wall route segments also validated between navigation nodes.
- 51 resident, household, concierge, API, identity/privacy and movement checks passed; typecheck and production build passed. Browser checks covered names, thought/mute, mobile overflow and runtime errors. Inspected rendered guitar and chore hand placement in a separate component preview.
- Publication uses existing authorized Git remote and Vercel project; no environment or schema changes are needed.
