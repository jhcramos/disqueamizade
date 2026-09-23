# Neighborhood expansion implementation plan

**Goal:** Keep the measured Disque Amizade house intact, add six virtual sale plots and a walkable block, and provide a clear project-focused landing page.

**Architecture:** A shared neighborhood data module defines six 28 × 22 world-unit parcels (three north and three south of the existing house), perimeter streets, sidewalks, pedestrian connections and sign positions. The existing house stays the social center. Outdoor presence reuses the existing garage channel; server and browser share valid movement geometry. A separate lightweight marketing route explains the offering without claiming that purchase, construction or rental checkout already exists.

**Commercial clarification:** Land R$999 each is explicit. The meaning of R$2,500 for the house is pending user clarification; do not invent a billing period or publish an unconfirmed rental contract.

- [x] Create parcel model and 3D neighborhood geometry: grass, boundaries, signs, sidewalks, roads, crossings, trees and benches. Batch static geometry and dispose resources.
- [x] Extend walking validation and route search using A* and shared world bounds. Test house-to-lot, perimeter circulation, return home, collision, out-of-bounds rejection and outdoor presence.
- [x] Integrate neighborhood camera, sign selection, walk-to-lot and return-to-house actions. Keep default house view and social controls intact; support mobile pan/pinch and first person.
- [x] Build /vizinhanca with matching house identity, a selectable six-plot map, explicit virtual-space prices, benefits, project-centered CTAs and truthful availability/interest flow. Link from signs and home navigation.
- [x] Verify typecheck, build, spatial/network regressions and real desktop/mobile browser flow. Review changes for requirements and code quality. Scan new files for secrets, commit, push, deploy and verify production.

## Verification

- 46 spatial/network/resident/social/poker/concierge regressions passed. Added six-lot route loops and carried-object/bed persistence checks.
- Existing social test visitors now use actual open garage floor rather than pre-plan kitchen cabinetry coordinates.
- Browser verified six signs, walk to lot6, nearby action, first person, return to measured house, mobile390 layout, selected-lot landing URLs and email interest handoff. No JS/GPU errors.
- TypeScript and in-memory Vite production build passed. Static scenery is batched; desktop measurement519 draw calls including the original house.
- Independent review caught and confirmed correction of resident snapshot validation for outdoors. No remaining specification or code-quality blockers.
- Prices are presented as a proposal, land999 and house2500; house billing modality remains unspecified pending owner's reply. No live purchase, builder or rental contract is claimed.
