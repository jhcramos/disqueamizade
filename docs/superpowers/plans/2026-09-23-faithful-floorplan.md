# Faithful floorplan correction

**Goal:** Correct the prior generic geometry to match the supplied floorplan, keeping social interactions inside its actual rooms.
**Architecture:** One measured plan defines floors, walls, openings and fixed cabinetry; geometry and collision use that same model. Coordinates are traced from the supplied raster and scaled by its 22.020 m by 12.800 m main dimension references. Pool is exactly 7 m by 2 m. Reference image and private title block are not stored in Git.
**Stack:** Existing Three.js, TSL avatar materials, React and house network.

- [x] Trace stepped outline, four bedrooms, bathroom/WC/ensuite, closets, study, kitchen, pantry, laundry, garage, media, alfresco, pool, porch and courtyard.
- [x] Replace repeated room furniture with actual room-specific placement, door openings, window positions and fixed cabinetry. Keep poker at dining and a smaller games table in bedroom 4.
- [x] Add top-down plan camera for direct visual comparison; preserve first-person, pinch/pan and avatar follow views.
- [x] Relocate seats, phones and resident routines with valid approaches; migrate old spatial snapshots by layout version.
- [x] Verify dimensional anchors, architectural adjacency, all arrival/seat/phone paths, social privacy, poker and residents. Compare rendered top view to reference.
- [x] Typecheck/build, scan staged changes, commit/push and publish to verified existing project.

The user explicitly rejected architectural simplification. Preserve footprint, room partitions and recesses; cutaway wall height is only a viewing aid, not a change in plan. Furniture scale may adapt to the existing stylized avatars; walls must not move to fit furniture. Readable raster dimensions drive primary scale; this is not a construction-certified CAD model.

## Verification before publishing

- Measured layout includes the four original bedroom partitions, all bathrooms/closets/service rooms, study recess, east garage opening, porch and courtyard setbacks. The uploaded image/title block remains outside Git.
- 51 seats and 12 phones have traversable approaches, including route segments between room partitions. The pool is exactly 7 by 2 world metres and blocks walking.
- Residents use layout version 3; older spatial snapshots are reset rather than reusing invalid coordinates. Default visitor entry was relocated from a newly occupied bench to open garage floor.
- TypeScript and an in-memory production bundle passed. Browser checks passed for seating, phones, persistent TSL renderer, mobile width, plan/room camera transitions and first-person self-avatar visibility.
- Separate browser contexts passed presence, room chat, private-message consent/isolation, movement, reconnect and departure. Poker passed with two independent visitors, private cards, betting, fold and mobile layout.
- Rendering geometry is batched without merging interaction boundaries. Measured full-page top view dropped from 1,764 to 484 draw calls on the local test browser; this is not a mobile FPS guarantee.
- One review finding fixed: switching outer room tabs now exits top-down plan mode.

## Published

- Implementation commit: `6cf06f7`, pushed to `origin/feat/garage-proximity-prototype` after clean staged secret scan.
- Final combined regression suite: 99/99 passing.
- Production deployment: `https://disqueamizade-gtsrx8ny6-jhcramos-projects.vercel.app`, aliased to `https://disqueamizade.com.br`.
- Fresh public-domain browser verification passed: TSL avatar finish, 12 themed areas, 21 architectural labels in plan view, desktop/mobile views and no JavaScript/GPU errors. Temporary test visitor context closed after verification.
