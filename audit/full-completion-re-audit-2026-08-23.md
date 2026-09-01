# DOONO De Creator ERP — Full Completion Re-Audit

**Assessment date:** 23 August 2026

This re-audit is based on the canonical repository at `/home/ubuntu/DOONO-ERP`, including the Laravel API, React/Vite frontend, migrations, jobs, commands, routes, and operational documents. It does not treat source presence as proof that a provider or production process is configured.

## Current code state

| Capability | Current source state | Verification boundary |
|---|---|---|
| OAuth | Passport client credentials, explicit feature switch, school-bound clients, scopes, one-time secret response, revocation, capability manifest, school/student/fee reads, attendance write, and fee-payment write are present. | Requires Composer Passport installation, persistent keys, HTTPS, and deployed database-backed tests. |
| Write-capable public API | Attendance and fee-payment writes are present. Fee payments use school ownership, invoice locking, overpayment rejection, unique transaction references, receipts, recalculation, and idempotency. | More write resources require separate contracts; no arbitrary student/result/staff mutation is exposed. |
| Webhooks | Paystack and verified Twilio status callback handlers exist with idempotency or monotonic-state handling. | Public HTTPS callback URLs, provider secrets, signature verification in staging, and replay tests are required. |
| Encrypted backups | Encrypted database dump, private-disk upload, checksum ledger, plaintext cleanup, queued manual trigger, schedule, queued verification, and opt-in retention expiry are present. | Persistent private storage, GPG/dump binaries, secret passphrase, independent retention, and restore drill are required. |
| External SMS/push | Twilio and Firebase adapters, encrypted push-token storage, per-recipient delivery ledger, readiness endpoint, retries, terminal failure state, and manual retry are present. | Provider credentials, recipient consent/preferences, worker, callback URL, and real delivery/callback verification are required. |
| Offline | App shell, offline CBT answer queue, offline attendance queue, stable idempotency keys, client timestamps, server conflict responses, and visible conflict retention are present. | Full offline mutation support for all modules is not safe to claim without module-specific conflict policies and database-backed tests. |
| Marketplace | Catalogue, school-scoped encrypted installations, audit events, platform review state, approval gate, and platform review UI are present. | Installation is metadata/configuration only; a secure executable plugin SDK/runtime is not present. |
| Benchmarking | Opt-in/revocable consent, cohort suppression, identity/student-data exclusion, school-level aggregates, and confidence intervals are present. | Formal privacy review, cohort monitoring, and school-facing comparison acceptance are required. |
| Extreme-scale evidence | Read-only HTTPS load-test harness, response timing, request IDs, pagination, queue/process roles, and operational runbook are present. | No local run proves hundreds of millions of schools or one million simultaneous calls; deployment-specific staged evidence is required. |

## Local operations now included

The source release now includes `dono-termux.sh`, which forwards Artisan, Composer, API, queue, scheduler, and test commands into the Debian Termux runtime where Sodium is available. The `dono:readiness` command reports cryptographic, OAuth, queue, storage, provider, and backup prerequisites without printing secret values. The root production Dockerfile now installs GPG and PostgreSQL client binaries and asserts Sodium during image construction. The service worker cache-name path is syntax-checked and the app-shell cache can be installed without a missing-constant runtime error.

## Remaining acceptance work

The next implementation phase should add database-backed regression tests for cross-school access, OAuth scope enforcement, duplicate payment references, webhook signatures, delivery retries, marketplace approval, benchmark suppression, backup verification, and offline conflict handling. It should also add a read-only offline cache policy and document which mutations are intentionally online-only until their conflict contract is approved.

Provider and infrastructure acceptance must be executed in a selected staging or production environment. Secrets must be entered into the host secret manager rather than source control or chat. A successful source build is not evidence that external SMS, push, payment callbacks, encrypted restore, or extreme-scale capacity are working.

