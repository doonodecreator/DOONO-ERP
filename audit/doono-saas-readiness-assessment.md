# DOONO De Creator ERP — SaaS Readiness Assessment

**Assessment date:** 22 August 2026  
**Assessment basis:** Current repository inspection of the Laravel 13 + Sanctum backend and React/Vite frontend, including routes, middleware, context resolution, subscription services, deployment files, migrations, tests, and the authenticated application shell.

## Executive conclusion

DOONO De Creator ERP is no longer a small prototype. It has a substantial school-management product surface: approximately **111 backend controllers, 90 models, 153 migrations, 112 frontend pages, 26 shared frontend components, and a canonical API service**. It already contains meaningful business capabilities such as organizations, schools, school-scoped roles, invitations, academic setup, students, parents, staff, attendance, timetable, assignments, fees, results, report cards, CBT, library, hostel, clinic, transport, reception, communications, school branding, email verification, password reset, Paystack integration, audit logs, and subscription administration.

However, the product is not yet ready to be presented as a fully production-grade, open-registration SaaS for schools. The principal deficiency is **not the number of modules**. The principal deficiency is the absence of a hardened SaaS operating foundation around those modules: production deployment processes, verified tenant-isolation tests, complete entitlement enforcement, quota enforcement, payment reconciliation, observability, backup and recovery, migration discipline, and end-to-end workflow testing.

My professional rating is:

| Area | Current assessment | Release implication |
|---|---|---|
| Product breadth | Strong but uneven | Good basis for a controlled pilot |
| Authentication and invitations | Substantial foundation | Requires security and lifecycle testing |
| Tenant model | Designed correctly in principle | Must be proven with automated isolation tests |
| Billing and Paystack | Important safeguards exist | Requires live reconciliation and failure testing |
| Subscription entitlements | Central service exists but is incomplete | Paid features can be inconsistently gated |
| Frontend UX | Broad and increasingly standardized | Still has legacy inconsistency and navigation debt |
| Deployment operations | Development-grade | This is a release blocker for public SaaS |
| Test coverage | Very weak for the product size | Major release blocker |
| Large-scale readiness | Not yet demonstrated | Cannot claim 500 million schools currently |

> **Bottom line:** DOONO is suitable for a controlled school pilot after a focused hardening phase. It is not yet safe to promise unattended operation at large commercial scale.

## What is already strong

The system has a correct high-level multi-tenant direction. `CurrentContextService` is explicitly intended to resolve the authenticated user’s organization, school, roles, permissions, and onboarding stage. `HasSchool` rejects ordinary users who do not have a valid school context and blocks mismatched request-level school identifiers. School-scoped roles remain in the `user_roles` relationship rather than being flattened into one global role column.

The authentication foundation is also materially better than a basic CRUD application. Registration creates an organization, email verification is required before login, password reset exists, temporary-password enforcement exists, Sanctum tokens are revoked on login/logout, and school switching checks ownership or role membership. Role invitations use hashed one-time tokens, expiry, duplicate-pending checks, email matching, authenticated acceptance for existing accounts, school-scoped role attachment, and form-teacher class/stream validation.

The billing foundation includes Paystack initialization and verification, pending-payment reuse, idempotency middleware, trial-aware paid start, future-expiry renewal extension, subscription exemptions, time-bound free access, and a global enforcement toggle. The subscription plan edit problem shown in the supplied screenshot was traced to the Premium `-1 = unlimited` convention conflicting with `min:1` validation and hidden form fields; that specific defect has been repaired.

The platform also has meaningful administrative controls: platform-only routes for plans, features, coupons, campaigns, school subscriptions, global settings, announcements, revenue, and platform health; school-visible versus platform-visible audit streams; local email inbox support for testing; profile and school branding storage; and a growing shared-component library.

## Critical gaps before public SaaS release

### 1. Production deployment is still development-grade — **P0**

The backend Dockerfile runs `php artisan serve --host=0.0.0.0 --port=$PORT`. It does not provide a production web server, process supervisor, queue worker, scheduler process, healthcheck, or deployment-time asset pipeline. The application environment defaults also show database-backed queue and cache drivers, while the repository does not provide a production worker definition.

This creates several practical risks. Verification emails, password-reset messages, platform announcements, and other queued mailables may remain in the jobs table if no worker is running. The daily subscription expiry schedule only runs if the hosting platform separately invokes Laravel’s scheduler. The platform health endpoint reports that a queue driver is configured, but it does not prove that a worker is alive or that the queue is draining.

**Required control:** define separate web, queue-worker, and scheduler processes; add a real healthcheck; configure graceful restarts; publish a deployment runbook; and test worker failure, restart, and queue recovery.

### 2. Entitlement enforcement is not yet a complete product contract — **P0**

`SubscriptionAccessService` centralizes the policy, which is the right architectural move, but its current plan-feature resolution does not expand the Premium legacy wildcard `*` into the full known catalog. Therefore a Premium plan seeded with `features: ['*']` may not receive every fallback feature through the same path used by the access matrix.

The generic subscription middleware maps many paid routes, but entitlement enforcement still depends on a manually maintained route-prefix map. The catalog contains features such as inventory and AI reports, while the route map does not visibly cover every catalogued paid module. This creates two opposite risks: a paid feature may be blocked unexpectedly, or an unlisted paid route may remain accessible without the expected entitlement.

Plan capacity fields exist, but student, staff, and branch quotas are not comprehensively enforced at the creation and invitation boundaries. A plan showing `max_students` or `max_staff` without a central quota service is a commercial promise that the system may not currently enforce.

**Required control:** make the entitlement catalog the source of truth, support wildcard expansion, attach feature identifiers to route groups or controllers rather than only string-prefix heuristics, add a central quota service, and create access-matrix tests for every paid module.

### 3. Automated test coverage is far below the product’s risk profile — **P0**

The repository contains only four test files and the known suite currently verifies five assertions. Those tests include academic computation logic, but they do not constitute coverage for the most dangerous SaaS boundaries.

Missing high-value automated tests include cross-school read and write attempts, platform-owner versus proprietor audit visibility, role invitation acceptance and revocation, password verification gates, subscription expiry, trial-to-paid timing, global free mode, time-bound exemptions, duplicate Paystack verification, webhook replay, payment interruption recovery, plan feature updates, quota limits, report-card publication visibility, and parent access to multiple children.

**Required control:** add feature tests around every authorization boundary before adding more UI polish. For this product, an endpoint security test suite is more valuable than another dashboard redesign.

### 4. Migration and data-release discipline is unsafe — **P0**

The codebase contains 153 migrations and the project history already includes duplicate-column failures and manually marking migrations as complete after production schema drift. That is a serious operational signal. A SaaS release must never rely on an operator guessing whether a migration has already run or inserting rows into the migrations table manually.

**Required control:** make migrations idempotent where appropriate, remove duplicate historical responsibility, add schema-drift checks, use a staging database restore before production migration, and document a forward-only rollback strategy. Never use `migrate:fresh` or manual migration-table edits in a live school installation.

### 5. Tenant isolation is architecturally intended but not yet proven — **P0**

The system has a strong context service, but the repository still contains request-level helper methods named `currentSchoolId()` in several FormRequest classes, while the project architecture requires the centralized context service to be the single source of truth. This creates a risk of different layers resolving different schools.

There are also 111 controllers and many route-model-bound resources. A single missed `school_id` condition in one controller can expose another school’s students, fees, staff, results, or medical data. The existence of `HasSchool` does not automatically scope every Eloquent query or every route-bound model.

**Required control:** implement policy or scoped-binding tests for every school-owned model; prohibit controller/request re-derivation of current school; add negative tests that attempt to read, update, delete, and download another school’s records; and add database-level indexes and constraints for tenant keys.

## Important but not yet release-blocking gaps

### Billing, finance, and commercial operations

The Paystack lifecycle is a good foundation, but a serious SaaS billing system needs more than successful checkout. DOONO still needs a formal payment ledger and reconciliation process that compares initialization, webhook events, verification, gateway settlement, school subscription state, refunds, reversals, disputes, and chargebacks. It also needs an operator workflow for a payment that succeeded at Paystack but failed to update the application.

Plan management should eventually support plan versioning or effective-dated changes. Editing a live plan can unexpectedly change the entitlement or price shown to existing subscribers. Upgrade and downgrade proration, renewal timing, failed-renewal states, grace periods, invoice numbering, receipts, tax/VAT configuration, refund handling, and customer billing history should be explicit product workflows rather than implicit controller behavior.

The school-fee side also needs a formal settlement and reconciliation view. A parent payment must remain linked to the correct school, child, fee structure, academic session, term, payer, receipt, gateway reference, and settlement status. That financial chain should be independently testable and exportable.

### Identity and staff lifecycle

The invitation flow is stronger than average, but the employment lifecycle must be completed as a first-class feature. A proprietor should be able to suspend, terminate, reinstate, transfer, or remove a staff member while preserving historical records and invalidating active sessions. Role changes should be effective-dated and auditable. The system should prevent stale permissions after employment status changes and should clearly handle a user who belongs to multiple schools with different roles.

Enterprise customers will also expect multi-factor authentication, active-session/device management, forced logout, stronger administrative approval controls, optional SSO/SAML or at least a documented roadmap, and configurable password/session policies.

### Product workflow completeness

The product has broad modules, but breadth is not equivalent to a fully completed workflow. The highest-risk paths need explicit acceptance criteria from setup to final output. Examples include: school registration to first class and stream; invitation to verified login; fee structure to child-specific invoice to payment to receipt to settlement; result entry to validation to approval to publication to parent portal; CBT question bank to published test to student attempt to reviewed result; and timetable creation to student/teacher personalized views.

Each workflow needs clear states, audit events, retry behavior, permissions, empty states, and recovery from partial failure. The system should not be called “ready” merely because each page loads.

### Communications and messaging

The platform has in-app communication, read tracking, local email mode, platform announcements, and recipient targeting. Production email delivery remains a thinner abstraction: the inspected delivery service does not demonstrate provider failover, bounce and complaint handling, delivery status tracking, webhook processing, or a durable retry/dead-letter workflow. SMS is listed as a paid feature, but a production SMS provider, sender identity, delivery receipts, consent, rate limits, and cost controls need to be documented and tested.

### Observability and incident response

The health endpoint checks a database probe, a cache probe, configuration-level queue presence, storage writability, and migration-table presence. It does not show queue backlog, worker liveness, scheduler freshness, mail delivery, Paystack availability, webhook failures, database latency, error rate, storage growth, or per-tenant failures.

A SaaS platform needs structured logs with correlation IDs, request IDs, school IDs, user IDs, payment references, and job IDs; centralized error reporting; metrics and alert thresholds; audit retention; uptime monitoring; and a documented incident runbook. The platform owner needs to know not only that the application process is alive, but whether schools can log in, save records, receive mail, and complete payments.

### Backups, restore, privacy, and governance

The inspected repository does not establish a tested backup-and-restore program. Production readiness requires automated encrypted backups, point-in-time recovery where available, restore drills, retention policies, disaster recovery objectives, and an export path for a school’s data.

Because the platform stores children’s personal, academic, financial, health, and identity data, it also needs a privacy and governance layer: privacy notice, consent and lawful-basis documentation, data retention/deletion rules, access request handling, breach response, staff confidentiality controls, audit retention, and clear data-processing responsibilities between DOONO and each school.

### Scalability and architecture

The project contains tenant partition metadata, but that is not the same as actual partitioned storage. The current helper describes a partition; it does not route queries to separate databases or connections. The deployment and environment defaults also point toward a single application/database configuration with database-backed queue and cache.

The system can be made to support many schools, but it cannot honestly claim readiness for 500 million schools today. At that scale, it would require regional routing, tenant partitioning, asynchronous workflows, read/write separation, object storage, queue sharding, rate limiting, per-tenant quotas, database lifecycle automation, observability at cardinality, and a rigorous data-retention model. The immediate goal should be a reliable first cohort, followed by measured scale testing.

### Frontend navigation and maintainability

The authenticated frontend uses a large in-memory page-state model inside `App.jsx` for most navigation rather than URL-driven routes. The custom history and back-button workarounds improve the experience but are not a substitute for deep-linkable, reload-safe, permission-aware routes. This affects browser back behavior, mobile navigation, sharing links, support troubleshooting, and recovery after refresh.

The frontend has shared components, but legacy pages still contain one-off inline styles and different form/table patterns. The current page count is large relative to the shared-component count. A design system pass should continue, but it should follow workflow and authorization testing rather than replace it.

## SaaS capabilities that should still be added

| Capability | Why it matters | Priority |
|---|---|---|
| Production web/worker/scheduler process split | Prevents queued mail and scheduled billing tasks from silently stopping | P0 |
| Tenant isolation test suite | Proves one school cannot access another school’s records | P0 |
| Entitlement and quota test suite | Prevents paid-feature bypasses and unenforced capacity promises | P0 |
| Payment reconciliation and exception queue | Handles money received while the application was unavailable | P0 |
| Backup, restore, and disaster-recovery runbook | Protects school data and platform continuity | P0 |
| Migration release discipline | Prevents schema drift and live deployment failures | P0 |
| Structured observability and alerting | Makes failures visible before schools report them | P1 |
| Staff suspension, termination, session invalidation | Completes real employment administration | P1 |
| Billing invoices, refunds, proration, grace periods | Makes commercial operation professional | P1 |
| Email/SMS delivery tracking and bounce handling | Makes communication dependable and auditable | P1 |
| Data export, retention, privacy, and breach workflows | Required for responsible handling of school and child data | P1 |
| URL-driven frontend routing and deep links | Improves mobile navigation, support, and refresh behavior | P1 |
| Regional tenant partitioning and load testing | Required for large-scale growth | P2 |
| MFA/SSO/device management | Required for mature school and enterprise buyers | P2 |
| Marketplace/API/webhook platform | Needed for integrations and ecosystem growth | P2 |

## Recommended implementation order

### Release gate: make one reliable pilot release

First, stop treating every module as equally urgent. Freeze new feature expansion and harden the foundation. Define production processes, configure queue workers and the scheduler, verify Paystack webhooks, create tenant-isolation tests, complete the entitlement wildcard and route matrix, enforce quotas, and establish backup/restore procedures. Then run one complete school lifecycle in a staging environment with real email and Paystack test mode.

### Phase two: make the pilot operationally professional

Add payment reconciliation, billing invoices and receipts, refund and failed-payment workflows, staff offboarding, structured error reporting, metrics, alerts, mail delivery status, data export, privacy documentation, and a deployment/runbook system. Convert the highest-use frontend screens to URL-driven routes and finish the shared form/table patterns.

### Phase three: prepare for commercial growth

After measuring real usage, introduce Redis where justified, queue scaling, object storage, read replicas, regional data placement, tenant partition routing, load tests, API versioning, public documentation, integration webhooks, MFA, and enterprise identity controls. Scale should be driven by measured bottlenecks, not by a theoretical school count.

## Definition of “ready to sell”

DOONO should not be called production-ready until the following statement is true:

> A new school can register, verify its owner, create its structure, invite staff, activate a role, manage students and parents, configure fees, receive and reconcile a payment, enter and publish results, generate a report card, use a paid module according to its plan, recover from a network interruption, and receive support—all without an operator editing the database manually, while automated tests prove that another school cannot see its data.

At present, DOONO satisfies parts of that statement, but not the complete end-to-end guarantee. The strongest next investment is therefore **SaaS hardening and verification**, not adding another dashboard module.

## Evidence inspected

The assessment is based on these repository locations:

| Evidence | Relevance |
|---|---|
| `backend/dono-api/routes/api.php` | Route groups, role gates, school middleware, subscription boundary, platform-only actions |
| `backend/dono-api/app/Services/CurrentContextService.php` | Organization/school/role context resolution |
| `backend/dono-api/app/Http/Middleware/HasSchool.php` | School-context and request school-ID checks |
| `backend/dono-api/app/Http/Middleware/CheckActiveSubscription.php` | Feature-prefix entitlement enforcement |
| `backend/dono-api/app/Services/SubscriptionAccessService.php` | Free/paid feature catalog and plan access policy |
| `backend/dono-api/app/Models/SchoolSubscription.php` | Expiry, trial, exemption, discount, and active-state behavior |
| `backend/dono-api/app/Http/Controllers/Api/AuthController.php` | Registration, verification, login, school switching, password and profile flows |
| `backend/dono-api/app/Http/Controllers/Api/RoleInvitationController.php` | Invitation, role activation, form-teacher assignment, and staff creation |
| `backend/dono-api/app/Http/Controllers/Api/ActivityLogController.php` | Platform/school audit-log separation and pagination |
| `backend/dono-api/Dockerfile` | Current deployment process definition |
| `backend/dono-api/routes/console.php` and `app/Console/Commands/` | Scheduler and subscription-expiry operations |
| `backend/dono-api/tests/` | Current automated test surface |
| `frontend/src/App.jsx` and `frontend/src/layouts/DashboardLayout.jsx` | Navigation, authenticated shell, history, offline, and global subscription UX |

## Final recommendation

Do not discard the product. The product foundation is valuable and unusually broad for its current stage. Do not merge more feature branches blindly either. Establish a protected `release-candidate` branch and spend the next development cycle on the P0 controls in this document. Once the platform passes the tenant, billing, migration, queue, backup, and end-to-end workflow gates, DOONO can be credibly offered to a controlled group of schools and improved from real operational data.


## Parallel hardening work completed after the assessment

The no-freeze implementation has now started across multiple workstreams. The following repairs were applied and validated without removing existing modules:

| Workstream | Completed repair |
|---|---|
| Tenant/security | Added the `staff.active` gate to school-module routes; suspended, retired, resigned, and terminated staff are denied access; active and on-leave staff remain allowed; staff-role accounts without a staff record no longer pass silently. |
| Active-school context | Frontend roles and permissions are now derived from the selected school; organization-context users do not inherit permissions from another school. |
| Subscriptions | Premium wildcard plans expand across the complete feature catalog; plan recommendations use database pivots and legacy features; expired active plans cannot retain paid access; malformed active records without an expiry date do not grant paid access. |
| Quotas | A central `SubscriptionQuotaService` now enforces student capacity during direct creation and admission, and staff capacity during invitation creation and acceptance, while respecting global free mode and exemptions. |
| Payments | Subscription checkout is serialized per school with a cache lock; gateway references use stronger random values; verification uses the configured Paystack URL and has a timeout; checkout remains idempotent and trial-aware. |
| Operations | Subscription expiry and reminders are both scheduled; reminders are queued; deployment images support separate web, queue, and scheduler process roles; container healthchecks call Laravel `/up`; platform health reports scheduler heartbeat freshness. |
| Frontend resilience | A shared error boundary prevents one page failure from taking down the authenticated shell; plan cards show real capacities and included features; checkout sends an idempotency key; platform dashboard shows pending and failed payment counters. |

These changes passed PHP lint, the Laravel suite with 11 tests and 15 assertions, the frontend production build, and whitespace checks. They do not replace the remaining P0 work: full cross-tenant feature tests, payment reconciliation and refunds, real backup/restore drills, production queue/scheduler deployment, migration discipline, and comprehensive end-to-end workflow tests.


### Deployment-layout repair

During the parallel pass, the repository was verified to contain both a legacy root Laravel tree and the canonical `backend/dono-api` tree. The validated subscription, tenant, quota, and operational changes are in `backend/dono-api`. The root Dockerfile and Nixpacks start command were therefore corrected to install and boot that canonical backend, preventing Railway from deploying a different stale application tree. The release overlay preserves the canonical `backend/dono-api` and `frontend` paths.
