# DOONO De Creator ERP — Full-Completion Acceptance Contract

**Date:** 23 August 2026

A capability is complete only when its source workflow, authorization boundary, persistence contract, failure state, observability, and deployment verification all pass. A route or UI control existing by itself is not acceptance evidence.

## Acceptance gates

| Area | Required pass evidence |
|---|---|
| OAuth | Composer lock installation; persistent Passport keys; disabled-mode boot; enabled-mode token issuance; scope rejection; revoked/expired client rejection; school-bound reads; fee-payment and attendance write idempotency; cross-school negative tests. |
| Write APIs | Every write has a published request/response contract, stable idempotency key, authorization and school-bound validation, duplicate/replay behavior, audit record, and financial or academic conflict handling. |
| Webhooks | HTTPS endpoint; provider signature tests including invalid, replayed, and out-of-order callbacks; idempotent event persistence; monotonic state transitions; alerting for rejected callbacks. |
| SMS/push | Server-side secrets; consent/preferences; queue worker; successful provider acceptance; verified callback or provider state; retry and terminal failure evidence; token revocation and secret rotation procedure. |
| Encrypted backups | Successful dry run; real encrypted artifact in private persistent storage; recorded checksum; decryptability verification; retention test; independent restore into an isolated database; measured RPO/RTO. |
| Offline | Module-specific queue contract; account isolation; stable idempotency; timestamp/version conflict; visible conflict resolution; recovery after reload; tests for every mutation permitted offline. High-risk finance/results writes remain online-only until this contract exists. |
| Marketplace | Owner review record; capability/permission manifest; approved publication gate; school-scoped installation/revocation; encrypted config; no arbitrary code execution; uninstall/revocation audit. |
| Benchmarking | Explicit consent and revocation; minimum cohort suppression; no identity/student records; aggregate quality monitoring; privacy review; confidence/uncertainty display; school-facing comparison authorization. |
| Extreme scale | Approved staging environment; representative database; measured p50/p95/p99 latency, throughput, error rate, queue latency, connection saturation, payload size, and recovery under staged concurrency. No capacity claim is valid from local or phone-only execution. |

## Go-live blockers

The release is blocked if any of the following is true: a provider secret is missing; a callback cannot be verified; a queue or scheduler worker is not alive; backup restore has not been demonstrated; tenant-negative tests are absent for a new write; a high-impact mutation has no conflict policy; marketplace code execution is not sandboxed; benchmarking privacy review is incomplete; or load evidence is not deployment-specific.

