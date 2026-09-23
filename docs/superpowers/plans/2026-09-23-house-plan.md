# House floorplan and production TSL implementation plan

> **For agentic workers:** Use superpowers:executing-plans for the house and a bounded material specialist for production TSL.

**Goal:** Ship the user-approved floorplan adaptation with exterior pool/alfresco, themed social spaces and working existing interactions.
**Architecture:** Declarative floor areas, furniture and walls feed scene geometry, collision and seat targeting. Stable three-room network IDs group physical subareas while preserving proximity scale. Shared TSL finish is isolated behind an environment switch.
**Tech Stack:** React, Three.js/WebGL + TSL, current presence and resident/poker services.

- [x] Add area definitions, walls, expanded seat metadata and collision paths in `src/garage3d/layout.ts`; update coordinate validation and seat/gathering IDs.
- [x] Replace room builder with plan-based architecture, kitchen, dining poker, media, social lounges, alfresco and pool deck. Preserve builder contract for phone/TV/light interactions.
- [x] Update Garage3DPage framing, destinations, themed area navigation, marker selection and pool animation.
- [x] Relocate resident fixtures, routines, spawn points and poker table position; invalidate old spatial snapshots safely through validation.
- [x] Integrate shared TSL finish for local/remote/resident avatars and renderer compatibility helper.
- [x] Add spatial regression tests and run actual browser interactions at desktop/mobile sizes. Verify physical phone approach, all seat paths, pool exclusion, world/shared roundtrip and existing consent behavior.
- [ ] Run TypeScript and production build, scan committed changes, push authorized remote, deploy and inspect public route.

Verification completed locally: 70 focused node tests; TypeScript; memory-only Vite production bundle; 20-avatar TSL material/rig/disposal browser test; separate browser sessions for exterior presence, public/private messages and reconnect; two-player dining poker with private cards and mobile controls; real mobile pinch/pan; pool, alfresco, lounge and cinema sitting.

TSL rollback: set `VITE_ENABLE_AVATAR_TSL=false` and rebuild. This restores standard avatar materials without changing geometry, movement, seating or camera permissions.

Reference floorplan is interpreted as a navigable cutaway. Roofs and private service rooms are not reproduced as inaccessible enclosures. The three existing chat/presence channels remain stable and group the ten themed physical areas. Pool is decorative water with safe deck circulation, not a swimming mechanic. Real low-end phone performance remains to be measured.
