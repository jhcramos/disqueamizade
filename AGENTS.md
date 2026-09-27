# Project AI skills

- Use `.agents/skills/typesafe-ai/SKILL.md` when designing or implementing AI decisions, intent routing, or semantic selection for this project, as requested by the project owner.
- Read the live TypeSafe documentation before choosing API contracts or models. Skill installation alone does not enable the TypeSafe API in production.
- Preserve the existing stack: code owns movement, object ownership, availability, blocking, and explicit consent; the existing GLM integration supplies generated dialogue. Consider TypeSafe only where interpreting language adds value.
- Start with messages deliberately addressed to the virtual hosts and voluntarily shared interests. Do not infer sensitive traits, read private conversations for matchmaking, or treat model confidence as visitor consent.
- Keep credentials server-side. Measure Portuguese-language accuracy and actual usage before relying on a new model in production. Retain the deterministic fallback.

# Production source and release checks

- The authorized source of the current 3D house is `jhcramos/disqueamizade`. The house work currently lives on `feat/garage-proximity-prototype`; do not assume another checkout's `main` contains it.
- Before publishing to `disqueamizade.com.br`, inspect the current Vercel production deployment and compare its source repository and commit with the candidate. A blog update must include the current house release, not replace it with the legacy site.
- On 2026-09-27, a CLI deployment from `janamaiabr/disqueamizade` replaced the live house with the legacy site. Do not deploy that legacy checkout to this production project. See `docs/garage/production-recovery-2026-09-27.md`.
- Verify the home page, entry into the 3D house at `/garagem`, `/vizinhanca`, and the house API routes before and after production publication. Prefer promoting an already verified deployment during recovery.
