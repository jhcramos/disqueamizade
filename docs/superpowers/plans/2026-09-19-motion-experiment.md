# Local camera motion and longer fetch

Goal: reversible local avatar motion and longer obstacle-aware throws for Layla.

Architecture: server-authoritative fetch preserves the only ball. Search clear landing points up to 5m. Optional camera owns a local video-only stream. A classic worker loads the installed MediaPipe Lite runtime only on activation; frames/landmarks never go to server or peers. Stop on calls, hidden tab, navigation or explicit stop. No main-thread inference fallback.

- [x] Throw helper: sample collision every .15m, 24 directions, descending range; verify fetch return.
- [x] Bounded pose mapping: confidence, stale-frame decay, shoulder/elbow limits and smoothing; articulated sleeves/hands preserving idle rig.
- [x] Lazy CPU worker: one pose, no segmentation, 12Hz upper bound, 6Hz slow tier, stop sustained overload.
- [x] Local camera panel: activate, indicator, framing guidance, latency, stop. Off by default. Rollback: VITE_ENABLE_AVATAR_MOTION=false and rebuild.
- [x] Synthetic pose tests, cancellation/cleanup, actual worker with fake browser camera, privacy/fetch regressions, TypeScript/build.
- [ ] Scan staged patch, commit/push, deploy. Real phone motion quality/thermal load require device testing.
