# Proposed group conversations

Status: product proposal; current prototype still supports two-person calls. The numbers below are initial product limits to validate, not measured production capacity.

- 12 visitors per room instance, including people without cameras. If full, route new arrivals to another instance or offer waiting, never overlap avatars.
- 4 participants total per conversation, including the local user. Desktop: 2×2 real-video grid. Mobile: active speaker and selectable participant thumbnails. Only the current conversation's audio/video is subscribed; other groups remain visible as avatars and counts.
- Nearby standalone person: “Vamos conversar?” with Accept / Not now in the bubble. The sidebar provides the same actions for accessibility. Only one pending request at a time; concurrent requests must be queued/rejected without overwriting active invitations.
- Private pair: “Pedir para participar” does not admit someone automatically. Both existing participants must agree before the call becomes a group. A decline preserves the private pair.
- Open group: all members have explicitly chosen an open conversation. The host approves join requests, with visible member-arrival notifications. Request TTL, participant reservations and the four-member limit are enforced atomically by the server.
- Two people approaching someone alone: first accepted invitation establishes a pair; the second request becomes a group-join request. No automatic join on proximity. An existing group may instead invite the solo person, showing all current participant names and count before they accept.
- Camera and microphone are off on joining. Existing private camera publication pauses while a pair is converted to a group, until each existing member approves that transition; no pre-acceptance media subscription/token access.
- Leaving stops that person's media. A group may continue after the host leaves with explicit deterministic host transfer. With one remaining participant, end the group and restore exploration. Block/report, removal and re-entry restrictions must work before public rollout.

Implementation requirements: group membership and invitations persisted server-side; atomic capacity and consent checks; LiveKit tokens limited to the authorized group; room-presence membership synchronized; race/expiry/disconnect/moderation tests; multi-device media and load tests. The existing private pair token endpoint must not be broadened by only changing the frontend participant array. No group endpoints or group video UI are implemented in this change.
