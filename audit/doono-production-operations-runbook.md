# DOONO De Creator ERP — Production Operations Runbook

## Service roles

The deployment image supports three process roles through `PROCESS_ROLE`:

| Role | Value | Command | Purpose |
|---|---|---|---|
| Web | `web` or unset | `php artisan serve --host=0.0.0.0 --port=$PORT` | Handles HTTP requests |
| Queue | `queue` | `php artisan queue:work --sleep=3 --tries=3 --timeout=120 --max-time=3600` | Delivers queued email and background jobs |
| Scheduler | `scheduler` | `php artisan schedule:work` | Runs subscription expiry and reminder schedules |

For a real Railway deployment, create separate services or deployment processes from the same application image. Set the web process to `PROCESS_ROLE=web`, add a queue process with `PROCESS_ROLE=queue`, and add a scheduler process with `PROCESS_ROLE=scheduler`. All processes must share the same database, cache, storage, and application secrets.

## Health monitoring

The container healthcheck calls Laravel’s `/up` endpoint. The authenticated platform health endpoint also reports database, cache, queue configuration, storage, migration-table presence, and scheduler heartbeat freshness. The scheduler heartbeat becomes healthy when the subscription expiry or reminder task runs. The platform health response also reports pending and failed job counts when the database queue tables exist, plus an explicit queue-worker heartbeat status. A queue driver being configured does not prove that a worker is alive; an `unknown` or `stale` worker status requires worker logs and process inspection rather than being treated as healthy.

## Required production configuration

Use `APP_ENV=production`, `APP_DEBUG=false`, a stable `APP_KEY`, a production database, a shared cache/lock store, `QUEUE_CONNECTION=database` or Redis with an active worker, a persistent object-storage disk for uploaded logos and avatars, verified frontend/API URLs, and Paystack live or test credentials matching each plan currency. Never commit `.env` files or gateway secrets.

## Deployment sequence

Deploy the web process first, run `php artisan optimize:clear`, run forward-only migrations after a database backup and staging verification, then restart the web, queue, and scheduler processes. Confirm `/up`, authenticated platform health, queue processing, scheduler heartbeat, email verification, password reset, and Paystack test-mode checkout before inviting schools.

## Recovery controls

Keep failed jobs enabled and review them daily. If Paystack reports a successful charge but the school subscription remains pending, use the payment reference and gateway verification flow rather than creating a second payment. If a migration fails, stop the release and inspect schema state; do not use `migrate:fresh` or manually mark an incomplete migration as complete on a live database.

CBT offline answers use an account-scoped local queue. Each replay carries a stable idempotency key and client-change timestamp; the server replays the same successful response for a repeated key and returns `409` with the stored server answer when the queued answer is older than the server answer. The user must review that conflict; DOONO does not silently overwrite the newer answer.

Automated encrypted database backups, uploaded-media backups, retention policies, restore drills, and a documented recovery-time/recovery-point target remain required operational work for a commercial SaaS launch. A deployment must select an encrypted, persistent backup destination and verify restoration before presenting backups as an operational guarantee; a local source archive is not a production backup.


## Remaining-capability deployment contracts

### OAuth and integration clients

Sanctum remains the first-party browser/mobile authentication mechanism. Passport client-credentials is reserved for school-owned machine integrations. A Proprietor must create a client, select only the required scopes, store the secret shown once, and revoke the client when it is no longer needed. Production deployments must generate or securely inject Passport keys, use HTTPS, keep token lifetimes short, and monitor revoked or expired clients. The current OAuth surface does not provide authorization-code or end-user delegation flows.

### SMS and push delivery

Set Twilio credentials and a verified status-callback URL before allowing SMS communications. Set Firebase project and server-side service-account configuration before allowing push communications. Provider-accepted is not equivalent to delivered; the delivery ledger changes state only from verified callback or provider response. Rotate provider credentials through the deployment secret manager, never through the frontend or source control. If a provider is not configured, the corresponding channel must fail closed and remain visible as unavailable rather than being reported as delivered.

### Encrypted backups

Set `BACKUP_ENCRYPTION_PASSPHRASE` to a deployment secret of at least 16 characters, configure `BACKUP_DISK` to persistent private storage, install the selected database dump binary and GPG on the worker, and set `BACKUP_SCHEDULE_ENABLED=true` only after the first dry run succeeds. Use `php artisan dono:backup --dry-run` to validate configuration, then run one real backup and verify its checksum and encrypted object location. Configure independent retention and versioning at the storage provider, record a recovery-point target, and perform a restore drill before treating the process as a production guarantee. The command encrypts database dumps; local media backup and provider-native object-storage replication require separate infrastructure configuration.

### Marketplace and benchmarking

Marketplace catalogue entries must be reviewed by the Software Owner before publication. A school installation records consent and configuration but does not execute arbitrary plugin code. Benchmarking is disabled by default per school, requires Proprietor consent, excludes identity and student-level records, and suppresses aggregates below the minimum cohort. Any future app SDK or benchmark comparison view requires a privacy/security review before release.

### Load testing

Use `performance/load_test.py` only against an approved HTTPS staging or production window and only for read-only endpoints. Capture deployment size, database and queue metrics, status counts, failure rate, p50/p95/p99 latency, and recovery behavior. Do not infer support for hundreds of millions of schools or one million simultaneous calls from a local run; capacity must be established with staged deployment-specific evidence.
