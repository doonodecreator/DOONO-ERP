# DOONO School Operating System Capability Audit

## Definition used

DOONO can operate as a **School Operating System** when the school’s people, academic lifecycle, money, communication, welfare, operations, documents, portals, and configuration share one authenticated school context, one permission model, one audit trail, and reliable cross-module workflows. This is different from a device operating system such as Android or Windows. DOONO is a vertical operating system for running a school.

## Confirmed foundations already present

| School OS foundation | Verified current implementation | Assessment |
|---|---|---|
| Identity and access | Sanctum authentication, role-scoped `user_roles`, first-login password change, email verification/reset flows, and role-aware frontend context | Present and should remain centralized |
| Organization and school context | `CurrentContextService` resolves organization, school, roles, permissions, onboarding, and tenant partition; frontend `AuthContext` consumes `/me/context` | Strong foundation; do not re-derive context in pages |
| Role-based workspaces | Platform owner, organization owner, proprietor, principal, academic/admin leaders, teachers, form teachers, finance, library, health, hostel, transport, receptionist, parent, and student dashboards are registered in `App.jsx` | Present, but navigation is still a large manually maintained matrix |
| Academic lifecycle | Students, term-level enrollments, sessions, terms, promotions, graduation records, results, report cards, and permanent admission numbers exist | Promotion/graduation logic has recently been strengthened; live database workflow testing is still required |
| School operations | Attendance, assignments, timetable, examinations, CBT, library, transport, hostel, clinic, visitors, assets, facilities, communication, and payroll surfaces exist | Broad module coverage is present |
| Finance | Fee configuration, student invoices, payments, reconciliation, discounts, financial reports, and subscription controls exist | Present; provider configuration and production payment verification remain operational concerns |
| Family portals | Parent and student accounts are created from the school record, linked by school-scoped relationships, and routed through dedicated role-protected portal endpoints | Present; parent multi-child linking and student lifecycle restrictions are documented and enforced in the latest release |
| Notifications | Context-scoped notification API, unread count, read-all behavior, in-app bell, and notification preferences exist | Present; external email/SMS/push delivery depends on provider configuration |
| Documents and branding | School branding, report cards, transcripts, student ID cards, graduation certificates, verification, and private media foundations exist | Present with provider/storage and official-policy dependencies |
| Audit and accountability | Activity logs, platform/school action separation, and action logging in many critical workflows exist | Present; coverage must continue to be audited as modules evolve |
| Offline readiness | Offline queue foundations exist for CBT answers and attendance with idempotency handling | Partial, not full offline support for every module |
| Platform operations | Feature flags, encrypted backup foundations, OAuth client/API-key foundations, marketplace and benchmarking surfaces exist | Foundations are present, but external providers, restore drills, executable plugins, and production-scale evidence cannot be claimed without configuration and testing |

## Confirmed School OS gaps

The authenticated shell still uses a page-string switch in `App.jsx` and manually enumerated navigation arrays in `Sidebar.jsx`. This is workable, but it is less resilient than a shared capability registry because page availability, navigation visibility, permissions, and guide metadata can drift apart. A School OS should have one registry that describes each module, its route key, required capability, audience, prerequisites, and guide key.

The shell has a persistent dashboard layout, browser back handling, an active context label, an in-app notification bell, Support Centre, and an offline banner. However, the global shell does not yet present a complete context/status rail showing the active organization, school, current session, current term, setup readiness, connection state, and the next required workflow in one consistent place.

The backend has many modules but not every module is guaranteed to publish a uniform workflow state, event, notification, audit record, and support context. Critical records such as admissions, enrollments, promotion, graduation, results, invoices, payments, assignments, attendance, and communications need to remain connected through explicit lifecycle rules rather than isolated CRUD pages.

The current guide is substantially expanded and includes role, module, control, concept, portal, admission-number, promotion, and graduation explanations. It should continue to be generated from the same module/capability registry used by navigation so that a feature cannot be visible without an explanation of its purpose, prerequisites, controls, success signal, and next step.

External delivery, backup restoration drills, full offline conflict handling, MFA, public API production security, marketplace execution, benchmark methodology, and extreme-scale load evidence remain deployment- and provider-dependent. They must be completed through real configured infrastructure and tested workflows, not represented as complete merely because local source foundations exist.

## Recommended implementation order

The safest next implementation is a **School OS capability registry and shell status layer**. It should not replace the existing role and permission system. It should derive navigation and guide metadata from verified keys, show the active context and current operational state, and expose only actions allowed by the backend permissions. After that, the highest-value workflow workstreams are the unified operational inbox, school-wide search, lifecycle/event consistency, notification delivery observability, and production operational controls.

## Non-negotiable boundaries

The School OS must keep platform-owner actions separate from school audit logs; never allow a proprietor to see platform-owner activity. All data access must resolve school context through `CurrentContextService`. Parent and student portals must remain restricted to linked records. Admission numbers must remain server-generated and immutable. Academic history, invoices, payments, attendance, results, and report cards must remain attached to the enrollment or transaction that produced them. Subscription enforcement must remain controlled by the existing middleware and system setting. Provider-dependent features must display honest configuration states rather than false success claims.

## First School OS foundation implemented

The authenticated context contract now also returns the current school’s active academic session, active term, dates, and an operational state: `ready`, `needs_session`, `needs_term`, or `organization_context`. It is resolved by `CurrentContextService`, so pages do not calculate the current period independently.

The persistent dashboard shell now renders a responsive School OS context bar on every authenticated screen. It shows the verified organization or school context, session, term, role, operational readiness, and the next setup action when a school has no active session or term. This is a shared shell foundation, not a replacement for role permissions or school isolation.

The Support Centre concept library now explains “School Operating System” in beginner-friendly language and connects it to school context, enrollment, tenant isolation, and portals. The existing guide continues to document the concrete module workflows.

This workstream does not claim that DOONO is a device operating system or that every provider-dependent feature is complete. It establishes the shared operating surface needed to continue building the product as a connected School OS.

## Capability registry increment

A compatibility-first frontend capability registry now describes the verified page keys used by the application, their guide key, audience, purpose, and canonical aliases. `App.jsx` normalizes navigation through that registry, `Sidebar.jsx` annotates menu entries with capability purpose metadata, and `DONOGuide.jsx` resolves the same canonical pages before opening module or role guidance. This reduces drift between the visible menu, page switch, and learning content without replacing the backend role and permission checks.

The registry is intentionally not treated as authorization. Backend middleware and `CurrentContextService` remain the authority for access. Hiding a menu item is not considered security, and users cannot gain access by manually requesting a page key.

Validation for this increment passed with 14 PHPUnit tests and 19 assertions, guide coverage of 73 modules and 57 role guides, the architecture guard, and a Vite production build of 277 modules.

## Work Inbox increment

The authenticated API now exposes `GET /api/v1/work-inbox`. The service resolves the current organization and school through `CurrentContextService` and aggregates only real actionable records: incomplete school setup prerequisites, pending result approvals, submitted timetable approvals, pending staff leave requests for leadership, pending role invitations for authorized role managers, failed school communication delivery, and unread notifications belonging to the current user and context.

The Work Inbox is not an authorization layer and does not duplicate records. Each item links to the existing module where the authorized action must be completed. After the underlying record changes, refreshing the inbox removes the item. The frontend guards malformed responses, provides loading/error/empty states, shows priority and record counts, and is available from the common role navigation.

A dedicated Notifications workspace now lists the current user’s context-scoped notifications, supports individual mark-read and mark-all-read actions, and is the destination of the notification bell’s View all action. Notification visibility remains governed by the existing notification controller’s user, organization, school, and platform rules.

Validation passed with 14 PHPUnit tests and 19 assertions, PHP lint, Laravel route compilation for `/work-inbox`, guide validation with 73 modules and 58 role guides, the architecture guard, and a Vite production build with 279 modules.

## Global Search increment

The authenticated API now exposes `GET /api/v1/global-search` with a validated query of two to eighty characters, an optional record type, and a bounded result limit. In a school context it searches only students, parents or guardians, staff, enrollments, and result summaries that the current user’s school-scoped permissions allow them to view. In an organization context it searches only the permitted organizations and schools. It returns minimal references and does not search or expose passwords, payment-card data, medical notes, or hidden credentials.

A mobile-friendly Global Search workspace is available from the common sidebar. Results display their record type and supporting context, and opening a result takes the user to the existing module rather than creating a duplicate record. Malformed response data produces a safe empty state instead of a rendering crash. The guide documents exact searchable identifiers, role and school boundaries, and troubleshooting for missing records.

Validation passed with 14 PHPUnit tests and 19 assertions, PHP lint, Laravel route compilation for `/global-search`, guide validation with 73 modules and 58 role guides, the architecture guard, and a Vite production build with 280 modules.

## Unified record-opening navigation increment

Global Search now has a centralized App-level opening flow. Search results carry only a restricted type and identifier into the frontend; they do not include a full record and do not grant access. Student results open Student 360, which refetches the authorized record through the existing `/students/{id}/360` endpoint. Parent results enter the authorized parent directory and open the loaded parent profile. Staff results enter the authorized staff directory; a proprietor with employment-management capability may continue to the existing edit workspace, while other roles remain on the directory view. Enrollment and result-summary results continue to open their existing workspaces without inventing a detail endpoint or pretending that a summary ID is a report-card ID.

The destination pages re-check their existing backend permission and school-scope boundaries. If a record has moved school, is deleted, or is no longer permitted, it is not opened. This remains state-based navigation inside the authenticated shell rather than a public record URL. Work Inbox items remain generic until an underlying item exposes a verified record identifier and a safe destination contract.

Validation for this increment passed with 14 PHPUnit tests and 19 assertions, guide validation with 73 modules and 58 role guides, the architecture guard, the `/global-search` route compilation check, and a Vite production build with 280 transformed modules. No DB-backed live workflow or multi-tenant integration test was claimed because the sandbox does not have the application’s configured test database.

## Finance workflow-state increment

The configured fee workspace now exposes a real **Generate invoices** action. The endpoint is proprietor-only and requires the existing student-fee management permission. It validates the selected fee structure, class, academic session, term, and active school context; generates invoices only for active enrollments; maps the configured structure to a valid school fee category; and reuses matching invoices instead of duplicating them. The operation records a school-scoped audit event and returns an explicit count or an explanatory zero-result message.

This repairs the former gap where fee structures could be saved but the path from a class fee rule to student invoices was not exposed, and it avoids assigning a configured `fees` row ID directly into the `student_fees.fee_category_id` foreign key. The frontend displays the result and the guide now distinguishes a saved billing rule from a generated student invoice. Live payment-provider delivery and database-backed multi-tenant execution remain deployment/testing concerns and are not claimed here.

## Timetable workflow-state increment

The timetable state machine now enforces the intended order: draft → submitted → approved → published. Approval can no longer skip the submission step, and submission is accepted only for draft entries. Editing a timetable entry clears its previous approval and returns it to draft, requiring a fresh review before publication. The frontend already exposed the same transition order and now shows explicit success messages and prevents overlapping workflow clicks while an action is in progress.

Timetable create, edit, delete, submit, approve, and publish actions now produce school-scoped audit records. Existing backend publication and viewer scopes remain authoritative: teachers and students receive only records allowed for their assignments or current placement, while authorized timetable managers and approvers can review the school workflow states. No cross-school access was added.

## Results workflow increment

Result entry now resumes the unique class/subject/session/term submission instead of creating a duplicate when a teacher returns to the score sheet. Existing component scores are returned and restored in the frontend. Submitted, approved, and published submissions are shown as read-only in Result Entry; controlled correction requires an authorized reopen with a reason.

The new current-submission lookup and the existing create, autosave, submit, and reopen paths enforce the active school and teaching scope. Teachers can operate only on their assigned timetable class and subject, while form teachers can operate only on their active form class. Result submission creation, submission, approval, and publication are recorded in the school audit trail.

Staff report-card review may still show draft cards for authorized internal review, but PDF downloads now require `is_published`. Student and parent portal publication safeguards remain in place. The computation engine continues to publish a report card only when the required class subjects have been published. Database-backed execution across real school records remains a deployment validation step and is not claimed by static or unit checks alone.

## Admissions and enrollment readiness increment

Admissions now records an audit event after the transactional learner-plus-first-enrollment operation succeeds. Admission numbers remain automatic, permanent, school-scoped, and allocated by the existing collision-safe sequence.

Ordinary enrollment creation now produces only an Active placement and rejects a duplicate student/session/term combination before database insertion. Ordinary enrollment edits cannot change the student or lifecycle status and reject conflicting session/term placements. Promotion, repetition, transfer, withdrawal, and graduation remain decisions for the dedicated lifecycle workflow so historical enrollment records are not silently rewritten. Enrollment creation, placement correction, and deletion are audit-recorded; database-backed deployment testing should still verify existing production data and any legacy records before deletion is used.

## Staff roles and invitation increment

The staff role workflow remains school-scoped and authority-ranked. The invitation controller rejects platform, organization-owner, Proprietor, parent, and student roles from school staff invitations, and an actor cannot invite a role at or above the actor's school authority. Form Teacher invitations require a real school class and optional stream; acceptance activates the corresponding class-specific assignment.

The Proprietor remains the only role allowed to open the invitation workspace, revoke invitations, delegate setup permissions, and change or terminate employment. Employment changes revoke that staff member's school-scoped roles and tokens while preserving the staff and academic history. The delegation picker now loads active staff records with actual linked school leadership roles, so directly assigned Principal or Vice Principal Academic users are available even when they were not created from the current invitation-history page. Only explicitly selected setup permissions are delegated.

## Parent and student portal readiness increment

Parent-child links are now synchronized from the canonical school-scoped `parent_student` relationship into the portal-facing guardian graph whenever a link is created, corrected, or removed, including when an existing parent portal account is provisioned again. This prevents a parent with multiple children from seeing stale or missing children in the portal. The link mutations are audit-recorded.

Student portal timetable queries now require active entries in the published workflow state, with a compatibility allowance for legacy null workflow states. Student report-card downloads now require the report card, final student result summary, and at least one final subject result to be published. Parent and student account, school, lifecycle, and published-result boundaries remain enforced by the existing controllers and middleware. Live provider delivery and live database workflow tests remain deployment-dependent.

## Attendance and welfare increment

Attendance registers now load and save only active student placements for the selected school, session, term, class, and optional stream. Teacher class choices preserve the class-and-stream assignment from the teacher dashboard, and the bulk endpoint verifies every submitted enrollment belongs to that active selection before saving. Successful register actions are audit-recorded, while existing correction history and offline conflict handling remain intact.

Student leave ownership now recognizes the canonical parent-child relationship as well as the synchronized guardian portal graph, and school-scoped Proprietor, Principal, and Vice Principal Admin roles can review requests in their active school. Only pending student leave requests can be reviewed. Teacher dashboards and student portals show only published timetable entries; portal and notification boundaries remain school-scoped.

## Communication audience and withdrawal increment

School communication validation now rejects a direct recipient on audience-wide messages and requires a recipient for individual messages, both when creating and when editing. Changing an individual message to a group audience clears the old recipient before fan-out. Invalid individual records are also blocked by notification fan-out instead of falling back to a staff-wide audience.

Taking down a published communication clears its in-app notifications, read markers, and queued external delivery rows so the withdrawn notice is no longer treated as active. Republishing or changing published content, audience, recipient, type, or channel clears the previous delivery materialization and creates a fresh delivery attempt. In-flight delivery jobs safely stop when their delivery row has been removed. Communication and delivery actions remain school-scoped and audit-recorded; external provider acceptance still does not prove final device delivery.

## Finance settlement and reconciliation increment

Manual and online fee payments now use a locked invoice balance, reject zero and over-balance amounts, and reject reused transaction references unless the exact prior payment is a safe idempotent repeat. Reversed payments are excluded from live paid totals and balances, while their receipt and history remain visible. Cashier receipts now store the linked school Staff ID rather than the authenticated User ID, and both manual and online settlements are audit-recorded.

Student-fee creation now requires an active enrollment in the current school with matching session and term, a school-owned fee category, a school-owned academic session, and a matching term. Duplicate invoice identity is rejected. Ordinary invoice updates are limited to administrative due-date and remark changes; identity and financial values must use the approved discount or reversal workflow. Invoices with payment history cannot be deleted. Finance responses now include learner, invoice, balance, receipt, and reversal context for reconciliation.

## Increment: Library and transport operations hardening

The library workflow now restricts current workspace members, student loans, and student reservations to students who are both active and attached to an Active enrollment in the active school context. Book inventory and loan locking/history behavior were preserved. Reservation lifecycle records remain retained and are changed through pending, fulfilled, cancelled, or expired states rather than deleted. Student library access remains limited to the authenticated student’s own school-linked record.

Transport vehicle CRUD now resolves the active school through `CurrentContextService` and rejects cross-school reads, updates, and deletes. Vehicle history is retained by preventing deletion when routes or inspections exist. Route creation and update now correctly support a nullable vehicle assignment, while active routes with allocations cannot be deleted. Transport allocation now verifies the route and student tenant, active student status, Active enrollment, no duplicate Active allocation, a vehicle that is not Maintenance or Inactive, the latest passed inspection, an inspection that is not past its declared due date, and available vehicle capacity. Allocation and vehicle/route actions create school-scoped audit entries. Parent and student tracking now displays the canonical route and vehicle fields and exposes only active linked allocations.

The transport manager guide was expanded to explain setup order, safety readiness, capacity, current enrollment eligibility, family visibility, and exception handling. The frontend allocation form now filters toward active students and routes with available capacity and current passed inspections, while the backend remains the final authorization and integrity boundary.

This increment was reviewed against the actual Laravel migrations, Eloquent models, route/controller contracts, and React API response handling. Source-level validation is required after packaging. A live MySQL workflow, actual provider delivery, live GPS tracking, offline conflict resolution, and production-scale load evidence remain deployment-dependent and are not claimed by this audit.


## AI, Student Community, and Guardian Safety Increment — 25 August 2026

The repository now contains the first safe foundation for an AI Tutor and school-scoped student community. The AI layer uses a server-side provider adapter, persists school-scoped conversations and messages, limits history, refuses to expose private school records through its system instructions, and shows a clear configuration state when no provider is enabled. The browser never receives the provider credential.

The student community currently supports active enrolled students submitting school-scoped posts, moderated comments, reports, and private MP4/WebM/MOV video attachments. Posts and comments begin pending and are not visible to students until an authorized school moderator approves them. Approved video is served through short-lived signed routes and private storage. Guardian consent records support approval or denial of moderated video and future exchange participation for linked children; the parent portal now exposes those decisions.

The student, parent, staff, and moderation surfaces were added to the central React router, role menus, capability registry, and beginner guide. Backend routes remain behind Sanctum, active school context, password/subscription middleware, and explicit portal or moderation permissions. Student-facing community actions require an active linked student and Active enrollment.

This increment does not claim unrestricted social networking, student-to-student private messaging, global student discovery, low-latency live video, automated content moderation, video transcoding, captions, provider callbacks, or international legal/safeguarding compliance. Those require a deployed realtime/media provider, background workers, verified webhook handling, retention and escalation policies, school opt-in, guardian/child-safety review, and live operational evidence.


## Increment: Curated cross-school project exchange

DOONO now includes a school-approved project exchange foundation. A school must explicitly opt in before its exchange administration is available, and international exchange has a separate opt-in. Authorized school staff can submit a project with a subject, age band, purpose, region, and dates; the project remains in review until a permitted school moderator publishes it. Only schools that have opted in are listed, and the directory exposes school identity only—not student profiles or contact details.

A published project can invite another opted-in school. The invited school must accept before its students can see the project. A student must have an active linked account and Active enrollment, and joining creates a pending participation request that a school moderator must approve. Participation uses a generated learner alias. International participation additionally requires an approved guardian consent record and international exchange enabled for the school.

The exchange API and workspace remain protected by Sanctum, active school context, explicit student or management permissions, subscription/password middleware, school status checks, and audit events. Student discovery is project-based rather than person-based, and direct student messaging, unrestricted global search, public profiles, and open live rooms remain intentionally unavailable.

This increment does not claim low-latency live video, automated moderation, provider webhooks, global legal/safeguarding compliance, or production-scale cross-region operation. Those remain separate provider- and deployment-dependent workstreams requiring a realtime media provider, admission and removal controls, recording/retention policy, verified callbacks, abuse escalation, and operational testing.


## Increment: Live-room safety foundation

DOONO now contains school-scoped live-room records for scheduled learning sessions, including an audience type, optional exchange-project link, host, schedule, participant limit, recording-consent fields, approval state, and closure history. Authorized school users can submit and approve rooms, review waiting participants, remove participants, close rooms, and receive school-scoped safety reports.

Student access requires an active linked student and Active enrollment. A student can see only approved/scheduled/live rooms for the current school or an accepted exchange project, and a join request enters a waiting state. For international exchange rooms, the student also needs approved guardian consent for global exchange. The server checks room capacity, audience membership, school context, and lifecycle state; student IDs are not exposed as participant aliases.

The live provider adapter currently reports a truthful scheduled-only state. The system will not mark a room live or admit a participant until a verified provider adapter, room identifier, admission/removal integration, recording policy, and callback verification are implemented and configured. This source increment therefore does not claim working audio/video, low-latency streaming, recording, captions, automated moderation, or provider delivery. Those remain deployment- and provider-dependent workstreams.


## Increment: Live provider-readiness and callback foundation

The live-room foundation now has a provider-neutral readiness contract with an explicit server-only configuration for provider name, private API key and secret, public client URL, webhook secret, and adapter readiness. Live streaming remains disabled unless all required configuration exists and an operator deliberately enables the adapter-ready flag.

The current provider fit assessment uses LiveKit-compatible contracts: approved rooms receive an opaque provider room name, student participants receive an opaque provider identity, and a short-lived join token can be issued only after the server verifies the student’s active enrollment, room audience, waiting-room admission, live room state, and provider readiness. Tokens do not contain student names, emails, admission numbers, or other personally identifiable information.

A signed provider webhook endpoint now validates the raw request body, signed authorization token, and payload hash before processing. Provider events are stored in an idempotency ledger so retries do not double-apply state. Verified room-started, room-finished, participant-joined, participant-left, and connection-aborted events reconcile the corresponding school-scoped DOONO room and participant state and create audit entries.

This increment does not claim that a provider account, client SDK, provider room API, production webhook URL, recording storage, or live audio/video service is configured. The explicit adapter-ready switch must remain false until those items are provisioned, tested, and approved under the school safeguarding policy. LiveKit documents server-signed tokens, room-scoped grants, participant removal, and signed webhooks; DOONO’s implementation follows those security boundaries but still requires a real deployment validation.


## Increment: Guarded browser room client

The frontend now includes a shared LiveRoomSession component backed by the installed LiveKit browser client. It never receives provider credentials. Instead, an admitted student requests a short-lived token from the DOONO API; the API repeats the active enrollment, room audience, room status, participant admission, and provider-readiness checks before issuing it.

The client displays loading, connected, reconnecting, disconnected, and error states; renders only tracks delivered by the approved room; and provides an explicit Leave room action that disconnects the session and cleans up listeners. Students remain subscribe-only in the server-issued token contract. The page keeps the scheduled/provider-not-ready state when the provider is not configured, so a browser dependency cannot create a false live-call experience.

The browser integration is source-level provider readiness only. It does not claim that a LiveKit account, room endpoint, provider webhooks, production certificates, recording policy, or live audio/video delivery has been configured. The adapter-ready flag must remain false until those deployment and safeguarding checks are completed.


## Increment: Live provider diagnostics and operational readiness

Authorized live-room managers now have a non-secret provider diagnostics endpoint and readiness panel. It reports whether the feature is enabled, the supported provider is selected, private and public endpoints exist, server credentials and webhook secret are present, and the explicit adapter-ready switch is enabled. Secret values are never returned to the frontend. The panel also reports the last verified provider callback received when the callback ledger exists.

The live-room guide now explains the administrator checklist: provider account, private credentials, public client URL, signed webhook secret, browser client, recording policy, safeguarding approval, and the deliberate adapter-ready switch. Students are told that a secure five-minute token is requested only after admission and readiness checks, and that the browser displays connection and reconnection states.

Source validation confirms that the diagnostic endpoint remains behind the existing school live-room management permission, while provider callbacks remain unauthenticated only at the transport layer and protected by signed raw-body verification plus idempotency. This increment does not claim that a provider is provisioned or that production audio/video delivery has been tested.


## Increment: Provider room lifecycle adapter

The approved live-room start path now creates the provider room through the LiveKit-compatible Twirp room-service contract before marking the DOONO room live. Provider room creation uses an opaque room name, the DOONO participant limit, bounded empty/departure timeouts, and non-PII metadata. Repeated starts tolerate an already-existing provider room.

The close path now requests provider room deletion before closing the DOONO room and marks active waiting/admitted participants as left. The moderator removal path now requests provider participant removal using a short-lived room-scoped admin token before recording the local removal. Provider 404 responses are treated as idempotent for close/removal; other provider failures prevent the local mutation so the application does not report a successful moderation action that the provider rejected.

The adapter is still disabled unless the explicit readiness configuration, server credentials, public client URL, webhook secret, and supported provider are all present. This is an integration contract and source-level validation only; no provider account, public room service, production webhook, recording pipeline, or live network performance has been verified in this environment.


## Increment: Live-session provider operation reliability

Provider room creation, room closure, and participant removal now pass through a school-scoped provider-operation ledger. Each attempt records a pending, succeeded, or failed state, provider HTTP status when available, a safe generic error message, and timestamps. Raw provider response bodies and credentials are not stored.

Room creation treats an already-existing provider room as idempotent. Provider 404 responses for closure and participant removal are treated as already-completed operations. Network errors and other provider rejections are recorded as failures and prevent the local DOONO mutation from being reported as successful.

The administrator live-room readiness panel now displays up to ten recent provider failures for the current school only, alongside the last verified webhook timestamp. The route remains protected by the existing `manage_live_rooms` permission and the canonical active-school context.

This remains source-level reliability work. It does not prove provider uptime, webhook delivery guarantees, recording durability, live network quality, or production-scale concurrency.


## Increment: Live-room host controls and media moderation

The live-room browser client now supports a distinct assigned-host workflow. A host receives a short-lived publish-capable token only from the protected host-token endpoint, only when the room is live, the host identity matches the room assignment, and the provider is genuinely ready. Students continue to receive subscribe-only tokens after admission.

Hosts can explicitly turn their camera on or off, enable or mute their microphone, and start or stop screen sharing. The client shows a local video preview, remote tracks, connection status, reconnection status, and an explicit Leave room action. The provider grant limits publishing to camera, microphone, screen-share, and screen-share-audio sources; data publishing remains disabled.

Authorized school moderators can mute or unmute all currently published tracks for an admitted participant through the provider room-service API. The operation is school-scoped, requires a live room and admitted participant, is audit-recorded, and reports provider failure without claiming success. Students cannot access host controls or moderator actions.

This increment remains dependent on a verified provider account, public client URL, server credentials, webhook, safeguarding policy, and production browser/device testing. The source validation does not prove microphone, camera, screen-share, or realtime network behavior on end-user devices.


## Increment: Live-room recording consent, private egress, and retention

Recorded rooms now require an approved guardian consent with video permission before a student can request admission, be admitted, or receive a provider token. The consent decision is persisted on the room participant with a timestamp and is checked again at each security boundary.

When recording is explicitly enabled and private output storage is configured, starting a live room requests a LiveKit RoomComposite Egress with MP4 output to the configured server-side S3-compatible storage. The application stores only school-scoped recording metadata, provider egress identity, status, file information, failure message, and expiry date. Egress lifecycle callbacks reconcile starting, recording, stopping, completed, and failed states. Closing a room stops active egress before closing the provider room.

A daily Laravel scheduled command purges completed or failed recordings after their configured retention period and deletes private local/S3 media through the canonical media service. The default retention is 30 days and is bounded by configuration. Recording remains disabled unless the explicit live-room provider and recording gates are configured.

Source checks pass, but this increment does not prove provider egress delivery, S3 permissions, recording quality, encrypted retention, legal-policy compliance, or production deletion execution.
