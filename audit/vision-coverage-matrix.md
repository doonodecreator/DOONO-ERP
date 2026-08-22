# DOONO De Creator ERP Vision Coverage Matrix

## Assessment legend

| Status | Meaning |
|---|---|
| Present | The capability has a concrete backend contract, route, and frontend surface, subject to normal testing. |
| Partial | Some layers exist, but important persistence, permission, UI, or integration work is incomplete. |
| Missing or broken | The intended capability has no usable end-to-end path or currently points to an invalid contract. |

## Platform and tenancy

| Intended capability | Database/backend evidence | API and permission evidence | Frontend evidence | Status |
|---|---|---|---|---|
| Platform Owner controls platform-wide settings | `system_settings`, subscription plans, coupons, campaigns, currencies, features, announcements, local email, revenue and health controllers exist | Platform write routes are grouped under `role:super_admin`; school actions are separated from platform actions | Platform owner dashboard, settings, operations, subscriptions, promotions, email center, and audit pages exist | Present, with continued integration testing required |
| Organization Owner owns one or more schools | Organizations and schools include owner/organization relationships; `CurrentContextService` resolves organization context | Organization and school routes exist with ownership checks | Organization dashboard/workspace, schools, add-school, organization pages exist | Present |
| School data isolation | School-scoped models, controllers, middleware, `CurrentContextService`, tenant partition migrations, and school-scoped permissions exist | Most school routes use `has.school`, permission middleware, and context resolution | School context and switch-school flows exist | Present in architecture; requires ongoing security regression coverage |
| Two-tier RBAC through `user_roles` | User roles have nullable `school_id`; roles and permissions models/migrations exist | Platform and school role middleware are used; invitation routes are proprietor-scoped | Role-specific dashboards and invitation management exist | Present |
| School team and role assignment | Staff, roles, invitations, acceptance, profile setup, employment authority, and delegation tables/routes exist | Proprietor invitation routes are school-scoped; role permissions are seeded and bounded | Role invitations, staff, teachers, and role dashboards exist | Present/partial: employment lifecycle and profile media still need completion and end-to-end testing |

## School identity, branding, and configuration

| Intended capability | Existing evidence | Gap | Status |
|---|---|---|---|
| School logo upload and display | `schools.logo` exists; `School` is fillable for `logo`; resources expose `logo` | No real upload endpoint, no file validation/storage flow, no Settings file picker, and no consistent logo display | Partial |
| Dedicated report-card logo | `schools.report_card_logo` exists in migration | Not fillable, not validated, not exposed by `SchoolResource`, not uploadable, and not rendered | Missing/broken |
| Principal signature and school stamp | `principal_signature`, `school_stamp` columns exist; academic configuration has display flags | No upload contract, no storage/media access, no Settings UI, and no PDF rendering | Missing/broken |
| School colors, theme, layout, custom header/footer, watermark | Branding migration contains all fields | School controller/resource/settings do not expose them; no editor or preview; PDF view is absent | Missing/broken |
| School motto and payment identity | `school_settings` stores motto, bank details, and Paystack fields | Proprietor Settings edits and persists these values | Present, but UI is inconsistent and does not connect them to branded receipts/report cards |
| Platform logo and identity | `system_settings.platform_logo` and resource/request support exist | No verified upload flow or platform branding UI surface was found | Partial |
| School events, facilities, communication identity | Controllers/routes/pages exist | Branding identity is not consistently injected into pages, notices, receipts, or PDFs | Partial |

## Users, profiles, and portals

| Intended capability | Existing evidence | Gap | Status |
|---|---|---|---|
| User account profile | Authenticated context, password change, email verification, invitation profile setup exist | No shared `/me/profile` page, no persistent user avatar field, no general self-profile update route | Partial |
| User profile pictures | `staff.photo` and `students.photo` string columns/resources exist | No multipart upload route, frontend file picker, validation, storage policy, image preview, or avatar display; users have no avatar column | Missing/broken |
| Student profile photo | Student `photo` field exists | Add/edit student flows do not provide upload or preview | Partial |
| Staff/teacher profile photo | Staff `photo` field exists | Staff/teacher flows are text-only and do not upload or render photos | Partial |
| Parent portal with multiple children | Parent portal dashboard and parent-student relationships/routes exist | Profile photo and richer self-service profile are absent; child selection must continue to be tested | Present/partial |
| Student portal | Student dashboard, assignments, fees, timetable, CBT, library, transport, leave, report-card download exist | Profile media and profile editing are absent | Present/partial |

## Academic operations

| Intended capability | Existing evidence | Status |
|---|---|---|
| Academic sessions, terms, divisions, classes, streams, subjects | Models, migrations, routes, pages, school-setup workflow | Present |
| Students, admissions, enrollments, parent linking | Controllers, routes, pages, portal-account links, school-scoped requests | Present/partial |
| Staff and teacher employment | Staff controllers/pages, invitations, assignment permissions, role dashboards | Present/partial; profile media and deeper employment lifecycle need completion |
| Attendance | Attendance APIs and page, class-list/bulk endpoints | Present |
| Timetable | Configurable timetable migration, controller, routes, page, teacher/student views | Present/partial; needs real device workflow validation |
| Assignments | Assignment management, submission, review, student portal routes/pages | Present |
| CBT | Question bank, bulk authoring, assessment lifecycle, attempt/scoring/publish routes, student CBT page | Present/partial; integrate branded identity and final-report visibility carefully |
| Results computation | Authoritative computation, grading rules, ranking, promotion, submission workflow | Present |
| Report-card computation | `ReportCardService`, report card controller and download routes | Partial: PDF view is missing and branding/configuration is not applied |
| Report-card design | Academic configuration table and branding fields exist | Missing active editor, route, preview, PDF template, and validation | Missing/broken |
| Promotion and graduation | Promotion service/routes/pages and graduation records/routes/pages | Present/partial |

## Finance, subscriptions, and operations

| Intended capability | Existing evidence | Status |
|---|---|---|
| School fee categories and configured fees | Fee models/controllers/routes/pages, student fee assignments, adjustments | Present/partial; continue button-level validation |
| Fee payment and receipts | Payment controllers, Paystack initialization/webhook/idempotency, receipt views/routes | Present/partial; real Paystack/Railway verification still required |
| School subscriptions and free-access controls | Subscription plans, school subscriptions, exemption/timeframe/discount actions, middleware | Present/partial; requires deployment environment and transaction-state testing |
| Expenses, payroll, financial reports | Controllers/routes/pages and permissions exist | Present/partial |
| Library, hostel, clinic, transport, reception, facilities, events, safety | Controllers/routes/pages and permissions exist | Present/partial; broad integration testing required |
| Audit logs | Platform/school action separation and filtering/pagination | Present/partial; needs regression tests to ensure cross-context exclusion |
| Notifications and read-state | Communications, per-user read receipts, notification panel integration | Present/partial; migration/deployment validation required |

## Critical cross-layer breaks found

| Break | Impact | Required repair |
|---|---|---|
| `ReportCardService` points to `pdf.report-card`, but no corresponding Blade view exists | Report-card downloads cannot reliably render the promised document | Create a production PDF template and pass branding/configuration into it |
| Branding columns exist only in migration | Database suggests a larger product than the active API/UI | Add fillable fields, validation, resource serialization, settings editor, and audit logging |
| Existing photo fields are strings | A filename/path can be accepted without a safe upload or ownership flow | Add validated multipart upload handling and storage abstraction |
| User has no avatar field or profile endpoint | Navbar and account screens cannot show/edit profile photos | Add user profile media field, `/me/profile` contract, and shared profile UI |
| `AcademicConfiguration` and `academic_settings` are separate configuration surfaces | Report-card behavior can drift and one controller is orphaned from routes | Select one authoritative configuration contract and adapt service/UI to it |
| Settings UI contains platform and school surfaces but no branding designer | Proprietor cannot complete school identity or report-card design | Add a dedicated School Branding & Report Card Design workspace or a structured Settings section |
