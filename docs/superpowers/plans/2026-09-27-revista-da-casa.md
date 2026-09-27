# Revista da Casa — approved implementation plan

Objective: recover missing public articles, preserve the current 3D house, and establish an inviting editorial magazine about connection.

1. Recover the immutable legacy blog index, audit slug differences, preserve current shared revisions and append missing articles. Record provenance and unresolved revisions without overwriting current fixes.
2. Generate lightweight catalog and individual article bodies; remove document chrome and unsafe markup from rendered legacy content. Keep all canonical /blog/:slug URLs.
3. Replace blog header, listing and article layouts with scoped warm editorial styling, search, categories, pagination, related articles and clear house CTAs. All content remains visible without scroll effects.
4. Add ten substantial original guides, an honest editorial policy, Cantada ou cilada (personal reactions only) and a categorized question deck. Static interactions incur no model/API charges.
5. Pass known question IDs into house chat as an explicitly selected draft, never send automatically.
6. Verify recovery counts, generated data/links, sanitizer, TypeScript/build and browser behavior. Review scope then quality. Inspect production provenance, commit, secret-scan and push authorized remote; deploy current complete project and smoke-test house and magazine.

Validation: Node tests for content safety and migration invariants, TypeScript, production build, browser checks for magazine search/article/games/draft and house regression. No database migration or change to resident/presence/video APIs.

## Completed validation
- 92 missing legacy articles recovered; 480 prior unique articles retained, plus 10 original guides: 582 canonical article URLs.
- 4 magazine tests pass: recovery/asset integrity, unsafe HTML isolation, valid internal links and substantive guides, extensionless legacy links.
- 8 existing chat tests pass; TypeScript and complete production build pass.
- Browser verified desktop magazine; 390px mobile article without horizontal overflow; search; personal reaction and question category; article-to-deck hash navigation; house entry with question and explicit draft selection without sending.
- Dedicated spec review passed; quality review identified legacy extensionless links and social SVG previews, both corrected with tests and raster social cards.
- Existing public archive is labeled as historical; its factual/editorial claims are not represented as freshly reviewed.
- Publishing source remains jhcramos/disqueamizade, feat/garage-proximity-prototype; validate release before promoting domain.

Production validation found Vercel cleanUrls strips .html before custom redirects. Added extensionless legacy redirect too, while excluding .json/.md data assets. Canonical article routes were already healthy.
