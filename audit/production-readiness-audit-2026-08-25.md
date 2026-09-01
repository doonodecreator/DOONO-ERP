# DOONO K–12 ERP Production-Readiness Audit

**Audit date:** 25 August 2026  
**Repository:** `/home/ubuntu/DOONO-ERP`  
**Scope:** Laravel/Sanctum backend, React/Vite frontend, routes, models, migrations, tenant authorization, role dashboards, onboarding, finance, results, CBT, communications, operations, deployment configuration, dependencies, and school-facing readiness.

## Executive conclusion

DOONO has a substantial K–12 foundation and is suitable for a controlled pilot after the deployment and operational gates in this report are completed. It should **not yet be presented to schools as a fully proven production system** solely because the source compiles. The repository contains 144 backend controllers, 129 models, 211 migrations, 131 frontend pages, and 29 shared frontend components. The audit confirmed strong architecture guardrails, but a database-connected end-to-end acceptance run, production backup-restore drill, external mail delivery test, and real school-user pilot are still required.

The higher-education expansion was not applied. The product remains focused on nursery, primary, and secondary schools.

## Verified fixes applied in this audit

| Area | Verified issue | Action taken | Result |
|---|---|---|---|
| Role dashboards | Most staff dashboard routes were reachable without their intended role middleware, even though controllers and navigation assumed role separation. | Added explicit `role:` middleware for Proprietor, Principal, both Vice Principals, Teacher, Form Teacher, Nursery Head, Primary Headmaster, and Secondary Principal dashboards. | Direct API calls now require the matching school-scoped role. |
| Audit logs | The audit-log controller filtered platform actions correctly, but the route did not require the existing `view_audit_logs` permission. | Added the permission middleware and granted the permission to Proprietors through both the role seeder and an additive migration. | Software Owners retain platform and school audit feeds; Proprietors receive only current-school activity and cannot see platform actions. |
| Local onboarding | When local email verification was disabled, registration and invitation acceptance did not return an API token even though the frontend expected one. | Registration and new invitation acceptance now issue a token only when verification is disabled in local/testing environments. | Local testing no longer lands in a logged-out dead end. Production still forces verification. |
| School branding | The report-card logo preview used the same URL fallback twice, so a stored logo could fail to appear. | Corrected the fallback to use the stored `report_card_logo` field. | Saved report-card branding can be displayed by the preview. |
| CBT | The deadline timer used a stale submit callback and had a missing dependency warning. | Stabilized assessment loading and submission with `useCallback` and included the submit callback in the timer dependencies. | Automatic submission at test expiry is wired to the current attempt state. |
| Expenses | The page contained invisible Unicode characters, one-off layout/table/modal markup, unused state, and a non-shared loading/empty/error pattern. | Rebuilt the page with shared layout, table, feedback, modal, form, and button components while preserving `/expenses` API behavior. | Expense recording and review now follow the common mobile-friendly UI pattern. |
| Dependencies | Composer and npm audit scans found vulnerable dependency versions before the final pass. | Applied narrowly scoped Composer updates and `npm audit fix`. | Composer reported no advisories; frontend production dependencies reported zero vulnerabilities. |

## Architecture and tenant-safety findings

The canonical frontend Axios client is `frontend/src/services/api.js`; the source scan found no frontend `fetch(` calls, no competing HTTP client usage in the scanned page code, no legacy `user?.role` or `user?.roles` access pattern, and no page-level `/api/v1` double-prefix usage. The architecture guard passed, including the `CurrentContextService` boundary, shared role helper, model fillable checks, Support Centre privacy, and canonical HTTP client checks.

The backend uses `CurrentContextService` as the current-school authority and the audit found no `$user->currentSchoolId()` usage. Role middleware distinguishes the platform-wide `super_admin` role from school-scoped operational roles. The role invitation flow validates form classes and streams against the active school before creating Form Teacher assignments.

The main remaining tenant-safety requirement is operational: the application must be tested with two real schools and at least two users in each. A source scan cannot prove that every relationship, policy, export, signed URL, and asynchronous job behaves correctly against a live database. That test must be performed before onboarding real student records.

## Functional readiness risks

| Priority | Finding | Why it matters before a school pilot | Required treatment |
|---|---|---|---|
| P0 | No live database-connected end-to-end acceptance run was possible in this sandbox. | Registration, school setup, invitations, academic setup, results approval, payments, parent/student portal access, and migrations can still fail at runtime even when static checks pass. | Run the complete acceptance script against a clean production-like database and a second school tenant. |
| P0 | The migration history has recurring MySQL identifier-length and index-assumption risks. | Previous Termux deployments already failed on long generated indexes and assumed index names. | Run all migrations from zero on the exact target database engine and run them again on an existing upgraded installation. Keep explicit short index names and metadata-safe drops. |
| P1 | Render is configured for PostgreSQL, while the mobile/Termux workflow uses MySQL. | Database-specific enums, index drops, raw SQL, and backup commands can behave differently. | Choose and document the production database engine. If Render PostgreSQL remains the target, complete a clean PostgreSQL migration run and backup/restore drill. |
| P1 | Production email verification depends on SMTP and a correct `FRONTEND_URL`. | New proprietors and invited staff cannot sign in until verification succeeds. | Configure SMTP, verify the sender domain, set `FRONTEND_URL` and CORS exactly, and test registration, invitation, resend, verification, login, and password reset from a real device. Never disable verification in production. |
| P1 | Encrypted backups and retention are disabled in the supplied Render blueprint. | A school-facing system containing children’s records needs a tested recovery path. | Configure private object storage, an encryption passphrase stored outside source control, scheduled backup, retention, and a restoration drill. Record the result. |
| P1 | Queue, scheduler, storage, and external delivery are provider-dependent. | Email, SMS, push notifications, backups, and asynchronous communication can appear accepted while not being delivered if workers or credentials are missing. | Verify the queue worker, scheduler, private storage, mail, Paystack callbacks, and notification providers in the chosen deployment. |
| P1 | AI Tutor, live rooms, recordings, SMS, push delivery, OAuth, and some integrations are intentionally disabled or readiness-gated by default. | They must not be marketed as available merely because their screens exist. | Keep them clearly marked unavailable until credentials, callbacks, consent, moderation, retention, and provider tests are complete. |
| P2 | Frontend lint passes with zero errors but still reports 90 warnings, mainly hook dependency and unused-code warnings. | Some warnings can represent stale data or dead controls, particularly around timers and reload functions. | Continue the warning-reduction pass module by module; prioritize warnings in attendance, results, CBT, communications, timetable, finance, and role invitations. |
| P2 | The production JavaScript bundle remains large at approximately 1.87 MB minified. | Mobile users on low-bandwidth connections experience slower first load. | Introduce route-level code splitting and lazy loading after functional acceptance; do not trade away error handling for bundle size. |
| P2 | Shared UI adoption is improved but not complete across all pages. | Schools experience inconsistent forms, tables, empty states, and navigation if old pages remain in use. | Continue migrating remaining high-traffic pages to `PageHeader`, `DataTable`, `LoadingSpinner`, `EmptyState`, `Modal`, and shared form controls without rewriting working APIs. |

## Validation completed

The following checks passed after the fixes:

| Check | Result |
|---|---|
| PHP syntax on touched backend files | Passed |
| PHPUnit | 14 tests, 19 assertions, all passed |
| Laravel route compilation | Passed |
| DOONO architecture guard | Passed |
| Guide validation | 73 registered modules and 60 role guide entries verified |
| Frontend lint | Passed with 0 errors and 90 warnings |
| Frontend production build | Passed; bundle-size warning remains |
| Frontend production dependency audit | 0 vulnerabilities reported |
| Composer dependency audit | No security vulnerability advisories reported |
| `git diff --check` | Passed |

## School onboarding gate

Before the first school is invited, configure the production environment, run all migrations on a clean database, create a test organization and two schools, invite a Proprietor and Principal, and verify that each person sees only the intended school context. Then test the complete K–12 workflow: academic session and term setup; divisions, classes, streams, and subjects; staff and form-teacher assignment; student and parent accounts; attendance; assignments; CBT; results computation and approval; report-card publication; fees, cashier settlement, and Paystack callbacks; notices; library; hostel; transport; clinic; support; audit logs; logout; password reset; and mobile navigation.

The pilot should begin with one real school, a written data-import backup, and a parallel run against the school’s existing records. Reconcile students, staff, balances, attendance, and results before expanding to additional schools. Do not claim full offline capability, backup recovery, external delivery, live-provider reliability, statutory compliance, or extreme-scale capacity until those are demonstrated in the target deployment.

## Release decision

**Status: Conditional pilot readiness, not unrestricted production readiness.** The source-level defects fixed here are high-impact and validated, but the P0 live-database and migration-engine gates remain mandatory. Once those gates pass on the chosen host and one pilot school completes acceptance, DOONO can be offered to schools in a controlled rollout.
