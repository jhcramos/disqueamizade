# TypeSafe in Disque Amizade

Status: project skill installed for Codex with `npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex --yes`. No runtime dependency, API credentials, or production calls were added.

## Recommended first use

Let visitors address Dora or Téo in natural language. TypeSafe can select an existing action from a bounded list: explain the house, request an introduction, suggest a shared activity, or do nothing/ask for clarification. For example, “Dora, não conheço ninguém aqui” can produce an introduction suggestion; “quero ficar na minha” can offer the existing solo preference. Explicit buttons continue to use ordinary code without a model call.

The existing `residents/social.ts` coordinator still checks availability, room, blocking, cooldowns, and invitations. The recipient must accept. A model must not start a private conversation, switch on media, or transfer an object by itself. The current GLM integration remains responsible for original dialogue; Jev returns typed decisions rather than free-form replies.

## Further candidates

- Select music, café, or the Biscoito game using the visitor's expressed request and available objects. Include a no-match option.
- Rank consenting, available introductions using interests people deliberately share, after deterministic eligibility checks. Do not infer sexual orientation or other sensitive traits.
- Select relevant household memories for Dora/Téo's occasional lines; keep private visitor conversations out of that context.
- Evaluate public-message moderation separately, with representative Brazilian Portuguese examples and review for uncertain cases. This is not part of the first integration.

Walking, collisions, fetch animations, poker rules, phone ringing, explicit opt-outs, and consent checks remain deterministic. Trigger semantic decisions on meaningful visitor requests rather than every frame or movement.

## Integration and evaluation

Use a server-side endpoint with `TYPESAFE_API_KEY`, bounded inputs, a pinned model version, timeout, rate limiting, and usage counters. In uncertainty or failure, use the existing buttons and rules. Recheck availability immediately before applying any suggested action. Begin with synthetic Portuguese examples, including slang, ambiguous requests, refusals, unavailable visitors, and attempted instruction injection. Compare against the current rules/GLM on cost, accuracy, and latency before activation.

The current model page lists Jev 1.13 (`jev-1.13.0`) at USD 0.042 per million input tokens, with output free. Illustrative arithmetic: 100,000 requests averaging 1,000 billed input tokens would cost USD 4.20 for TypeSafe inference, excluding GLM, hosting, taxes, and other services. Actual cost depends on the complete state and questions sent. Recheck pricing before activation. The documentation states English performs best; Brazilian Portuguese quality must be measured.

## Official references (checked 2026-09-19)

- https://docs.typesafe.ai/concepts/system-one
- https://docs.typesafe.ai/cookbooks/function_calling
- https://docs.typesafe.ai/sdk/javascript
- https://docs.typesafe.ai/models
