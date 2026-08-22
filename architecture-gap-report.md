# DONO ERP Architecture Gap Report — Initial Audit

## Scope and evidence

This report compares the user-supplied architecture diagram with the actual repository inventory and the current role navigation in `frontend/src/components/Sidebar.jsx`, `frontend/src/App.jsx`, and the existing Laravel API tree. It is an initial implementation audit, not a claim that every backend workflow has already been runtime-tested.

## High-level finding

The codebase contains a substantial foundation: 90 API controllers, 86 request classes, approximately 70 Eloquent models, 85 frontend pages, 132 route declarations, 20 role-dashboard mappings, and a two-tier role model. However, the diagram is not yet implemented exactly. Several dashboard entries are labels routed to unrelated pages, some diagram modules have no dedicated backend or frontend implementation, and some operational roles currently receive broader or incomplete capabilities than the diagram specifies.

## Confirmed role-dashboard gaps

| Role | Confirmed gap against diagram |
|---|---|
| Platform Owner | Sidebar currently exposes only Dashboard, Organizations, Schools, Subscriptions, System Settings, and Audit Logs. The diagram also requires Plans & Features, Payments & Invoices, Countries / Currency, Email & SMS Settings, Backups & Logs, and System Health. Some backend primitives exist, but dedicated navigation/page contracts are not all present. |
| Organization Owner | Sidebar currently exposes only Dashboard and My Schools. The diagram requires Create, Edit, Delete, View School, Subscription, Upgrade / Renew, Payment History, Users, and Organization Profile. Dashboard tabs partially cover these, but navigation and page contracts are not consistently dedicated or verifiable. |
| Proprietor | Core areas exist, but the current menu includes setup and subscriptions while the diagram’s Communication and System Settings semantics are not cleanly separated. Academic, finance, reports, and school settings are still routed through broad pages rather than dedicated module contracts. |
| Principal | The menu includes admissions, results, timetable, promotions, attendance, finance, and reports, but Communication is missing from the sidebar. Teacher and student management are currently general pages and need role-specific authorization/behavior verification. |
| Vice Principal Academic | Subjects, teacher assignment, timetable, examinations, results, promotion, and reports exist as pages or aliases. Continuous Assessment and Question Bank (CBT) are not represented by complete dedicated page/backend contracts. |
| Vice Principal Administration | Most named areas exist, but Staff Attendance, Events, Health & Safety, Facilities, and Reports require end-to-end workflow verification. |
| Nursery Head | Nursery classes, teachers, pupils, assessment, attendance, timetable, reports, and communication are mostly aliases to general modules; the diagram’s division-specific filtering is not yet proven end to end. |
| Primary Headmaster | Same issue as Nursery Head: the role labels mostly route to shared general pages, while primary-specific data filtering and result/promotion scope need verification. |
| Secondary Principal | JSS/SSS management, external exams (WAEC/NECO), practicals, continuous assessment, and communication are not all implemented as dedicated working contracts. The dashboard currently displays an external-exam unavailable state. |
| Teacher | The diagram requires My Classes, My Subjects, attendance, assignments, CA scores, exam scores, students, messages, and class timetable. Current dashboard tabs omit explicit messages and class timetable, and the assignment area still contains a “not yet registered” placeholder in the dashboard. |
| Form Teacher | The diagram requires Parent Communication and Messages. Current tabs include parents but not explicit communication/messages, and several entries are routed to broad general pages. |
| Cashier / Bursar | Core payment page exists, but payment reports are currently routed to the Report Cards page, which is architecturally incorrect. Discounts/scholarships and reverse payment require explicit workflow verification. |
| Accountant | Income, expenses, budget, profit/loss, tax reports, and financial reports are currently routed through a small set of broad pages; tax and financial reports are routed to Report Cards, which is incorrect. Payroll is listed in the diagram but does not have a dedicated accountant page contract. |
| Librarian | Books and loans exist. Members are routed to Students and Reports are routed to Books; these are placeholders/aliases rather than dedicated library workflows. Lost books and fines require verification. |
| Nurse | Clinic pages exist, but medication, allergies, emergency contacts, and health reports are represented as one broad Clinic page rather than verified sub-workflows. |
| Hostel Master/Mistress | Hostel, rooms, bed allocation, attendance, visitors, and reports are routed mostly through one broad Hostels page or general Visitors page. Dedicated hostel attendance/report contracts require verification. |
| Transport Manager | Vehicles, drivers, routes, allocation, fuel, maintenance, and reports are largely grouped into a Transport page. Fuel and maintenance need explicit backend/frontend contracts. |
| Receptionist | Visitors, student check-in/out, staff check-in, appointments, calls/messages, and reports are grouped into Visitors/Reception pages; separate staff check-in and communication contracts need verification. |
| Parent Portal | The current portal has a limited overview, assignments, results, attendance, and report-card download path. The diagram also requires fees/payments, timetable, school notices, messages/chat, leave application, and transport tracking. |
| Student Portal | The current portal has overview, timetable alias, assignments, results, library alias, and report-card download. The diagram also requires attendance, fees, CBT/exams, messages, and notices. |

## Confirmed shared-module gaps

The diagram’s shared modules include Academic Sessions, Terms, Classes, Streams, Subjects, Students, Parents, Teachers, Attendance, Examinations, Results, Report Cards, Promotion, Graduation, Timetable, Fees & Payments, Payroll, Inventory, Library, Transport, Hostel, Clinic, Communication, Events, and Settings.

The current repository has explicit foundations for most items except a clearly dedicated Communication subsystem, CBT/question bank, Graduation/alumni workflow, robust Payroll workflow, school notices/notifications, and several dedicated report/analytics workflows. Existing controllers such as `AssignmentController`, `SchoolEventController`, `SchoolFacilityController`, `AssetController`, and `StaffAttendanceController` show progress, but their role exposure and complete page contracts still need verification.

## Confirmed navigation-contract problems

The current sidebar maps multiple diagram items to unrelated pages:

| Diagram item | Current route/page mapping | Problem |
|---|---|---|
| Bursar Payment Reports | `report-cards` | Financial reporting is routed to academic report cards. |
| Accountant Tax Reports | `report-cards` | Tax reporting is routed to academic report cards. |
| Accountant Financial Reports | `report-cards` | Financial reporting is routed to academic report cards. |
| Librarian Members | `students` | Library membership is routed to the general student module. |
| Librarian Reports | `books` | Library reports are routed to the books page. |
| Hostel Visitors | `visitors` | General reception visitors are used instead of hostel visitor records. |
| Transport Reports | `transport` | Reports are routed to the operational transport page without a verified report contract. |
| Form Teacher Behaviour | `discipline-cases` through alias | Alias exists, but form-teacher scope and mutation authority require verification. |
| Communication entries | Often omitted or non-clickable dashboard tabs | No dedicated communication page/backend contract is visible in the inventory. |

## Security and architecture risks to resolve before broad UI work

The current codebase contains `CurrentContextService`, but some controllers still use request attributes or direct user fields as fallbacks. The final implementation must make `CurrentContextService` the only school-resolution path. Every school-scoped query and mutation must verify all referenced records belong to the current school.

The two-tier RBAC model must remain intact: `school_id = NULL` is reserved for platform-wide `super_admin`, while school roles use a concrete school ID. Platform Owner pages and actions must never expose mixed school operational data, and Proprietors must never see platform-owner actions in their audit feed.

The current dashboard/sidebar structure is partly permission-driven but also partly hardcoded. The final architecture should use one verified role/module registry for backend permission names, frontend navigation, and page dispatch to prevent labels from pointing to unrelated pages.

## Implementation approach

The next work should not be another isolated dashboard patch. It should establish a canonical role/module registry, verify each module’s route/controller/page contract, then implement missing vertical slices in dependency order: context/RBAC/audit boundaries; platform and organization-owner controls; school setup and academic core; staff/attendance/discipline; results/report cards/promotion/graduation; finance; library/clinic/hostel/transport/reception; communication/notifications; parent and student portals; and finally role-specific dashboard presentation.
