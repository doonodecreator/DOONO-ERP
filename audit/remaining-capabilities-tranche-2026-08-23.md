# DOONO De Creator ERP — Remaining Capabilities Tranche

**Date:** 23 August 2026

This tranche extends the existing tenant-safe foundations without replacing Sanctum, `CurrentContextService`, school-scoped audit boundaries, or subscription middleware.

## Implemented in source

| Capability | Evidence | Operational boundary |
|---|---|---|
| OAuth | Added explicit `OAUTH_ENABLED` control, public capability manifest, `fees.write` scope, and fee-payment write endpoint alongside existing reads and attendance synchronization. | Passport dependencies and persistent keys are still required in deployment. OAuth remains machine-to-machine; Sanctum remains first-party auth. |
| Write-capable public API | Fee-payment writes require a school-owned invoice, positive non-overpaying amount, unique external transaction reference, and `Idempotency-Key`; the normal receipt and fee status workflow is reused. | The endpoint records an integration-submitted payment; it does not verify an external bank or gateway on its own. |
| External delivery | Added provider readiness endpoint, safe disabled options in the communication form, transient retries with backoff, terminal failure state, and manual retry controls. | Twilio/Firebase credentials, consent/preferences, queue worker, and verified callback configuration remain deployment requirements. |
| Encrypted backups | Added queued checksum/decryptability verification, initiator propagation, and opt-in retention expiration while preserving encrypted-only storage and plaintext cleanup. | Persistent private storage, GPG/dump binaries, passphrase management, media replication, restore drills, and measured RPO/RTO remain operational requirements. |
| Marketplace | Added platform-owner review metadata and UI. New entries begin as drafts; only reviewed-and-approved published entries appear to school Proprietors. | Installation stores encrypted school configuration but intentionally does not execute arbitrary plugin code. A reviewed SDK/runtime is future architecture work. |
| Benchmarking | Added anonymous school-level 95% confidence intervals while retaining opt-in consent, identity suppression, and the minimum cohort threshold. | Formal privacy review, cohort monitoring, and school-facing comparison UX remain required before public benchmarking claims. |

## Not claimed complete

Full offline mutation support for every module is not enabled. Financial, results, staff, and other high-impact writes need module-specific conflict contracts rather than a generic browser replay queue. Extreme-scale capacity is not proven by local execution; deployment-specific load testing with database, queue, storage, and regional capacity evidence remains required. External provider delivery is not operational until the provider secrets, queue worker, callback URL, consent/preferences, and callback state transitions are verified in the selected deployment.

## Validation gates for this tranche

The canonical source must pass PHP lint, route and command discovery, the OAuth enabled/disabled route checks, the Laravel test suite, the frontend production build, the DOONO architecture guard, and `git diff --check`. Database-backed cross-school, payment-reference, provider-callback, marketplace-review, backup, and delivery-retry tests still require CI or staging with the project’s MySQL-compatible database.

