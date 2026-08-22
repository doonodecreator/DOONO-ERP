# DOONO De Creator ERP Subscription Access Audit

## Verified policy

When subscription enforcement is disabled in `SystemSetting.enforce_subscriptions`, the platform is in global free-access mode. Schools can use the full catalog without payment, while Paystack subscription checkout is intentionally unavailable until the Software Owner enables enforcement.

When enforcement is enabled, core school operations remain available without a paid plan. The free baseline is dashboard access, school setup, students, parents, staff and invitations, attendance, timetable, assignments, and school communication. This allows a newly registered school to create its structure and begin operational onboarding instead of being trapped behind a paywall.

Paid entitlements are plan-controlled. The current paid catalog includes fees, results and official report cards, CBT, library, transport, hostel, clinic, accounting, payroll, inventory, SMS, AI reports, and school operations such as events and facilities. Lifetime exemptions and time-bounded 100% grants continue to unlock the full catalog for the grant duration.

## Existing plan model

Subscription plans already store prices for monthly, quarterly, half-yearly, and yearly billing, capacity limits, trial days, legacy feature JSON, and database-backed feature relationships. Basic, Standard, and Premium seed definitions exist, and the feature-plan pivot is seeded. The repaired access layer now combines the database feature pivot with legacy feature JSON for backward compatibility.

## Payment and trial behavior

Paystack initialization remains available through the proprietor subscription flow when payment is required. Pending payment records are reused, verification is performed before activation, and duplicate settlement protection remains in place. Paid subscriptions purchased during an active trial begin after the trial end rather than consuming paid days during the free trial. Renewal periods extend from a future expiry instead of overlapping the existing paid period.

## Repairs completed

The coarse hardcoded major-route list was replaced with one centralized `SubscriptionAccessService`. The generic subscription middleware now maps actual API route prefixes to feature slugs and returns a structured 402 response containing the requested feature, current plan, status, explanation, and upgrade path. The granular `feature:*` middleware uses the same policy. Student and parent report-card downloads, student library, student CBT, and transport tracking prefixes are explicitly covered so portal routes cannot bypass enforcement.

The school subscription response now returns the enforcement state, free features, current-plan features, available features, locked features, and the complete feature catalog. The frontend subscription workspace displays that matrix so schools understand what they can use before paying. The canonical API client marks subscription-lock responses and the authenticated shell presents a consistent View Plans prompt.

Previously stubbed platform-owner trial-extension and subscription-status actions now persist changes and write audit events. They are protected by the existing `role:super_admin` route group.

## Operational caveat

The sandbox validation environment does not contain a configured production database, so live entitlement behavior must be tested after deployment with a real school, a trial subscription, an expired subscription, an active Basic/Standard/Premium subscription, a lifetime exemption, a time-bounded free grant, and global enforcement toggled on and off. The code and route contracts have passed lint, route verification, tests, frontend build, and whitespace validation.
