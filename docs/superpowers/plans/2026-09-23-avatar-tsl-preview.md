# Avatar material comparison implementation plan

**Goal:** Show the approved comparison of the existing Bloco Pop avatar with an experimental TSL material finish, using real project geometry.
**Architecture:** A lazy public `/avatar-estudio` route owns a disposable WebGL renderer with the Three r185 TSL compatibility handler. Two viewports share camera, controls, lighting and preset selection. Existing house avatars and renderer remain unchanged.
**Tech Stack:** React, Three.js r185, TSL, OrbitControls, Vite.

## Scope and acceptance
- Same geometry, colors, pose and illumination on both sides; only material treatment changes.
- Three existing presets; full-body and portrait framing; synchronized drag rotation and zoom.
- Matte skin, controlled hair reflections, subtle procedural cloth roughness and eye gloss. No claim of improved rigging or hairstyle geometry.
- Responsive layout, keyboard controls, visible loading/error feedback, cleanup on unmount and no continuous idle render loop.
- No camera access, AI API usage or new runtime dependency.

## Tasks
1. Add `src/avatar-studio/materials.ts` for isolated conversion and disposal of replaced materials.
2. Add preview renderer and responsive page under `src/avatar-studio`; register route in `src/App.tsx`, hide legacy mobile navigation there.
3. Run TypeScript, actual desktop/mobile browser rendering and memory-only production build. Check renderer errors and generated screenshots.
4. Scan staged changes for secrets, commit and push authorized remote. Publish the isolated preview and share it for visual review.

## Verification and implementation notes
- TypeScript and memory-only production bundle pass.
- Browser regression covers all three real avatars, rendered rotation, portrait framing, 390px responsive layout, comparison modes, no overlapping controls, and route exit.
- First rendering exposed WebGL uniform binding exhaustion with one node material per color. Resolved by sharing surface materials and storing the unchanged palette as linear vertex colors; rerun has no shader/uniform errors.
- Rendering is demand-driven; camera and resize events request frames. No continuous idle animation loop.
- This validates desktop Chrome and a mobile viewport, not physical iOS/Android performance or multiplayer load. Keep the preview isolated pending visual review and device measurements.
