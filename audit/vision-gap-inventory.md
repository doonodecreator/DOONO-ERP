# DOONO De Creator ERP Vision Gap Inventory

## Verified scope already present

The repository already contains a broad Laravel/Sanctum backend and React/Vite frontend covering organization and school management, academic setup, students, parents, staff, teachers, attendance, finance, subscriptions, results computation, report-card downloads, CBT, assignments, timetable, library, hostel, clinic, transport, reception, communication, invitations, portals, audit logs, email verification, local email, and role-specific dashboards.

The backend uses a single `user_roles` table with school-scoped roles and `CurrentContextService` in the current architecture. The frontend has a shared Axios service, shared layout/form/table/feedback components, role detection through `getPrimaryRoleSlug`, and a large App.jsx page switch.

## Branding findings

The `schools` table already has a base `logo` field and a separate migration adds `report_card_logo`, `principal_signature`, `school_stamp`, `primary_color`, `secondary_color`, `accent_color`, `report_card_theme`, `report_card_layout`, `custom_header`, `custom_footer`, `show_watermark`, `allow_branding`, and `watermark_text`.

`School` has only the base `logo` in `$fillable`; the added branding columns are not mass-assignable. `SchoolController@store` and `@update` validate and persist only base school fields and do not accept branding values. `SchoolResource` exposes only the base `logo`, not the report-card branding fields. No backend upload handler using `UploadedFile`, `hasFile`, or `Storage` was found. Existing request fields named `logo` or `photo` are string paths, not actual upload contracts.

`Settings.jsx` lets a proprietor edit base identity, motto, bank/payment settings, and a platform owner edit global SaaS settings. It has no logo upload, branding editor, report-card theme/layout editor, signature/stamp upload, or report-card preview.

## Report-card findings

Report-card computation and download are present. `ReportCardService` builds the academic payload and renders a fixed `pdf.report-card` Blade view. It does not load or apply school branding fields, academic configuration display flags, report-card theme/layout, custom header/footer, logo, principal signature, school stamp, or watermark settings.

A separate `academic_configurations` table already stores many report presentation flags, including student passport, position, attendance, class average, highest/lowest score, comments, principal signature, school stamp, skills, behaviour, QR verification, and approval workflow flags. The `AcademicConfiguration` model is used by result processing and promotion services, but there is no active API route or frontend editor for this configuration. A separate `academic_settings` table/controller exists with a smaller report layout subset, but `AcademicSettingController` is not registered in `routes/api.php`, creating a duplicated/orphaned settings surface.

`ReportCards.jsx` is currently a report browser/preview/download page. It does not provide a designer, template controls, branding controls, or a branded preview workflow.

## Profile-picture findings

`users` has no profile-picture/avatar field in its `$fillable` list or visible context contract. `AuthController` supports staff profile text updates only: phone, address, date of birth, and qualification. `AuthContext` stores the backend user object but no profile media workflow exists.

`students`, `staff`, and related request/resource classes contain `photo` string fields, but the frontend creation and edit flows do not provide a real file picker, preview, upload endpoint, storage policy, or image validation. The Navbar currently renders initials in a circular placeholder instead of a user profile image. There is no shared account-profile page in App.jsx.

## Routing and permission findings

The API route registry is broad and contains explicit school/platform middleware for most current modules. School settings are proprietor-controlled. Report-card read/download routes exist. There is no route for school branding uploads, profile uploads, report-card configuration editing, report-card template management, or account-profile editing.

The frontend includes many role-specific dashboards and module pages, but no dedicated school-branding workspace, report-card designer, or account/profile settings page. Existing `TeacherProfile`, `StudentProfile`, and `ParentProfile` pages are record-detail pages rather than authenticated self-service profile editors.

## Initial implementation implication

The intended feature set is not missing from the database conceptually; substantial schema exists but is disconnected from controllers, resources, storage, routes, PDF rendering, frontend settings, and profile UX. The safest completion path is to wire the existing branding/configuration model first, add a secure media-storage abstraction and upload contracts, add self-profile support, then integrate a branded report-card preview/download pipeline without replacing the authoritative result computation service.

## Critical report-card rendering finding

`ReportCardService` defaults to the Blade view `pdf.report-card`, but the repository contains no `resources/views/pdf/report-card.blade.php` or other report-card PDF view. The report-card download endpoints therefore point at a missing rendering template and cannot reliably deliver the intended professional branded report card. This must be fixed before treating report-card output as production-ready.

## Implemented completion tranche

The current working tree now includes an idempotent `users.avatar` migration; a reusable tenant-scoped `MediaStorageService`; avatar fields and normalized URLs in the authentication context; a self-service `POST /me/profile` endpoint; secure student and staff image validation/storage; normalized student and staff photo URLs; a school-branding controller and routes; mass-assignable school branding fields; a complete SchoolResource branding payload; a branded `pdf.report-card` Blade view; report-card payload support for school settings, academic display flags, theme, colors, signatures, stamps, watermark, and photo; a multipart profile page; a proprietor School Branding & Report Card Design page with live preview; navigation and guide entries; and photo controls in student/staff edit flows.

The frontend build has passed after the first integration batch, and Blade view compilation has passed. Full migration, database-backed endpoint, PDF download, and mobile browser validation remain outstanding.

## Validation note

The Laravel test suite (5 tests), Blade compilation, route verification, frontend production build, PHP lint, and whitespace checks passed in the sandbox. `php artisan migrate --pretend` could not run because the sandbox environment has no configured MySQL host/database; this is an environment limitation rather than a migration syntax failure. The new migration itself passed PHP lint and is idempotent through `Schema::hasColumn` guards. It must be executed against the configured local or Railway database during deployment.
