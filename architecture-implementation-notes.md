# Architecture Implementation Notes

## Verified source of truth

The user-supplied diagram is the source of truth. A module is not complete because it appears as a dashboard label. It must have a real frontend page/workflow, a matching backend route/controller/model or service, correct permission middleware, correct school or portal ownership checks, and loading/error/empty/mobile handling.

## Current implementation tranche completed in the sandbox

The base API controller now has `schoolId(Request)` and `requireSchool(Request)` methods backed only by `CurrentContextService`. Eighteen inspected controllers were refactored to use the base resolver instead of duplicated request/user school derivation. The remaining direct `auth()->user()->school_id` controllers were hardened: `FeeCategoryController`, `HostelRoomController`, `ReceptionAppointmentController`, and `StudentGatePassController` now resolve active school context centrally and validate related records against it.

Platform routes were tightened so currencies and the existing features resource are inside the `role:super_admin` group; subscription-plan, school-subscription, coupon, promo-campaign, and system-setting writes remain platform-only. The `FeatureController` itself is still a stub and requires a real implementation before Plans & Features can be marked complete.

## Confirmed missing or partial mandatory modules

Platform Owner: Plans & Features (FeatureController stub), Payments & Invoices dedicated page, Countries/Currency dedicated page, Email & SMS Settings, Backups & Logs, and System Health are not all real dashboard workflows. Organization Owner: Users, Organization Profile, and several school actions are not consistently dedicated pages. Proprietor: Communication and System Settings semantics are not cleanly separated from school settings; academic and finance areas remain broad page groupings.

Principal: Communication is absent from the sidebar. Vice Principal Academic: Continuous Assessment, Question Bank (CBT), and some teacher assignment/examination workflows are partial or broad aliases. Secondary Principal: external exams WAEC/NECO, practicals, and communication are explicitly marked unavailable or partial. Teacher: Messages and explicit class timetable are incomplete; the dashboard contains a “not yet registered” assignment state. Form Teacher: Parent Communication and Messages are absent as dedicated workflows.

Bursar: Payment Reports currently route to academic Report Cards, and discounts/scholarships and reverse payment require dedicated verification. Accountant: Tax Reports and Financial Reports route to academic Report Cards; Payroll is not a dedicated workflow. Librarian: Members route to Students and Reports route to Books. Nurse: Medication, Allergies, Emergency Contacts, and Health Reports are grouped in one broad page. Hostel: Visitors and Reports are broad aliases. Transport: Fuel Records, Maintenance, and Reports are grouped in one page. Reception: Staff Check-in and Calls/Messages are not dedicated workflows.

Parent Portal: the current page has a nonfunctional `Pay for {student}` button and lacks dedicated Timetable, School Notices, Messages/Chat, Leave Application, and Transport Tracking. Student Portal: it lacks dedicated Fees, CBT/Exams, Messages, and Notices workflows; Timetable and Library are broad aliases.

## Important code-level risks still visible

The repository audit still found direct `auth()->user()->school_id` use in legacy controllers and middleware-adjacent code, plus request-attribute fallback patterns in many request classes. These must be converted carefully, not with blind global replacement, because some request rules need the active school during validation. `User::currentSchoolId()` remains a legacy helper and must not be used by controllers.

Several dashboard tabs have no `page` destination and intentionally display unavailable/placeholder messages. These are verified incompleteness, not acceptable final states. Several sidebar entries route finance, library, hostel, transport, and portal features to unrelated pages. A canonical role/module registry is needed so each diagram entry has one authoritative module key, permission, route, and page.

## Next implementation order

1. Complete the canonical module registry and replace misrouted sidebar entries.
2. Implement platform owner missing workflows: Features, Payments/Invoices, Countries/Currency, Email/SMS settings, Backups/Logs, and System Health.
3. Implement school communication/notices/messages and parent/student portal missing workflows.
4. Implement dedicated finance reports, payroll foundation, library membership/reports, hostel visitor/reports, transport fuel/maintenance/reports, receptionist staff check-in and calls/messages.
5. Implement CBT question bank, external exams/practicals, graduation/alumni, and dedicated promotion/report-card flows.
6. Validate every role/module against the acceptance matrix and package without pushing.
