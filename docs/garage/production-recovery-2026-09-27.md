# Production recovery — 2026-09-27

## Observed regression

The public domain served the legacy site and redirected `/garagem` to the old home page. This was confirmed in a fresh browser tab, so it was not just stale browser content.

Vercel's active deployment was `dpl_CeBxPajbkgQqAQ6ESt49T5cnJTdc` (`disqueamizade-2ti9erosi-jhcramos-projects.vercel.app`), created at 2026-09-26 21:34 UTC / 2026-09-27 07:34 Brisbane time. Its source was CLI. Its Git metadata identified `janamaiabr/disqueamizade`, branch `main`, commit `bb70494e7d895bcaaf0b01f2720d025ff9596a6b`, “Add Natal chat without signup article”. That commit changed the article, blog index and sitemap, but deployed the entire old application.

## Recovery performed

Promoted the previously verified production deployment `dpl_6LdWumtwJT7J4AHNcxZyjzoKh4Ts` (`disqueamizade-7tulym1jq-jhcramos-projects.vercel.app`). It was built from `jhcramos/disqueamizade`, branch `feat/garage-proximity-prototype`, commit `0e3ee2b3d032e3820e668f71a9f49c882d265157`.

The promotion completed successfully. A fresh visit to `/garagem` showed the restored entry form and entered the 3D house. The house rendered, including its rooms, resident controls, compact seat markers, wheel-zoom instruction and Comprar terreno link. No database changes or source-history rewrites were made.

## Remaining prevention work

The process or tool which invoked the legacy CLI deployment has not been identified. No matching local Codex automation or GitHub Actions run for that commit was found. This does not rule out an automation elsewhere. The owner was asked which tool publishes the blog.

Update that publishing process to use the current authorized repository and a revision containing the current production house before resuming production releases. The new article remains in the legacy repository; restoring the house does not migrate that article into the current site. Migrate any desired content through the current repository without replacing the application.

The new instructions in AGENTS.md guide future work here; they are not a technical block on deployments made from a different checkout or external tool.
