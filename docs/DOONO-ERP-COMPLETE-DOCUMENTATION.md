# DOONO De Creator ERP

## Complete Product, Technical, Operations, and User Documentation

**Document owner:** DOONO De Creator ERP  
**Documentation author:** Manus AI  
**Document date:** 25 August 2026  
**Product scope:** Nursery, primary, and secondary schools  
**Current product status:** Conditional pilot readiness; production deployment and live-database acceptance gates remain mandatory

---

## 1. Purpose of this document

This manual is the authoritative orientation document for the current DOONO De Creator ERP repository. It explains what the product is, how the major parts communicate, what each role is responsible for, how a school should use the system from setup through daily operations, how administrators should deploy and maintain it, and which features are implemented versus dependent on external configuration.

The documentation is based on the actual source structure inspected in `/home/ubuntu/DOONO-ERP`. It does not treat a visible menu item as proof that a production provider, database workflow, external callback, or school policy has been verified. Whenever a capability depends on infrastructure or institutional configuration, that dependency is stated explicitly.

DOONO is currently a **K–12 school operating system**. In this context, “operating system” means a connected software platform for running the people, learning, records, finance, communication, welfare, and operations of a school. It does not mean a device operating system such as Android or Windows. Higher-education support is not part of the current implementation.

---

## 2. Executive overview

DOONO combines a Laravel API, a React/Vite web application, a relational database, school-scoped authentication, role-based permissions, document generation, portals, workflow states, audit history, notifications, and optional provider integrations. The platform is designed around the principle that a school should not have separate disconnected systems for admissions, attendance, fees, academic results, parents, communication, and operations.

The system supports a platform owner who manages the SaaS environment, organization owners who manage one or more schools, school leaders who operate the institution, staff who perform specialized work, and parent and student portal users who see only their linked records. The same backend authorization rules remain in force whether a person uses the normal interface, refreshes a page, or attempts to call an endpoint directly.

The current repository contains a substantial K–12 foundation. The latest source-level readiness audit recorded **144 backend controllers, 129 models, 47 services, 90 form-request classes, 44 API resources, 211 migrations, 13 seeders, 131 frontend pages, 51 shared frontend components, 8 test files, and one canonical Axios client**. Counts can change as the product evolves; the source tree and validation scripts remain the final authority.

The present release has passed source-level checks including PHP syntax checks on touched files, PHPUnit, Laravel route compilation, the DOONO architecture guard, guide coverage validation, frontend lint with zero errors, frontend production build, dependency audits, and `git diff --check`. A real school deployment still requires live database testing, migration testing on the selected database engine, provider verification, backup restoration, and a controlled pilot.

---

## 3. Product principles

DOONO is built around the following non-negotiable principles.

| Principle | Meaning in the system |
|---|---|
| One authenticated context | Every request is interpreted in the context of the authenticated user’s organization, school, roles, permissions, and operational period. |
| School isolation | A user must not read, create, update, delete, export, or receive records belonging to another school unless the action is explicitly platform-wide and authorized. |
| Server authority | Hiding a menu item is not security. The backend must enforce role, permission, ownership, lifecycle, and subscription checks. |
| Historical integrity | Admissions, enrollments, results, attendance, invoices, payments, communications, and employment history are not casually overwritten or deleted. |
| Workflow before publication | Draft, submitted, approved, published, paid, reversed, pending, and closed states have different meanings. A user must not skip a required approval boundary. |
| Honest availability | A provider-dependent feature must show a truthful unavailable or configuration-required state rather than pretending that a service is live. |
| Minimum necessary exposure | Parent, student, medical, payment, audit, and private media data are revealed only to users with a verified need and scope. |
| Explainability | The in-software Guide should explain what a feature means, why it matters, what to prepare, how to use it, what success looks like, and what to do next. |

---

## 4. System architecture

### 4.1 High-level architecture

```mermaid
flowchart LR
    Browser[React/Vite web application] --> Axios[frontend/src/services/api.js]
    Axios --> API[/api/v1 Laravel API]
    API --> Sanctum[Sanctum authentication]
    API --> Context[CurrentContextService]
    Context --> RBAC[user_roles + permissions]
    API --> DB[(MySQL or PostgreSQL target database)]
    API --> Storage[Public/private media storage]
    API --> Queue[Queue worker]
    API --> Mail[SMTP or configured mail transport]
    API --> Payments[Paystack and payment callbacks]
    API --> Providers[Optional AI, SMS, push, live-room providers]
    API --> Audit[School/platform activity log]
    Scheduler[Laravel scheduler] --> API
```

### 4.2 Backend

The backend is a Laravel API under `backend/dono-api`. It contains route definitions, controllers, form requests, resources, models, services, middleware, migrations, seeders, console commands, views for official documents, and automated tests. The API is versioned under `/api/v1`.

The most important backend boundaries are:

| Boundary | Source of truth | Responsibility |
|---|---|---|
| Authentication | `app/Http/Controllers/Api/AuthController.php`, Sanctum middleware | Login, registration, token creation, password state, verification state, and logout. |
| Current context | `app/Services/CurrentContextService.php` | Resolves the organization, current school, school roles, permissions, active session, active term, and operational readiness. |
| Role authorization | `app/Http/Middleware/RoleMiddleware.php` | Confirms the authenticated user holds the required platform-wide or school-scoped role. |
| Permission authorization | `app/Http/Middleware/PermissionMiddleware.php` | Confirms the user has the required permission in the current school or platform context. |
| Data validation | `app/Http/Requests/` | Validates input and, where applicable, constrains foreign records to the current school. |
| Response contract | `app/Http/Resources/` | Shapes API responses and hides or includes sensitive fields according to permissions. |
| Business rules | `app/Services/` | Handles multi-step operations such as admission, payments, promotion, notification delivery, media storage, and computation. |
| Audit | `ActivityLogService` and `ActivityLog` | Records important platform and school actions with a deliberate `is_platform_action` separation. |

### 4.3 Frontend

The frontend is under `frontend`. It uses React 19 and Vite. `frontend/src/App.jsx` is the central authenticated page shell and page-string router. `frontend/src/services/api.js` is the one canonical Axios client. All pages should import this client rather than creating competing clients or calling `fetch` directly.

Shared components are grouped under `frontend/src/components`, including layout, forms, tables, feedback, dashboards, modals, and charts. The intended standard is to reuse `PageHeader`, `DataTable`, `LoadingSpinner`, `EmptyState`, `SectionCard`, `Button`, `Modal`, and shared form fields wherever the page requires them.

The frontend role helper is `getPrimaryRoleSlug`. Pages must obtain role information through `AuthContext` and this helper. The legacy pattern `user?.role || user?.roles?.[0]?.slug` is not valid for this application because roles are supplied separately from the `user` object in the context contract.

---

## 5. Tenancy and school isolation

### 5.1 Tenant hierarchy

DOONO uses the following conceptual hierarchy:

> **Platform Owner → Organization → School → School-scoped roles → Staff, students, parents, and operational records**

An organization may own one or more schools. A school is the operational tenant where students, staff, academic structures, fees, results, communications, and welfare records are maintained.

### 5.2 Current context resolution

`CurrentContextService` is the single source of truth for the authenticated user’s current organization, school, roles, permissions, and academic context. Controllers must not independently infer the current school from arbitrary request parameters, user profile fields, or nonexistent user helper methods.

The forbidden pattern is:

```php
$user->currentSchoolId();
```

The correct pattern is to resolve the school through the service already used by the application:

```php
$school = $this->context->currentSchool($request->user());
$schoolId = $school?->id;
```

The frontend receives current context through the authenticated context contract and displays the active organization, school, role, academic session, academic term, and readiness state. A frontend page may use that information for display, but the backend must re-check it.

### 5.3 Tenant-safety requirements

Every new tenant-owned record should contain a school reference or be reachable through a school-owned parent whose ownership is verified. Controllers must validate route-bound records against the active school before returning or mutating them. Lists must apply school scope before pagination or serialization. Exports, signed media URLs, asynchronous jobs, notifications, and webhooks must preserve the same boundary.

Parents and students are not general school users. A parent sees only linked children in the active school. A student sees only the student record linked to the authenticated account. Staff scope depends on role and assignment; a teacher may be limited to classes and subjects assigned to that teacher.

---

## 6. Authentication and account lifecycle

### 6.1 Account types

The system supports platform users, organization owners, school staff, parent portal users, and student portal users. A person may have more than one school-scoped role where the database and assignment rules permit it.

### 6.2 Authentication flow

The normal flow is:

1. A user registers or receives an invitation.
2. The backend validates the account, organization or school context, and role or portal relationship.
3. If production verification is enabled, the user verifies the email address.
4. The user signs in through the normal login page.
5. Sanctum issues an authenticated API token or session contract used by the canonical Axios client.
6. The frontend requests the authenticated context and builds the correct dashboard and navigation.
7. Users with a temporary password are required to change it before continuing.

In local testing, email verification may be deliberately disabled through the configured local policy. The local bypass is not a production security recommendation. Production should require verified email ownership.

### 6.3 Password reset and verification

The public authentication surface includes registration, email verification, resend verification, password reset request, and password reset completion. A real deployment needs a working mail transport and correct frontend URL configuration. A successful API response is not proof that a real mailbox received the message.

### 6.4 Invitations

School staff invitations are school-scoped and authority-ranked. The Proprietor is the normal authority for inviting, revoking, delegating setup permission, suspending, or terminating school staff. A Principal cannot simply invite another Principal or grant an equal or higher authority unless the explicit role rules allow it. Form Teacher invitations must identify the actual class and optional stream. Acceptance must use the same email address that received the invitation.

### 6.5 Logout

Logout invalidates the authenticated token or session. The frontend should provide a visible logout control in the account menu or common header. After logout, protected pages must not remain usable through stale client state.

---

## 7. Role and permission model

### 7.1 Two-tier role storage

DOONO deliberately uses one `user_roles` table rather than a single role column.

| `school_id` value | Meaning |
|---|---|
| `NULL` | Platform-wide role. In the current architecture this is reserved for `super_admin` / Software Owner behavior. |
| A school ID | Role scoped to that school. The same person may hold different roles in different schools. |

The platform role must not be granted through an ordinary school invitation. School users must not be able to turn themselves into platform administrators by changing a frontend value.

### 7.2 Role catalogue

| Role | Plain-language definition | Main responsibility | Important boundary |
|---|---|---|---|
| Software Owner / Super Admin | The person responsible for the DOONO SaaS platform itself. | Manage platform settings, organizations, subscription plans, platform announcements, coupons, campaigns, and platform-level audit and operations. | Must not be confused with a school Proprietor and must not expose platform actions in a school Proprietor’s audit log. |
| Organization Owner | The owner of an organization that may contain one or more schools. | Establish organization identity, manage owned schools, and coordinate organization-level operations. | Does not automatically become the school’s academic or financial decision-maker unless separately assigned. |
| Proprietor / Proprietress | The owner or accountable operator of one school. | Control school identity, senior staff, school settings, delegations, subscriptions, audit visibility, and major governance actions. | Sees the school’s actions, not the Software Owner’s private platform actions. |
| Principal | The head of the school’s daily academic and operational administration. | Lead school operations, academic oversight, communication, approvals, and delegated setup. | Cannot grant platform authority or exceed delegated school permissions. |
| Vice Principal Academic | Senior academic administrator. | Coordinate curriculum, timetable, teacher assignments, results, examinations, and academic review. | Cannot change platform settings or bypass result approval boundaries. |
| Vice Principal Administration | Senior administrative coordinator. | Support staff, attendance, communication, welfare, facilities, and administrative workflows. | Does not automatically control academic approval or platform-wide settings. |
| Nursery Head | Leader for nursery-stage operations. | Manage nursery-level academic and learner workflows within the assigned school. | Scope remains school and permission controlled. |
| Primary Headmaster / Headmistress | Leader for primary-stage operations. | Manage primary-level academic and learner workflows. | Cannot access unrelated schools or platform controls. |
| Secondary Principal / Head | Leader for secondary-stage operations. | Manage secondary-level academic and learner workflows. | Must respect school role, subject, result, and publication boundaries. |
| Teacher | A staff member responsible for teaching assigned subjects and classes. | View assigned learners, timetable, assignments, attendance, assessment, and result entry as allowed. | Must not create school structures or enter results for unassigned classes or subjects. |
| Form Teacher | A teacher responsible for a particular form class or stream. | Manage the assigned class’s pastoral records, attendance, communication, and relevant class-level work. | The class or stream assignment must be explicit; it is not a random teacher assignment. |
| Accountant | Finance professional responsible for accounting records and reports. | Review financial records, expenses, reconciliation, and reports according to permission. | Must not change learner identity or approve actions outside finance authority. |
| Bursar / Cashier | Person who receives and records school payments. | Receive invoice-specific payments, issue receipts, and support reconciliation. | Must verify student, invoice, amount, method, and reference; pending is not the same as paid. |
| Registrar | Custodian of official learner and academic records. | Maintain records, admissions, enrollment, documents, transcripts, and approved academic history. | Must preserve history and must not expose unpublished results to families. |
| Librarian | Manager of the library catalogue, copies, loans, and reservations. | Maintain books, issue loans, receive returns, manage reservations, and track history. | Student lending requires an active learner and active enrollment in the school. |
| Nurse / Clinic Officer | Custodian of school clinic and confidential health workflows. | Maintain medical profiles, visits, referrals, emergency details, and follow-up. | Medical information requires restricted permission and minimum-necessary exposure. |
| Hostel Master / Mistress | Manager of boarding facilities. | Maintain hostel rooms, allocations, occupancy, and student residential operations. | Must not allocate students across school boundaries or ignore lifecycle status. |
| Transport Manager | Manager of vehicles, routes, stops, inspections, capacity, and allocations. | Maintain safe transport operations and family-facing allocation information. | Vehicle safety, inspection, status, enrollment, and capacity checks are mandatory. |
| Receptionist | Front-desk operator. | Manage visitors, appointments, calls, gate passes, and reception activity. | Must not access unrelated academic, medical, or finance details. |
| Guidance Counselor | Student support and welfare professional. | Record guidance activities, follow-up, and referrals within assigned permissions. | Sensitive student information must remain confidential and school-scoped. |
| Store Keeper | Manager of school assets and stock-related records. | Track assets, lifecycle events, facilities, and operational inventory. | Historical asset events should not be silently deleted. |
| ICT Administrator | Technical administrator for the school’s operational setup. | Support users, devices, integration readiness, and technical configuration granted by school policy. | Cannot grant platform ownership or bypass school authorization. |
| Security Officer | Responsible for school safety, visitors, incidents, and controlled access. | Handle visitors, safety incidents, gate passes, and escalation records. | Safety information is sensitive and must be restricted to authorized users. |
| Parent / Guardian | Family portal user linked to one or more students. | View linked children’s notices, fees, attendance, assignments, transport, and published results. | Cannot see another family’s children, draft results, staff records, or school configuration. |
| Student | Learner portal user linked to one active student record. | View own timetable, assignments, CBT, library, fees, attendance, notices, and published results. | Cannot issue ID cards, edit school structures, approve results, or view another learner. |

Role descriptions explain responsibilities; backend middleware and permissions remain the final authority.

---

## 8. Frontend navigation and guide system

### 8.1 Navigation model

`Sidebar.jsx` provides role-aware navigation. `schoolOsCapabilities.js` provides canonical page metadata, aliases, audiences, and purposes. `App.jsx` maps page keys to React page components. These three areas must remain aligned.

A menu item being visible is not an authorization grant. A user who manually changes a page key or calls an endpoint must still be rejected by backend middleware and policy logic.

### 8.2 Canonical HTTP client

All frontend API requests use:

```text
frontend/src/services/api.js
```

The client owns the base URL, authentication token behavior, error normalization, and API path conventions. API paths must begin with `/` and must not add a second `/v1` when the base URL already contains it.

### 8.3 Intelligent Guide contract

The Guide has three layers:

| Layer | What it explains |
|---|---|
| Role guide | What a role means, why it exists, who it works with, what it can do, what it must not do, its normal daily cycle, and first checks. |
| Module guide | The meaning, preparation, steps, fields, controls, success signals, next step, mistakes, and FAQs for a workspace. |
| Control guide | The exact clicked button, link, select, or file control in the current page context. |

The control matcher gives priority to page-specific control explanations and then contextualizes generic actions such as Save, Edit, Delete, Publish, or Refresh with the current module’s purpose and prerequisites. File inputs and select controls can also open contextual help.

The Guide should behave like a patient teacher. For example, the explanation for “Student Profile Photo” should define it as the learner’s official photograph, state accepted file types and size, explain why it is used, show what happens after admission, and tell the user what to do if the ID card still shows initials. It should not show the same generic “use the page controls” text used by an unrelated feature.

---

## 9. Complete module catalogue

The following catalogue groups the implemented backend controllers and frontend workspaces by business area. Some backend controllers support sub-actions behind one frontend page, while some pages use more than one controller.

### 9.1 Platform and organization operations

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Platform owner dashboard | `PlatformOwnerController`, `PlatformOperationsController`, `AdminRevenueController` | Platform-wide operational overview. |
| Organizations | `OrganizationController`, `OrganizationOwnerController` | Create and manage organization ownership and schools. |
| Schools | `SchoolController`, `SchoolSetupController` | Establish school identity and readiness. |
| School settings | `SchoolSettingController`, `SystemSettingController` | Configure school and system behavior. |
| Branding | `SchoolBrandingController` | Upload logo, report-card logo, signature, stamp, colors, and report-card design. |
| Feature flags | `FeatureFlagController`, `FeatureController` | Stage optional capabilities without bypassing authorization. |
| Subscription plans | `SubscriptionPlanController` | Platform owner manages SaaS plans. |
| School subscriptions | `SchoolSubscriptionController` | View and manage school subscription status and entitlements. |
| Coupons and campaigns | `CouponController`, `PromoCampaignController` | Platform-level promotional controls. |
| Platform announcements | `PlatformAnnouncementController` | Communicate platform-wide notices. |
| Audit logs | `ActivityLogController` | Review authorized platform or school history with action separation. |
| Backups and readiness | `BackupController`, `BenchmarkController` | Operational foundation and diagnostics; actual recovery and scale evidence require deployment. |

### 9.2 Academic foundation

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Academic sessions | `AcademicSessionController` | Create and activate academic years or sessions. |
| Terms | `TermController` | Create term names, dates, and active term state. |
| Academic settings | `AcademicSettingController`, `AcademicConfiguration` | Store school academic configuration. |
| Divisions | `DivisionController` | Represent school stages or divisions. |
| Classes | `ClassController` | Create class groups under divisions. |
| Streams | `StreamController` | Create class subdivisions. |
| Subjects | `SubjectController` | Create subjects and associate academic work. |
| Departments | `DepartmentController` | Maintain department records used by school academic structures. |
| Grading | `GradingSystemController` | Configure grade rules and grading behavior. |
| Staff-subject assignment | `StaffController` and assignment relations | Connect staff to subjects and operational work. |

### 9.3 Learner lifecycle

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Admissions | `AdmissionController`, `AdmissionService` | Create the learner and first enrollment transactionally. |
| Students | `StudentController` | Search, view, edit, and manage student records. |
| Student photo | `StudentController`, `AdmissionService`, `MediaStorageService` | Store a school-owned profile image for the learner. |
| Student enrollments | `StudentEnrollmentController` | Maintain session, term, class, division, stream, and lifecycle placement. |
| Promotion and graduation | `StudentPromotionController`, `GraduationRecordController` | Promote, repeat, transfer, withdraw, graduate, and preserve history. |
| Parents and guardians | `ParentController`, `ParentStudentController` | Maintain parent records and exact child links. |
| Portal accounts | `PortalAccountController` | Link parent and student accounts to canonical records. |
| Student 360 | `StudentController::student360` | Authorized combined learner view. |
| Official documents | `StudentOfficialDocumentController` | ID cards, transcripts, and graduation certificates. |
| Exports | `StudentExportController` | Authorized student CSV export. |

### 9.4 Staff and employment

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Staff directory | `StaffController` | Create, view, update, and manage staff records. |
| Staff invitations | `RoleInvitationController`, `RoleController` | Invite school-scoped staff roles with authority checks. |
| Employment | `StaffContractController` | Manage contracts and employment records. |
| Staff attendance | `StaffAttendanceController` | Record and review staff attendance. |
| Payroll | `PayrollEntryController`, `PayslipController` | Payroll entries and payslip workflows. |
| Staff exports | `StaffExportController` | Authorized staff export. |
| Setup delegation | `SchoolSetupDelegationController` | Proprietor-controlled delegation of setup permissions. |

### 9.5 Results, examinations, and learning

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Assessment structures | `AssessmentStructureController`, `AssessmentActivityController` | Define component marks and assessment activities. |
| Result entry | `ResultEntryController`, `ExamScoreController`, `ResultController` | Enter and save CA and examination components. |
| Result submission | `ResultSubmissionController` | Submit score sheets for review and controlled reopening. |
| Examinations | `ExaminationController` | Manage examination context. |
| Results management | `ResultController` | Review, compute, approve, and publish results. |
| Report cards | `ReportCardController` | Create, inspect, publish, and download report cards. |
| Verification | `ReportCardVerificationController` | Verify published report-card references. |
| Grading | `GradingSystemController` | Apply school grade systems. |
| Assignments | `AssignmentController`, `AssignmentAttachmentController` | Publish work and receive student submissions. |
| Timetable | `TimetableController` | Create term-wide lessons, breaks, events, approval, and publication. |
| CBT question bank | `CbtQuestionController` | Create, moderate, approve, and manage questions. |
| CBT assessments | `CbtAssessmentController` | Assemble and publish timed tests. |
| CBT attempts | `CbtAttempt`, related models | Save answers, enforce timing, and calculate attempts. |

### 9.6 Attendance, welfare, and safety

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Student attendance | `AttendanceController` | Mark daily attendance for active enrollments. |
| Attendance corrections | `AttendanceCorrection` and controller paths | Preserve reasons and before/after history. |
| Leave | `LeaveRequestController`, `StudentLeaveApplicationController` | Submit and review staff or student leave. |
| Clinic visits | `ClinicVisitController`, `MedicalRecordController` | Manage confidential health profiles and visits. |
| Safety incidents | `SafetyIncidentController` | Record and follow up safety events. |
| Discipline | `DisciplineCaseController` | Manage authorized discipline records. |
| Gate passes | `StudentGatePassController` | Control approved learner exits. |
| Visitors | `VisitorController` | Register and manage visitors. |
| Reception | `ReceptionActivityController`, `ReceptionAppointmentController` | Operate front-desk activities and appointments. |

### 9.7 Finance

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Fee categories | `FeeCategoryController` | Define school fee types. |
| Fee structures | `FeeController` | Define class/session/term billing rules. |
| Invoice generation | `FeeController`, `StudentFeeController` | Convert active fee structures into student invoices. |
| Payments | `FeePaymentController`, `PaymentController`, `PaymentTransactionController` | Record manual and online settlement. |
| Receipts | `ReceiptController`, `PaymentReceiptController` | Produce and review payment receipts. |
| Adjustments | `FeeAdjustmentController` | Apply approved discounts or administrative adjustments. |
| Financial reports | `FinancialReportController` | Review balances, collections, reversals, and reconciliation. |
| Expenses | `ExpenseController` | Record school expenses using the shared UI pattern. |
| Currency and country | `CurrencyController`, `CountryController` | Support configured currency and country choices. |
| Subscription | `SchoolSubscriptionController`, `SubscriptionPlanController` | Control SaaS access and school subscription status. |

### 9.8 Operations and services

| Area | Backend surface | Frontend purpose |
|---|---|---|
| Library | `LibraryController`, `BookController`, `BookLoanController`, `BookReservationController` | Catalogue, copies, loans, returns, and reservations. |
| Hostel | `HostelController`, `HostelRoomController`, `HostelAllocationController` | Boarding facilities and student allocations. |
| Transport | `VehicleController`, `VehicleInspectionController`, `TransportRouteController`, `TransportStopController`, `TransportAllocationController`, `TransportLogController` | Vehicles, inspections, routes, stops, capacity, allocations, and logs. |
| Assets | `AssetController`, `SchoolFacilityController` | Asset inventory, lifecycle, and facilities. |
| Communication | `CommunicationController` | School notices and audience-specific delivery. |
| Notifications | `NotificationController`, `NotificationPreferenceController` | In-app alerts, read state, and personal channel preferences. |
| Work Inbox | `WorkInboxController` | Aggregated pending work linking to real modules. |
| Global Search | `GlobalSearchController` | Safe search of permitted school or organization records. |
| Support Centre | `SupportTicketController`, `SupportTicketAttachmentController` | Tracked help requests and attachments. |

### 9.9 Optional and provider-dependent features

| Area | Backend surface | Current meaning |
|---|---|---|
| AI Tutor | `AiTutorController`, `AiConversation`, `AiMessage` | Server-side learning assistant with safe configuration state. |
| Student Community | `CommunityController`, community models | Moderated school-scoped posts, comments, reports, and private media foundations. |
| Project Exchange | `ExchangeController`, exchange models | Curated opt-in project collaboration between schools. |
| Live Rooms | `LiveRoomController`, provider operations and recording models | Safeguarded scheduled live learning foundations with provider readiness gates. |
| OAuth and public APIs | `OAuthClientController`, `PublicIntegrationController`, `SchoolApiKeyController` | Integration foundations requiring security review and deployed credentials. |
| Marketplace | `MarketplaceController` | Foundation surface; do not market full marketplace execution without verified workflows. |
| Benchmarking | `BenchmarkController` | Foundation surface; no extreme-scale proof is implied. |
| Twilio | `TwilioWebhookController` | Provider callback surface requiring real Twilio configuration. |
| Push notifications | `PushTokenController` | Device token foundation requiring Firebase or equivalent delivery configuration. |
| Local email | `LocalEmailController` | Development/testing inbox behavior, not a production mail service. |

---

## 10. Core school workflows

### 10.1 First school setup

The recommended setup order is:

1. Create or confirm the organization.
2. Create the school and confirm its identity, code, country, currency, contact, and branding policy.
3. Create the academic session and mark the intended session active.
4. Create the terms under that session and mark the intended term active.
5. Create divisions.
6. Create classes under divisions.
7. Create streams where the school uses them.
8. Create subjects.
9. Create and invite senior staff.
10. Delegate only the setup permissions that a Principal or Vice Principal Academic needs.
11. Confirm the Work Inbox and setup checklist show the expected readiness state.

A checklist item being marked understood does not create the underlying record. The user must verify the actual session, term, division, class, stream, subject, and staff records in their modules.

### 10.2 Admission and automatic admission number

Admission creates a student record and the first active enrollment in one school-scoped operation. The user enters identity, placement, and optional demographic information. DOONO allocates the official admission number on the server; users must not type or invent it.

The active Admissions page supports a student profile photo. The photo is validated as a JPG, PNG, or WebP image up to 5 MB, stored through `MediaStorageService` under the active school’s student directory, and persisted as the student’s `photo` path. The API returns a `photo_url` for authorized frontend display.

After a successful admission, staff should:

1. Record the generated admission number.
2. Open Students and confirm the name, class, stream, status, and photograph.
3. Generate a test ID card.
4. Link the correct parent or guardian.
5. Create a student or parent portal account when required.

If the card shows initials, the record has no usable saved photo. Edit the student, upload the correct photo, save, and generate the card again.

### 10.3 Student ID card

The official ID card is generated by `StudentOfficialDocumentController`. It is restricted to authorized school staff with `issue_student_id_cards`. It is available only for an active student in the current school.

The PDF contains a front and back at an ID-1/CR80-style card size. The front includes school identity, learner name, admission number, status, class, stream, division, and photograph. The back includes school contact, emergency contact, date of birth, issue date, authorization assets, and validity guidance.

The backend converts the stored profile photo into an inline data URI for PDF rendering. If the photo is missing or the file cannot be found, the card uses initials instead of failing. Students cannot issue or download their own ID cards.

### 10.4 Parent and student portals

The school creates the canonical student or parent record first. Portal access is then created or linked from that record. A parent with multiple children requires one correct parent-child relationship for each child. The system must not infer sibling relationships from a shared email alone.

The parent portal shows linked children, notices, attendance, assignments, fees, payments, transport, library information, and published results according to the current implementation and permissions. The student portal shows the linked learner’s timetable, assignments, CBT, library, fees, attendance summary, notices, and published results.

Draft or unapproved results are hidden from parent and student portals. A student cannot select another child or another school. If a portal login succeeds but the page says the student is not linked, the school must correct the canonical link rather than creating another account.

### 10.5 Promotion, repetition, transfer, and graduation

The ordinary student profile is not the place for lifecycle decisions. The dedicated lifecycle workflow preserves the official history.

| Decision | Result |
|---|---|
| Promoted | Creates the next-session placement across the target session’s terms. |
| Repeated | Creates the target repeat placement while preserving the previous session history. |
| Transferred | Closes the active school enrollment and marks the learner transferred without inventing a new school placement. |
| Withdrawn | Ends the active learning placement according to the lifecycle workflow. |
| Graduated | Closes active enrollments, marks the learner graduated, creates graduation history, and ends active learning access. |

Completed lifecycle history should not be deleted. Corrections belong in controlled edits with audit history.

### 10.6 Attendance

Attendance is based on active student placements for the selected school, session, term, class, and optional stream. Teachers should select the exact class or stream assigned to them. The backend checks that submitted enrollment IDs belong to that selection.

The normal sequence is to choose the context, load the roster, mark present, absent, late, or excused, save, review the summary, and use the correction workflow if a saved value must change. Corrections require a reason and retain before/after history. Parent notifications for absence depend on notification preferences and configured delivery.

### 10.7 Timetable

Timetables are term-wide schedules rather than isolated daily reminders. Schools can configure lessons, breaks, and special events. The intended state machine is:

> **Draft → Submitted → Approved → Published**

A timetable entry should identify class, stream where relevant, subject, teacher, start time, end time, date or day, entry type, and optional room or event details. The system checks teacher, class, and room collisions where configured. Editing an approved or published entry returns it to draft so it receives a new review.

Students see only published entries for their class. Teachers see only assigned published lessons. Whole-school breaks and events follow their configured audience.

### 10.8 Assignments

A teacher selects an assigned class and subject, writes instructions, sets a due date, optionally attaches a file, and saves a draft or publishes the assignment. Students receive only published work for their current class and stream. They can submit text and an attachment where enabled. Teachers review submissions, late status, feedback, and grades.

### 10.9 Results and report cards

The results workflow separates entry from review and publication:

1. Configure assessment components and maximum marks.
2. Enter continuous assessment and examination marks.
3. Save partial work when necessary.
4. Submit the completed score sheet.
5. Review and approve the submission.
6. Reopen with a reason if a genuine correction is required.
7. Complete required subject publication.
8. Run or confirm computation.
9. Publish the final student result summary and report card.
10. Allow parents and students to view the published result.

Teachers are limited to assigned classes and subjects. Submitted, approved, and published sheets are read-only until an authorized reopen. The computation engine supports totals, averages, grades, positions, highest positions, remarks, and promotion status according to the configured K–12 result model. A live school must confirm its grading and report-card policy before treating the output as official.

### 10.10 CBT

A CBT question bank contains questions, options, the correct answer, subject, section or topic, difficulty, and marks. Questions should be moderated and approved before use. An assessment selects approved questions and sets class, subject, session, term, duration, pass mark, attempt limit, availability window, shuffle behavior, and result weight.

A student sees only eligible published tests. Starting a test creates an attempt and begins the timer. Answers are saved where the deployed workflow permits. When the deadline reaches zero, the stable submission callback submits the current attempt rather than relying on stale frontend state. CBT output remains subject to the school’s official result approval and publication workflow.

### 10.11 Fees, invoices, payments, and receipts

The finance sequence is:

1. Create fee categories.
2. Create a fee structure for a school, session, term, division, class, and amount.
3. Generate invoices for eligible active enrollments.
4. Review invoice identity and balance.
5. Receive a manual payment or start online checkout.
6. Reconcile the reference and callback status.
7. Issue or inspect the receipt.
8. Apply discounts or adjustments through their dedicated workflow.
9. Use reports to reconcile balances and reversals.

A fee structure is a billing rule, not an invoice. A generated invoice is a student-level obligation. A payment must reference the exact invoice and cannot be zero, over-balance, cross-school, or reused for a different transaction. Pending is unresolved, delivered is not necessarily reconciled, and reversed payments remain history but do not count toward the live paid balance.

### 10.12 Communications and notifications

A communication must identify its audience, subject, body, delivery channel, and school context. Group messages must not retain an unintended direct recipient. Individual messages must have a valid recipient. Published notices can be taken down without deleting the history. Republishing changed content creates a fresh delivery materialization.

In-app notifications are available when the user and school context are valid. Email, SMS, push, and provider callbacks require deployment configuration. The notification bell’s unread state is updated by real mark-read operations rather than by simply opening a page.

### 10.13 Library

The library catalogue records titles and physical-copy count. A loan or reservation requires an active student with an active enrollment in the current school. Returning a book restores an available copy. Lost, damaged, fulfilled, cancelled, and expired states preserve operational history.

### 10.14 Hostel

Hostel operations include hostels, rooms, occupancy, and student allocation. The school should define capacity and eligibility rules before allocation. Allocations must remain school-scoped and lifecycle-aware.

### 10.15 Transport

Transport requires a registered vehicle, capacity, driver or responsible operator, route, ordered stops, and current safety inspection. An allocation requires an active student, active enrollment, valid route, vehicle not in maintenance or inactive state, latest passed inspection, inspection not overdue, no duplicate active allocation, and available capacity.

Parents and students see only their own active allocation, including route, vehicle, and pickup information. The current foundation does not prove live GPS tracking or provider-scale transport telemetry.

### 10.16 Clinic, welfare, reception, and safety

Health records require restricted access. A medical profile should contain only information necessary for school care, and visits should record complaint, treatment, escalation, referral, and follow-up appropriately. Reception and visitor workflows support school front-desk operations. Safety incidents and discipline cases need clear escalation and confidentiality procedures.

### 10.17 AI Tutor, community, exchange, and live rooms

These capabilities are designed as safeguarded extensions, not unrestricted social media. The AI Tutor uses server-side provider configuration and must not receive passwords, payment details, medical notes, or private school records. Community content is moderated, school-scoped, and subject to privacy and guardian-consent policy where required.

Project Exchange requires school opt-in, international opt-in where applicable, project approval, participating-school acceptance, student active enrollment, guardian consent for international participation, and opaque aliases. It does not provide unrestricted student discovery or direct private messaging.

Live Rooms require an approved schedule, waiting-room admission, participant limits, removal and reporting controls, provider readiness, signed callbacks, and recording policy. Recorded rooms require the required guardian consent before admission and token issuance. The provider adapter, webhooks, egress, private storage, and retention process must be tested in the target deployment before live video is marketed as operational.

---

## 11. API conventions

### 11.1 Base path

The canonical API base is:

```text
/api/v1
```

The frontend API client owns the base URL. Page code should use paths such as:

```javascript
api.get('/students');
api.post('/admissions', formData);
api.get(`/students/${studentId}/documents/id-card`, { responseType: 'blob' });
```

Do not write `/api/v1/api/v1/...` and do not omit the leading slash.

### 11.2 Response handling

Collection responses may be direct arrays, Laravel resource collections, or objects with a `data` property. Frontend code must normalize and guard them:

```javascript
const data = response?.data?.data ?? response?.data;
const rows = Array.isArray(data) ? data : [];
```

A malformed response must produce a loading/error/empty state, not a `.map()` or `.filter()` crash.

### 11.3 Multipart uploads

File uploads use `FormData`. The active Admissions flow sends the student photo as a multipart `photo` file. The backend validates file type and size, stores a path rather than file bytes in the database, and returns a usable URL to authorized viewers.

### 11.4 Errors

The canonical Axios client normalizes errors for pages. A page should show a meaningful error state, preserve the user’s work where possible, and offer Retry or Support Centre guidance. Payment, auth, lifecycle, result publication, and deletion failures must not be hidden behind a generic success message.

### 11.5 Official documents

ID cards, transcripts, certificates, and report cards are binary responses. The frontend should request them as blobs, create an object URL, trigger the download, and revoke the object URL later. Access is still controlled by backend permission and publication rules.

---

## 12. Data model and record relationships

The most important relationships are:

```mermaid
erDiagram
    ORGANIZATION ||--o{ SCHOOL : owns
    SCHOOL ||--o{ USER_ROLE : scopes
    USER ||--o{ USER_ROLE : has
    SCHOOL ||--o{ ACADEMIC_SESSION : contains
    ACADEMIC_SESSION ||--o{ TERM : contains
    SCHOOL ||--o{ DIVISION : contains
    DIVISION ||--o{ CLASS : contains
    CLASS ||--o{ STREAM : contains
    SCHOOL ||--o{ STUDENT : contains
    STUDENT ||--o{ STUDENT_ENROLLMENT : has
    ACADEMIC_SESSION ||--o{ STUDENT_ENROLLMENT : scopes
    TERM ||--o{ STUDENT_ENROLLMENT : scopes
    STUDENT ||--o{ RESULT : receives
    STUDENT ||--o{ STUDENT_FEE : owes
    STUDENT ||--o{ ATTENDANCE : has
    STUDENT }o--o{ GUARDIAN : linked
    STUDENT ||--o| USER : portal
    PARENT ||--o{ PARENT_STUDENT : links
    STAFF ||--o{ ROLE_INVITATION : receives
    SCHOOL ||--o{ ACTIVITY_LOG : records
```

### 12.1 Identity versus placement

The `students` record identifies the learner. `student_enrollments` records where and when that learner is placed. The admission number is permanent and server-generated. Class, stream, term, and session placement belong to enrollment history and should not be casually rewritten in the identity form.

### 12.2 Media references

Student photos, staff photos, school logos, signatures, stamps, assignment attachments, community media, and recordings are represented by storage references and metadata. The database should not be used as a binary file store. Public and private media require different access paths.

### 12.3 Audit history

Critical actions should record actor, school, module, action, subject, description, timestamp, and relevant safe properties. Platform actions and school actions are deliberately separated. Sensitive credentials, raw provider bodies, and payment secrets must not be written into logs.

---

## 13. Deployment architecture

### 13.1 Render blueprint

`render.yaml` describes the hosted topology:

| Service | Purpose |
|---|---|
| Backend web service | Laravel API and public document endpoints. |
| Queue worker | Asynchronous mail, communication, media, and other jobs. |
| Scheduler worker | Laravel scheduled work. |
| Subscription cron jobs | Subscription expiry and reminder operations. |
| Static frontend site | Built React/Vite assets. |
| Managed database | Production relational data store. |

The current Render blueprint is configured for PostgreSQL, database-backed session/cache/queue, object storage, SMTP, and optional provider integrations. Termux testing historically uses MySQL. The production database engine must be selected deliberately and all migrations must be run against that engine from a clean database and an upgraded database.

### 13.2 Termux topology

`dono-termux.sh` is the supported helper for mobile testing. It uses a Debian environment through `proot-distro` because native Termux PHP may lack Sodium or other required extensions.

Supported wrapper categories include:

```text
bash dono-termux.sh install
bash dono-termux.sh artisan <command>
bash dono-termux.sh composer <command>
bash dono-termux.sh api
bash dono-termux.sh queue
bash dono-termux.sh scheduler
bash dono-termux.sh test
```

Use the wrapper for Laravel commands. Do not rely on plain native `php artisan` when the Termux PHP binary lacks the required extensions.

### 13.3 Local tunnel

The local tunnel requires both the Laravel API and Vite frontend to be running and requires working DNS/internet access. A tunnel failure is not an application failure. If the tunnel hostname cannot be resolved, restart after network recovery or use the configured hosting platform.

---

## 14. Environment configuration

The backend `.env.example` is the source for configuration names. Never commit `.env` or real credentials.

| Category | Representative variables | Purpose |
|---|---|---|
| Application | `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL` | Laravel runtime and public URL. |
| Frontend | `FRONTEND_URL`, `VITE_API_URL` | Browser origin and API base. |
| Database | `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, or `DB_URL` | Relational storage. |
| Authentication | Sanctum settings, verification and password policy values | Tokens, login, verification, and password flow. |
| Session/cache/queue | `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION` | State and asynchronous jobs. |
| Storage | filesystem default, S3-compatible credentials, private disk settings | Public and private media. |
| Mail | `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_*` | Verification, reset, notices, and support mail. |
| Payments | Paystack keys and callback settings | Checkout, verification, and reconciliation. |
| AI | AI provider and model settings | Server-side tutor configuration. |
| Push/SMS | Firebase and Twilio variables | Optional external delivery. |
| OAuth/API | Passport keys, public API, school API key settings | Machine access and external integration foundations. |
| Backup | Backup enablement, destination, encryption passphrase, retention | Encrypted backup and retention operations. |
| Live rooms | Provider name, private credentials, public client URL, webhook secret, adapter-ready flag | Live provider readiness. |
| Recording | Egress, private output, retention settings | Recording consent, storage, callback, and purge. |
| Subscription | `SystemSetting.enforce_subscriptions` and plan settings | Feature enforcement. |

Secrets must be stored in the hosting platform’s secret manager or environment settings. Do not send them through support tickets, commit them, print them in diagnostics, or place them in frontend variables unless they are intentionally public.

---

## 15. Subscription enforcement

The system includes `CheckActiveSubscription` and `CheckSubscriptionFeature` middleware. Subscription enforcement is controlled by `SystemSetting.enforce_subscriptions` and is currently off by default in the development/testing context described by the repository.

When enforcement is enabled, the school’s subscription status, plan, grace period, feature entitlement, and expiry must be checked before protected features proceed. Free trials and grants must be represented accurately. If a school subscribes during a free period, the paid subscription should begin according to the configured trial/grant policy rather than unexpectedly consuming paid time.

Platform-only write operations for subscription plans, coupons, promotional campaigns, and school subscriptions must require `role:super_admin`. Broader read access may be permitted where the product policy allows it.

---

## 16. Backup, retention, and disaster recovery

A school-facing system should not be accepted without a tested recovery procedure. The minimum procedure is:

1. Enable encrypted backups in the target environment.
2. Store the encryption passphrase outside the source repository.
3. Store backup data in private object storage.
4. Configure scheduled backup and retention.
5. Perform a restoration drill into an isolated database and storage area.
6. Verify users, schools, students, enrollments, invoices, payments, documents, and audit logs.
7. Record the time, result, errors, and responsible operator.
8. Repeat the drill periodically.

A configured backup command or model is not evidence that restoration works. The live target deployment must prove both database restoration and private media restoration.

For recordings and other private media, deletion must obey the configured retention policy. The current live-room recording foundation defaults to bounded retention but remains dependent on provider egress, private storage, callbacks, and scheduled execution.

---

## 17. Testing and quality assurance

### 17.1 Source-level checks

The repository uses the following checks:

```bash
cd backend/dono-api && vendor/bin/phpunit
cd backend/dono-api && php artisan route:list --except-vendor
node frontend/scripts/validate-guide.mjs
python3 scripts/validate-doono-architecture.py
cd frontend && npm run lint
cd frontend && npm run build
git diff --check
```

The supported target is a passing test suite, passing architecture and guide guards, zero frontend lint errors, a successful production build, and a clean diff check.

### 17.2 Live acceptance checks

Source checks cannot prove:

- Database migrations on the selected production engine.
- Two-school tenant isolation under real records.
- Real email delivery and verification.
- Password reset through a real mailbox.
- Payment callback delivery and reconciliation.
- Queue and scheduler execution.
- S3 or private-storage permissions.
- Camera, microphone, screen sharing, or realtime live-room quality.
- Backup restoration.
- Offline conflict resolution across every module.
- Large-scale concurrency or extreme capacity.

These must be tested in the target deployment.

### 17.3 Two-school isolation test

Create School A and School B. Create one owner, one principal, one teacher, one parent, and one student in each. Confirm that:

1. School A users cannot list School B students.
2. School A users cannot retrieve School B invoices, results, media, audit logs, or notifications.
3. A teacher sees only assigned classes and subjects.
4. A parent sees only linked children.
5. A student sees only the linked student record.
6. An exported file contains only authorized records.
7. Switching context changes the visible data without carrying over stale records.

### 17.4 School pilot acceptance

The first pilot school should run the following real sequence: setup, invitations, student admission, student photo, ID card, parent linking, student portal, attendance, timetable, assignment, CBT, results, report card, fees, payment, notice, library, hostel, transport, clinic, support, audit, password reset, logout, and mobile navigation.

---

## 18. Operational runbook

### 18.1 New school onboarding

The onboarding operator should collect the school’s official name, short name, code, address, phone, email, logo, academic calendar, divisions, classes, streams, subjects, fee categories, grading rules, staff list, learner import file, parent relationships, and policy decisions. The operator should first run a dry run with one faculty-equivalent division, one class, a small student sample, one teacher, and one parent.

The school should then run DOONO alongside its previous records for a controlled period. Reconcile student counts, admission numbers, staff roles, balances, attendance, and results before expanding the import.

### 18.2 Staff invitation procedure

The Proprietor confirms the staff member’s real email, selects the school-scoped role, chooses the class and stream for a Form Teacher, sends the invitation, and waits for acceptance. After acceptance, the Proprietor confirms the employment record and role in Staff. If the staff member leaves, use suspension or termination rather than deleting the history.

### 18.3 Student photo and ID procedure

The admissions officer chooses a clear photograph, checks the preview against the learner, completes admission, reopens the record, and generates a test ID card. The school should define a photo policy covering consent, acceptable clothing/background, file retention, correction, and who may view or change photographs.

### 18.4 Finance close procedure

At the end of a collection period, finance should reconcile invoice count, payments, pending transactions, reversed transactions, receipt numbers, cash records, gateway references, and outstanding balances. Never “fix” an incorrect payment by deleting it; use the approved reversal or adjustment workflow.

### 18.5 Incident response

When a user reports a problem, collect the school, role, page, exact steps, expected result, actual result, timestamp, record identifier, and error message. Do not request passwords, one-time codes, private keys, or full card details. For a suspected tenant leak or payment issue, restrict access and escalate immediately.

---

## 19. Troubleshooting guide

| Symptom | Likely cause | Correct action |
|---|---|---|
| Login says invalid after invitation | Different email used, verification pending, temporary password not changed, or stale invitation. | Use the exact invited email, verify it if required, use the latest link, and reset the password if necessary. |
| Registration succeeds but dashboard does not open | Local verification policy or token response mismatch. | Confirm the intended local policy, clear cached frontend state, and test the production verification path separately. |
| Classes or subjects do not appear | Session, term, division, class, stream, or permission prerequisite is missing. | Confirm active session and term, then confirm the school setup records and role permissions. |
| Timetable button appears not to work | Required context missing, collision, validation error, or provider/browser issue. | Read the error state, confirm class/subject/teacher/time, and verify draft → submitted → approved → published order. |
| ID card shows initials | No valid persisted student photo or media file unavailable. | Edit the student, upload an accepted image, save, then generate the card again. |
| Student photo preview appears but disappears | Upload was not sent as multipart data, storage was not linked, or the API URL is stale. | Confirm the main Admissions release is applied, storage is configured, and the record returns `photo_url`. |
| Parent cannot see a child | Parent-child link missing or linked to the wrong school/student. | Open the canonical parent record and link the exact child; do not create another account. |
| Student portal says profile not linked | User exists but no canonical student `user_id` link exists. | Link the account from the intended student record. |
| Parent/student cannot see result | Result is not approved/published or portal scope is wrong. | Check submission, approval, publication, active school, and linked record. |
| Fee structure saved but no invoice | No eligible active enrollments, inactive structure, wrong context, or matching invoice already exists. | Check class/session/term/enrollment and read the generated count or empty-state reason. |
| Payment shows pending | Provider callback or reconciliation has not confirmed it. | Treat it as unresolved; verify the reference and callback rather than recording a second payment. |
| Notification bell remains unread | Mark-read action failed or another notification remains unread. | Open Notifications, mark the actual item read, refresh, and inspect the API error if the badge remains. |
| Guide repeats generic text | Old release or an unregistered control/page alias. | Apply the intelligent guide release and ensure the page uses the canonical guide key. |
| Migration fails on MySQL index name | Generated identifier exceeds MySQL’s limit or migration assumes an index name. | Use the corrected release with explicit short names and metadata-safe detection; test from clean and upgraded databases. |
| `mysql No such file or directory` | PHP is trying to use an empty or socket-based host. | Configure `DB_HOST=127.0.0.1`, database, username, and password in the correct environment and run through the supported Termux wrapper. |
| Sodium or Passport error in Termux | Native PHP lacks required extension or Composer dependencies. | Use `bash dono-termux.sh install` and run Laravel commands through `bash dono-termux.sh artisan ...`. |
| Cloudflare tunnel cannot resolve | DNS or internet connectivity problem. | Confirm network access, retry later, or use a hosted deployment. |
| External mail/SMS/push not delivered | Provider credentials, worker, sender, callback, or preference configuration missing. | Check the provider readiness checklist and queue/scheduler logs. |
| Live room says provider not ready | Intentional readiness gate. | Configure and test provider credentials, client URL, webhook signature, safeguarding, recording, storage, and adapter-ready state before enabling. |

---

## 20. Security checklist before a school receives access

| Check | Required outcome |
|---|---|
| `APP_DEBUG` | Disabled in production. |
| Secrets | Stored in host secrets, not source control or frontend bundles. |
| CORS and frontend URL | Match the real deployed frontend exactly. |
| Email verification | Enabled and tested with a real mailbox. |
| Password reset | Tested from a real device. |
| Tenant isolation | Two-school acceptance test passes. |
| Platform roles | Only platform-wide records have `school_id = NULL`. |
| Audit logs | Platform and school actions remain separated. |
| Audit permission | Only intended roles can view the correct scope. |
| File storage | Public/private media permissions are verified. |
| Student photos | Access and correction policy is approved by the school. |
| Medical data | Restricted to authorized clinic permissions. |
| Payment data | No full card details stored or logged. |
| Webhooks | Raw body/signature/idempotency checks enabled where required. |
| Backups | Encrypted backup and restoration drill completed. |
| Queue/scheduler | Worker and scheduled jobs are running. |
| Subscription | Enforcement policy intentionally selected and tested. |
| Optional providers | Unconfigured features remain honestly disabled. |
| Database | Exact production engine migration tested from clean and upgraded state. |
| Mobile | Main workflows tested on the actual phone/network used by the school. |

---

## 21. Termux deployment and update procedure

The supported update pattern is to download a clean full source archive, preserve partial downloads in `$HOME/.cache`, test the archive, extract it into a temporary directory, copy the source into `~/dono-school-erp`, run Laravel maintenance through `dono-termux.sh`, and rebuild the frontend.

A typical release command has this shape:

```bash
cd "$HOME/dono-school-erp" && mkdir -p "$HOME/.cache" && url="RELEASE_URL" && archive="$HOME/.cache/dono-release.zip" && if ! unzip -tq "$archive" >/dev/null 2>&1; then (curl -fL -C - --retry 10 --retry-delay 3 --retry-connrefused --retry-all-errors "$url" -o "$archive" || curl --resolve files.manuscdn.com:443:99.84.132.81 -fL -C - --retry 10 --retry-delay 3 --retry-connrefused --retry-all-errors "$url" -o "$archive"); fi && unzip -tq "$archive" && tmp="$(mktemp -d)" && unzip -oq "$archive" -d "$tmp/extracted" && cp -a "$tmp/extracted/DOONO-ERP/." "$HOME/dono-school-erp/" && rm -rf "$tmp" && cd "$HOME/dono-school-erp" && bash dono-termux.sh artisan migrate --force && bash dono-termux.sh artisan optimize:clear && (bash dono-termux.sh artisan storage:link || true) && cd frontend && npm install && npm run build
```

Replace `RELEASE_URL` with the actual release URL supplied for the intended version. Do not use a placeholder URL in a real command. Keep the terminal open until migration, cache clearing, storage-link handling, dependency installation, and Vite build all finish.

---

## 22. Known limitations and non-claims

The following statements must not be marketed as proven solely from the repository source:

- A live database-connected end-to-end workflow across real schools.
- Successful PostgreSQL and MySQL migration compatibility without running both target paths.
- Full offline support for every module.
- Automatic encrypted backup restoration without a completed drill.
- Real external email, SMS, push, Paystack, AI, or live-provider delivery without credentials, workers, callbacks, and tests.
- Live audio/video quality, recording durability, or device compatibility without provider and browser testing.
- Full statutory or regulatory compliance without a confirmed country, regulator, and school policy.
- Extreme-scale operation for hundreds of millions of schools or millions of simultaneous API calls without a production capacity program.
- A complete marketplace with executable commerce and fulfillment.
- Production-ready public API integrations without threat modeling, rate limiting, key rotation, monitoring, and partner testing.
- Automatic moderation that replaces human safeguarding review.

These are not weaknesses to hide. They are release boundaries that protect schools from relying on an unverified assumption.

---

## 23. Recommended school rollout

The safest rollout is staged.

### Stage 1: Internal preparation

Choose the production host and database engine, configure secrets, mail, storage, queue, scheduler, payments, backups, and monitoring. Run migrations from zero and on a copy of an upgraded database.

### Stage 2: Controlled pilot

Select one school. Import a small, verified sample. Create the Proprietor, Principal, one teacher, one form teacher, one finance user, one parent, and one student. Run the full acceptance workflow and compare DOONO with the school’s existing records.

### Stage 3: Parallel run

Operate both systems for an agreed period. Reconcile student counts, admission numbers, attendance, results, invoices, payments, and communication. Record discrepancies and correct them through the proper workflows.

### Stage 4: Expansion

Train the school by role, publish the local operating procedure, establish a support path, enable only tested modules, and gradually import remaining records. Add another school only after the first pilot is stable.

---

## 24. Glossary

| Term | Definition |
|---|---|
| Active school context | The school currently resolved for the authenticated user by `CurrentContextService`. |
| Academic session | A school’s academic year or configured academic period. |
| Term | A period inside an academic session, such as First Term or Second Term. |
| Active enrollment | A current learner placement eligible for current school workflows. |
| Admission number | The permanent server-generated learner identifier. |
| Role | A named responsibility assigned to a user, either platform-wide or school-scoped. |
| Permission | A specific operation the role is allowed to perform. |
| Draft | A record still being prepared and not yet submitted or published. |
| Submitted | A record sent for review. |
| Approved | A record accepted by the authorized reviewer. |
| Published | A record made visible to its intended audience. |
| Pending payment | A payment not yet verified or reconciled. |
| Reversed payment | A historical payment removed from the live balance through an authorized reversal. |
| Portal link | The canonical relationship connecting an account to a student or parent record. |
| Student 360 | An authorized combined learner review of identity, enrollment, attendance, results, fees, and assignments. |
| CurrentContextService | Backend authority for the authenticated organization, school, role, permission, and academic context. |
| School OS | DOONO’s connected model for operating a school, not a device operating system. |

---

## 25. Source map

The following repository locations are the principal source references for this manual:

| Topic | Source |
|---|---|
| API routes | `backend/dono-api/routes/api.php` |
| Backend configuration | `backend/dono-api/.env.example` |
| Current context | `backend/dono-api/app/Services/CurrentContextService.php` |
| Authentication | `backend/dono-api/app/Http/Controllers/Api/AuthController.php` |
| Role middleware | `backend/dono-api/app/Http/Middleware/RoleMiddleware.php` |
| Permission middleware | `backend/dono-api/app/Http/Middleware/PermissionMiddleware.php` |
| Student model | `backend/dono-api/app/Models/Student.php` |
| Admission validation | `backend/dono-api/app/Http/Requests/StoreAdmissionRequest.php` |
| Admission transaction | `backend/dono-api/app/Services/AdmissionService.php` |
| Student photo storage | `backend/dono-api/app/Services/MediaStorageService.php` |
| ID cards and transcripts | `backend/dono-api/app/Http/Controllers/Api/StudentOfficialDocumentController.php` |
| ID-card PDF | `backend/dono-api/resources/views/pdf/student-id-card.blade.php` |
| Frontend shell | `frontend/src/App.jsx` |
| Frontend API client | `frontend/src/services/api.js` |
| Frontend capabilities | `frontend/src/config/schoolOsCapabilities.js` |
| Guide knowledge | `frontend/src/config/guideKnowledge.js` |
| Guide dialog | `frontend/src/components/feedback/DONOGuide.jsx` |
| Support Centre | `frontend/src/pages/SupportCentre.jsx` |
| Termux wrapper | `dono-termux.sh` |
| Hosted deployment | `render.yaml` |
| Living implementation audit | `audit/school-os-capability-audit.md` |
| Production readiness | `audit/production-readiness-audit-2026-08-25.md` |

---

## 26. Document maintenance rule

This manual must be updated whenever a new module, role, route group, workflow state, provider integration, data boundary, migration behavior, or deployment requirement is added. Documentation should be changed only after the corresponding source has been inspected and validated.

Every future release should answer five questions before it is described as complete:

1. What source files implement the feature?
2. Which roles and permissions can use it?
3. What school or organization scope protects it?
4. What is the exact workflow and success state?
5. What external configuration or live test is still required?

A feature is not complete merely because a page or button exists. It is complete when the interface, API, authorization, validation, persistence, audit trail, error state, guide explanation, and deployment behavior agree.
