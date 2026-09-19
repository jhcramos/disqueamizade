# Cross-device house presence

The public house previously always entered the modern `local` protocol, whose BroadcastChannel transport only connected tabs in one browser. The older `online` protocol does not implement all current group/chat/theatre features, so switching the entry flag alone is not a compatible fix.

`HouseChannel` now routes the modern protocol through `/api/house-residents` (`feature: "network"`) in production. Local development uses BroadcastChannel; append `?network=1` when running with the API (the browser integration test supplies real handlers and a fake database). There is no silent production fallback to local-only presence. The network handler shares the existing function to stay within the current Vercel Hobby function limit.

## Server boundaries

- An anonymous signed session owns its visitor UUID. Sender IDs and public names are normalized server-side; another session cannot claim an existing visitor.
- Group/media signaling and private social messages require a recipient and are filtered on delivery. Public chat is restricted to the visitor's current room.
- Server roster snapshots are authoritative, with a 90-second disconnect grace. Explicit departure removes presence; a departure tombstone prevents late updates from resurrecting it.
- The protected `house_resident_world` row stores a bounded `network` relay beside residents and poker. Compare-and-swap revisions preserve concurrent writes. No public database grant or schema change is required. Resident responses and AI inputs do not expose the network relay.
- Relay packets expire after 60 seconds and have a bounded count; clients batch and coalesce presence updates. Camera images are never sent to this endpoint.

## Operational limits

This repair uses HTTP polling roughly once per second per active browser and a shared database row. It restores cross-device delivery for the present house; it is not a claim of capacity for 1,000 simultaneous visitors. Before scaling, load-test and move the same protocol to room-scoped realtime delivery with server authentication and recipient authorization. The current relay caps active visits at 100 and may encounter write contention well before that under heavy activity.

Cross-device avatar presence and text were tested. Existing peer-to-peer media connectivity still depends on its ICE/TURN configuration; this change does not certify calls across every NAT/network. Experimental camera-driven avatar gestures remain local as designed.

## Verification

- `npm run build` (TypeScript, Vite, 499 prerendered pages).
- `node --test tests/house-network.test.mjs tests/house-network-api.test.mjs tests/house-residents-api.test.mjs tests/camera-privacy.test.mjs tests/garage-group.test.mjs`.
- `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node tests/house-network-browser.mjs`: three isolated browser contexts, mutual avatars, room chat, accepted private chat and exclusion from the third recipient's raw API responses, walking, reconnection, room change and departure.
