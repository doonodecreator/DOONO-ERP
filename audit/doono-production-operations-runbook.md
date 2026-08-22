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

The container healthcheck calls Laravel’s `/up` endpoint. The authenticated platform health endpoint also reports database, cache, queue configuration, storage, migration-table presence, and scheduler heartbeat freshness. The scheduler heartbeat becomes healthy when the subscription expiry or reminder task runs. A queue driver being configured does not prove that a worker is alive; worker logs and queue backlog must still be monitored.

## Required production configuration

Use `APP_ENV=production`, `APP_DEBUG=false`, a stable `APP_KEY`, a production database, a shared cache/lock store, `QUEUE_CONNECTION=database` or Redis with an active worker, a persistent object-storage disk for uploaded logos and avatars, verified frontend/API URLs, and Paystack live or test credentials matching each plan currency. Never commit `.env` files or gateway secrets.

## Deployment sequence

Deploy the web process first, run `php artisan optimize:clear`, run forward-only migrations after a database backup and staging verification, then restart the web, queue, and scheduler processes. Confirm `/up`, authenticated platform health, queue processing, scheduler heartbeat, email verification, password reset, and Paystack test-mode checkout before inviting schools.

## Recovery controls

Keep failed jobs enabled and review them daily. If Paystack reports a successful charge but the school subscription remains pending, use the payment reference and gateway verification flow rather than creating a second payment. If a migration fails, stop the release and inspect schema state; do not use `migrate:fresh` or manually mark an incomplete migration as complete on a live database.

Automated encrypted database backups, uploaded-media backups, retention policies, restore drills, and a documented recovery-time/recovery-point target remain required operational work for a commercial SaaS launch.
