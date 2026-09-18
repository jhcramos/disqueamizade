# House life and the bar poker table

Approved scope: improve resident locomotion, Biscoito dialogue and movable bed; use an existing bar table for up to four visitors playing Texas Hold'em with free virtual chips.

Movement uses buffered snapshots following navigable floor paths, not exponential catch-up. Individual stride phase advances with distance; Dora, Téo and Biscoito have distinct speed and dwell schedules. Pauses must stop the feet. No additional AI calls for movement.

Biscoito gets short first-person comic balloon reactions and participates in the existing AI speaker rotation. Text only; existing global generation budget remains unchanged.

Visitors approach and pick up the bed, walk with it, and place it on free floor. One carrier at a time, no overlapping furniture or blocked doorways, cancel restores last placed position. Disconnect releases the bed. Biscoito's rest destination follows its placed position. State is shared and persisted in the existing world row with backward-compatible parsing.

Poker uses the existing middle bar table with green felt, cards and chips. Up to four visitors; fixed-limit Texas Hold'em, blinds 10/20, betting increments 20 then 40, three raises per street, 1000 free chips on joining. No purchase, money, prizes, or cashout. At least two players start a hand. Players can fold, check/call, or raise when a full raise is affordable; short stacks can call all-in. Side pots, ties, turn timeout and disconnect folds are server-authoritative. Joining during a hand waits for the next deal. Only the requesting player's hole cards are sent before showdown. Server shuffles; no cards/deck shipped in shared resident snapshots. Poker shares the existing serverless endpoint via a separate handler, avoiding another deployed function. CAS updates preserve household and game state concurrently. The table UI works on mobile and is available through its physical table/seat marker.

Validation: model tests for movement, placement, speaker rotation, poker ranking/pots/privacy/turns/timeouts; API tests for CAS and identity; TypeScript and production build; browser desktop/mobile and multiplayer smoke checks. Commit, secret scan, push and production deploy after checks.

## Verification

- 32 focused model/API/geometry tests passed, including private-card views, signed identities, CAS retries, command deduplication, side pots, odd chips, all-ins, turn expiry, bed exclusivity and footprint validation.
- Production build and TypeScript passed.
- Two isolated browser contexts used the real API handler against a test in-memory database: join, deal, private cards, call/check, shared flop, fold, leave. Desktop actions stay visible; mobile panel stays within a 390px viewport. No page errors.
- Browser checks confirmed picking up/returning the bed and Biscoito's first-person balloon.
- Full-history secret scan reviewed three existing findings: a historical public Supabase anon JWT and two truncated documentation examples. No private credentials were found. Exact existing fingerprints excluded for the clean verification scan; no broad file exclusions added.
