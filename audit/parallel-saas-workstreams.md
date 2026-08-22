# DOONO De Creator ERP — Parallel SaaS Standardization Workstreams

The implementation will proceed in parallel without freezing feature development. Each workstream has a defined boundary and a release contract so improvements do not overwrite or weaken other work.

| Workstream | Scope | Primary release outcome |
|---|---|---|
| **A. Tenant isolation and security** | CurrentContextService usage, school scoping, RBAC, route policies, staff status, invitations, session invalidation, audit visibility, request validation, rate limits | A user can access only the organization, school, role, and records they are authorized to access |
| **B. Subscription and billing** | Plan catalog, feature entitlements, Premium wildcard, quotas, trials, exemptions, Paystack idempotency, webhooks, reconciliation, payment exceptions, refunds and billing history | Every paid capability has a reliable entitlement decision and every payment can be traced from gateway event to school access |
| **C. Platform operations** | Web/queue/scheduler processes, health checks, structured logs, cache/queue configuration, backups, restore drills, storage, migration discipline, deployment runbook | The platform can run, recover, and be diagnosed without manual database intervention |
| **D. Product workflows** | School onboarding, academic setup, staff employment lifecycle, fees, child-specific payment attribution, results, report cards, CBT, timetable, assignments, portals, communication, library, hostel, clinic, transport, reception | Each major school workflow works end to end with correct states, permissions, errors, and recovery paths |
| **E. Frontend and accessibility** | Shared components, role dashboards, mobile layouts, forms, tables, pagination, navigation/deep links, notification state, onboarding guide, offline/readiness behavior | All roles receive a clear, responsive, consistent interface with no dead buttons or navigation traps |
| **F. Quality and release engineering** | PHPUnit/feature tests, authorization matrix tests, billing tests, frontend lint/build, API contract checks, migration checks, staging smoke tests, release archives and documentation | Every change is validated against regression, security, billing, and deployment criteria |

## Execution rule

Workstreams may progress concurrently, but shared files are edited sequentially and validated after each change. No existing working module is removed merely because another workstream is being repaired. The implementation will preserve backward compatibility where possible, add migrations forward-only when necessary, and mark any unresolved production risk explicitly rather than hiding it.

## Immediate implementation order

The first pass will establish shared safety contracts: tenant and authorization checks, subscription entitlement/quota contracts, operational process definitions, and regression-test scaffolding. In parallel, product and frontend fixes will continue in bounded modules. The release gate will combine all six workstreams rather than waiting for one workstream to be “perfect.”
