# Garage prototype QA

**Final result: blocked**

The interaction prototype runs, but the approved visual target has not been fully achieved. This is not a fidelity-complete delivery or a production release.

## Evidence

- Source visual truth: docs/garage/reference.png (1422×1107 concept board, main UI plus two subsequent states).
- Implementation: docs/garage/desktop.png (1440×1024 CSS/PNG), docs/garage/mobile.png (390×844 CSS/PNG).
- State: local visit, approaching Bia; Bia is explicitly a demonstration avatar.
- Density: CUA screenshots captured at CSS resolution. Full-page screenshot exporter had an inconsistent density; those exports were discarded in favor of CUA viewport captures.
- Source main UI region and implementation scene/sidebar inspected, plus full desktop/mobile views. Full board contains secondary story frames that are separate UI states in implementation.

## Findings

- [P1] Avatar fidelity remains incomplete. The source uses detailed adult characters; implementation uses licensed mini characters. These are functional animated 3D assets but do not match source proportions/style. Replace with commissioned/generated rigged adult GLB models before calling the design complete. Do not claim image-level quality or a fully modeled house.
- [P3] Main title and sidebar text adapt the static design to local demonstration and empty states; this is intentional and clearly labeled.

## Required surfaces

- Typography: Georgia display serif with sans-serif body, matching the source hierarchy but not an exact font match. Main actions remain readable; small metadata can be enlarged in the next art pass.
- Spacing/layout: scenery dominates, sidebar remains separate, controls remain accessible. Mobile stacks sidebar and adds directional buttons; document scrollWidth equals viewport width (390).
- Colors: ivory #faf5eb, aubergine #39233b, terracotta #b64e30 and muted green, consistent with reference.
- Imagery: original generated garage asset follows the warm 1980s scene. Avatar art is the blocking mismatch. No fake webcam portraits; media panels contain streams or off states.
- Copy: explicitly distinguishes local visit, demo avatar, private preview and connection permission. Online configuration missing is shown honestly.

## Iteration history

1. Missing external GLB colormap caused white avatars; copied the original licensed texture, reloaded and confirmed colored models.
2. Initial spawn fell outside the permitted floor and prevented presence discovery; corrected and added regression test.
3. Receiving peer published into an unnegotiated transceiver; only caller now creates transceivers, answerer sets negotiated directions. Confirmed bidirectional synthetic video at 640×360, readyState=4.
4. Sparse animation clips retained walking leg pose; filled missing channels from static rest tracks and added test. Underlying mini-character proportions remain different from reference.
5. Mobile captured at 390×844; no horizontal overflow. Desktop captured at 1440×1024.

## Verification and limits

TypeScript, production build, existing camera/chat tests and new garage tests pass. Browser invitation/acceptance, bidirectional synthetic video and peer hangup verified. Actual webcam hardware was not accessed; cloud integration and physical-phone performance are unverified. Latest reload has no new application console errors (pre-existing React Router warnings remain).

## Next required work

Replace provisional models to achieve the approved art, then repeat visual comparison. Validate online deployment configuration and moderation before inviting external participants. Do not represent this local prototype as tested for 1,000 simultaneous users.

## Living-room and collision iteration — 2026-09-07

Added matching generated living-room scenery (wood floor, olive sofa, CRT television), room navigation with per-room occupancy, and pending-invitation speech bubbles anchored above the sender. Desktop browser review confirmed both backgrounds, departure/arrival visibility between two visits, the invitation bubble and room-switch lock during pending invitations. Current screenshot: docs/garage/living-room.png. The existing provisional-avatar art mismatch remains; this iteration does not claim final character fidelity.

Movement commands now share continuous movement and swept personal-space collision checks, including remote interpolation. Avatars stop and suggest passing around an obstruction; they do not automatically pathfind around it. A deterministic arrival tie-break separates overlapping spawn positions; room switches select a free position or report full. Tests cover direct crossing, head-on approaches, retreat, distinct arrivals/full floor, and room identity. These are client-side prototype controls, not server-authoritative collision enforcement under arbitrary network latency.

Validation: 10 garage tests, 13 camera tests and 22 chat tests pass, plus TypeScript and production build. This iteration's visual browser checks used desktop; the viewport override did not apply, so a new mobile screenshot was not claimed. Existing mobile styles remain, with responsive room selectors. Cloud room transitions and production load remain unverified.

Final browser check: approaching a participant in the living room enabled the invitation; the receiver accepted and saw the private-call panel with camera and microphone off.

## Walking-area and actionable-bubble iteration — 2026-09-07

The shared center-only floor polygon rejected visible floor at the sides, back and front. Replaced it with separate polygons traced against each room's furniture footprint. Added a bounded A* walking route around people and concave furniture boundaries, with the existing swept collision checks retained for each movement step. Keyboard destinations now start at the current avatar position, so a previous distant click does not pull arrow movement away.

The speech bubble now contains Accept / Not now for the recipient and Cancel for the sender. Buttons share the existing invitation state and media consent flow with the sidebar. Bubble position is clamped to remain inside the scene near its edges. Screenshot: docs/garage/bubble-actions.png.

Verification: 14 garage tests include the previously rejected visible-floor points in both rooms, a path around a person, a path around the living-room sofa, invalid furniture destinations, and twelve non-overlapping initial spawn locations. Browser checks confirmed movement to a floor destination, continuous approach, acceptance from the bubble with camera/microphone off, and refusal from the bubble. Camera and chat test suites remain passing (13 and 22). Production build passes. Twelve spawn positions are a geometry check, not a multiplayer load/capacity claim.

Product proposal is documented separately in docs/garage/GROUP-CONVERSATIONS.md: 12 visitors per room instance and 4 members per conversation, with consent for admitting a third person. Group calls and a server-enforced 12-person cap are not implemented. Existing provisional-avatar art, mobile verification and online-load limitations still apply. This entry supersedes the earlier statement that no automatic route planning exists.

## Playful-object iteration — 2026-09-07

Added cream/terracotta object hotspots and an action tray consistent with the house UI. The scene now renders an actual low-poly ball and rounded cushion in Three.js. Dimming affects the backdrop and avatars while keeping controls readable. The living TV uses a clipped retro test-card overlay; the garage stereo has small powered indicators. The sofa jump is a brief staged animation returning to the ground, and the garage dance is a simple hop/turn animation using provisional avatars. This does not replace the background with a fully modeled house.

Desktop visual review checked the garage objects and living-room TV; the TV overlay was resized to fit the raster screen, and the living-room light switch hotspot was moved off the sofa. Snapshot: docs/garage/play-living.png. Existing avatar-art and mobile/physical-device limitations remain.

Two local browser visits verified shared dimming and room snapshot restoration (TV already on for a new arrival), pickup/throw labels and resulting visual objects, ball kick, optional sound controls, dance and sofa-action completion. Camera/microphone are not used. 54 tests pass in total (19 movement/object, 13 camera, 22 chat/auth), and production build passes. Cloud cosmetic broadcast and realistic object/person physics are not claimed as validated.

## Vinyl Club and three-table bar — 2026-09-07

Added a matching generated bar background with precisely three four-seat tables and three bar stools. All fifteen seats have explicit ground/cushion anchors, reachable paths and standing/sitting behavior. Local two-visit QA confirms occupancy and release, jukebox and toast synchronization, and optional intention symbols. The bar entrance self-declaration is only a prototype affordance, not verified age enforcement. Screenshots: docs/garage/bar-seated.png, bar-mobile.png and vinyl-editor.png.

The active character renderer is now authored rounded Vinyl Club geometry with simple modular garments and joint blending, replacing the earlier wooden mannequin and Kenney runtime. This is still a simplified 3D interpretation; character fidelity to the concept illustration remains provisional and needs user visual approval. Walking turns smoothly toward travel and knees articulate; the final position is published at rest, fixing an approach that could stop short of seat activation. Intention labels do not trigger media access. The mirror keeps apply/cancel and saved appearance, with all collections usable by all models.

Latest checks: 68 tests in total (33 garage/avatar/bar, 13 camera, 22 chat/auth), TypeScript and production build. Desktop and 390 px mobile bar rendering reviewed; no horizontal overflow. Browser test scenarios used isolated contexts and synthetic visitor names. Four-person table seating is implemented; four-person calls, server-authoritative reservations, backend age controls and production load validation are not.

## User-reported tilted walk and missing hair controls

Removed the fixed whole-model X tilt and animated body Z sway. The model's up axis stays vertical while the heading turns; walking is confined to limbs. Enlarged rounded collectible-style heads and eyes, and replaced index-coupled hair lumps with independent scalp/lock meshes for ten styles plus automatic defaults. Editor thumbnails emphasize the head and preserve accessory selection; action buttons stay visible while content scrolls. The delivered quality is shown in docs/garage/avatar-hair-editor.png, not asserted to equal the generated concept.

Seventy tests pass, including all ten independent hair geometries and body-upright orientation across walking/idle/heading changes. Browser checks passed saved mohawk, canceled draft preservation, long hair, moving avatar screenshot, mobile editor overflow, and the existing two-visit bar scenarios. No page errors. Avatar art still requires subjective user review; no claim of identical fidelity to the approved illustration.

## Close encounters and hair surface rebuild

Responded to the user's remaining distance/art feedback by halving the body collision spacing and using a single room-aware automatic approach radius. The existing swept collision/pathfinding protections remain. Live browser check confirmed arrival within 0.063 ground units of the demo avatar; new tests cover reachability and collision stopping in all three rooms.

Hair is now built from continuous sculpted meshes rather than visibly separate tube/bead/cone primitives. Face changes add soft brows, small eye highlights and a restrained smile. The long-hair preview and actual closer encounter are recorded in docs/garage/hair-sculpted.png and close-conversation.png. Art quality remains a subjective user-review item; no multiplier or exact-reference fidelity is claimed. Latest suites total 71 passing tests plus production build and local browser checks.


## Headwear, ten complete presets and four-person local video

Headwear now encloses a tucked hair shell, while the selected hairstyle remains stored. Added a true empty bald style, afro volume, twin buns and liberty spikes. The first five templates use masculine silhouettes and the next five feminine silhouettes, with distinct skin, hair, outfit and accessory combinations. Both collections now have construction clothing and a hardhat (21 outfits and 21 accessories each). Catalog pagination follows the actual catalog size. Preset selection applies the entire displayed look, preserving the optional intention.

Local conversations now have an inviter-controlled roster capped at four, sequential expiring invitations, three peer connections per visitor and a two-by-two camera grid. All new-audience changes stop existing captures before establishing the next roster. Every camera/mic remains individually opt-in. Signaling is scoped to roster identity, approved members and revision; leaving the host ends the conversation. This is a same-browser prototype transport, not authenticated online group authorization.

Validation: 75 automated tests and production build pass. Five isolated browser pages confirmed four decoded synthetic 640×360 videos and four audio tracks on each joined page; the fifth visitor received no call media. New-member consent pauses, individual camera off, departure, host closure and stopped capture tracks passed. Browser checks covered bald/punk selection, hardhat fitting, persistence, accessory removal and a 390px editor without horizontal overflow. Four-video grid stays within the sidebar. No hardware media or real personal data was captured. Exact illustration fidelity, online groups and physical-device performance remain unclaimed.


## Approved Bloco Pop direction and shared avatar camera head

Implemented a first procedural block interpretation, especially presets 1 and 6, with chamfered heads, sclera/pupils, named blink/mouth groups, block hair, broader jackets and sneakers. It is visibly simpler than the approved generated reference; fidelity is not claimed equivalent. The same head builder drives the editor, walking avatars and the new camera renderer, retaining skin/hair/accessories.

Local calls offer an opt-in avatar-camera checkbox before capture. The existing face tracker drives yaw, independent blinking and mouth opening. The entire output frame is opaque; missing detection never falls back to a raw frame. Raw pending captures are stopped on conversation generation changes, and stopping the returned output also stops raw capture and disposes WebGL. The existing rooms mask catalog adds Meu avatar through a lazy renderer and the established compositor, also with an opaque background.

Validated production build and 75 tests; head rendering with synthetic expressions; four-person video/audio regression; close approach; standalone no-face stream with ended raw/output tracks; and two-page masked publication of an opaque no-face frame. No hardware webcam test or end-to-end online broadcast was performed. These remain explicit verification limits.
