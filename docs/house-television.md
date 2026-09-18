# Television in the house

Each of the three 3D rooms has a physical, clickable television/projection screen. The
`Televisão` framing-toolbar button offers the same action on mobile and when the object
is out of view. The living-room `Escolher vídeo na TV` action opens this same panel.
Only one official YouTube player can be mounted for a visitor, outside the 3D canvas.

## User flow

1. Open the TV and assume the remote control. Other visitors may submit requests.
2. Paste an HTTPS YouTube link and give the item a readable name.
3. Choose `Colocar na tela`; each viewer explicitly chooses `Assistir junto` (panel) or
   `Assistir na TV` (scene) to load YouTube.
4. The remote holder can pause/resume the session, skip, remove requests, or pass the remote.
5. Volume and native player controls are personal. `Acompanhar a sala` returns to the shared
   timeline. Advertisements, buffering and restrictions can cause playback differences.
6. Closing the panel, changing rooms, entering a call, opening the phone or leaving the house
   destroys the player. Hiding the browser tab pauses it. The queue survives panel closing.

In fullscreen desktop the video and public chat have independent scrolling areas. Mobile
uses a dedicated video panel with the house dock available to return to chat or the room.
No YouTube script, thumbnail, or player request is made until the viewer opts in. Video
links use a strict host/ID parser; arbitrary URLs are never embedded. Titles render as text.

## Shared-state scope

The published house currently enters via the existing **local exploration transport**.
This feature uses a room-scoped BroadcastChannel and the existing local roster. Requests,
queue state and playback changes are shared across tabs of that browser, **not across
separate browsers/devices**. The panel states that limitation. The dormant online mode
shows an unavailable message; this implementation does not silently pretend it is online.
Enabling public cross-device screenings requires the house's authenticated presence and
server-authoritative queue/permissions/moderation. Do not expose this local protocol as a
public broadcast channel with client-supplied identities.

The lowest present identity coordinates commands, independently of the person holding the
remote. This serializes competing requests in the local room. Snapshots support late joins
and coordinator changes. The remote becomes free when its holder leaves. Queues are
bounded at 12 items, 3 pending requests per person, with duplicate checks. Only the requester
or remote holder may remove a queued item. Per-sender throttling and packet parsing bound
traffic. No queue or viewing history is persisted after the room empties.

End-of-video advances the queue only when the remote holder is watching and receives the
YouTube ended event. No timer skips over ads or assumes a video's duration. When nobody
holds the remote, visitors can assume it and advance manually. Playback synchronization
uses start/offset timestamps, not continuous seeking. Device clocks and advertisements
prevent frame-accurate synchronization.

## Player constraints

Uses the official IFrame API with youtube-nocookie.com, visible controls, correct origin,
inline mobile playback and a minimum 200 × 200 viewport. No overlay covers the player,
no audio extraction, no downloaded videos and no removed ads/branding. Network/API and
embedding errors have visible retry feedback; unavailable videos can be skipped by the
remote holder. API failure and initialization timeouts are bounded. No API key is needed
for user-pasted video IDs. Video metadata comes from the user's label; no search API is used.

Documentation checked:
- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/terms/required-minimum-functionality
- https://developers.google.com/youtube/terms/developer-policies

## Verification

- `node --test tests/house-theatre.test.mjs` checks URL parsing, control ownership, queue
  limits, duplicates, snapshot bounds and timeline behavior.
- `tests/house-theatre-browser.mjs` uses the real room/BroadcastChannel with a mocked
  YouTube player: consent, two visitors, late join, queue, pause/resume, personal volume,
  unavailable-video feedback, room isolation, remote-holder departure, player destruction,
  fullscreen chat visibility and mobile sizing.
- A separate browser check loaded and played the official YouTube IFrame API demo video
  using the real player; this does not guarantee availability of arbitrary videos.
- `tests/house-workspace-browser.mjs` protects the existing house layout and group controls.

## Watching on the physical television

`Assistir na TV` switches to a front-on orthographic camera focused on the current room's
screen. The official iframe stays mounted in the same DOM node; only its CSS rectangle
changes to match the projected screen. Returning to the panel preserves that same player,
local volume and playback. No video is copied into a WebGL texture or extracted from YouTube.
`Voltar à casa` restores the previous overview/first-person camera without moving the avatar.
Scene controls and avatar labels are hidden while watching so they cannot cover the player.
The wide house view displays a static screen and current title instead of multiple videos.

A screen projection observer, resize observer and scroll listener keep the iframe aligned.
Screens below 200 × 200 automatically return to the panel with an explanation, preserving
the player. Desktop chat remains beside the house; mobile controls use a compact lower
sheet, with the chat dock available (opening chat closes playback). Background scene drawing
is capped at 30 FPS while watching. Narrow scene viewports use pixel ratio 1 and no shadows;
leaving restores the visitor's prior quality setting. Hidden/offscreen players pause rather
than continuing autoplay; layout transitions have a short settling delay.

`tests/house-cinema-browser.mjs` checks all three TV projections, one persistent iframe,
minimum dimensions, viewport/occlusion, desktop/fullscreen/mobile alignment, chat visibility,
small-screen fallback, avatar position, camera restoration and cleanup. Browser tests use
a simulated YouTube SDK to exercise layout independently of network/advertisements.
