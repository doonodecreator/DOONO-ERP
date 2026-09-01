# Parent and Student Portal Audit and Guide Upgrade

## Inspected workflow

DOONO currently provisions portal access from the school’s authenticated Students and Parents directories. An authorized school user opens the exact student or parent record and chooses **Portal account**. The backend then creates a separate Sanctum user account, assigns the school-scoped `student` or `parent` role, links the user to the student or guardian record, and records the action in the school audit log. The staff member supplies the login email and temporary password to the recipient through a private channel.

The recipient does not use a separate portal URL or a special portal password. Both parent and student users sign in through the normal DOONO login page with the exact email and temporary password supplied by the school. The shared frontend reads the backend context, forces the temporary password change before dashboard access, and routes the user by the school-scoped role to the parent or student portal. When email verification is enabled, the same email must be verified before login.

## Parent journey

A parent record is created in the active school, and each child is linked to that parent record separately. One parent account can therefore see multiple children in the same school, but a child will not appear until the school has created the correct parent-student relationship. Staff then creates the parent portal account once. The parent portal loads only the guardian record and child links belonging to the authenticated user and active school. It exposes linked children, class and admission number, school notices, outstanding fee items, payment entry points, and published report cards. Draft or unpublished academic results are not exposed.

## Student journey

A student record is created or admitted in the active school. Staff creates one student portal account for that exact record. The student signs in with the supplied email, changes the temporary password, and then sees only the linked student’s current school information: class, admission number, timetable, assignments, library activity, fees, notices, attendance, CBT access, and published results. A student cannot use the portal to manage school structures, issue official ID cards, approve results, or view another learner’s records.

## Changes applied

The portal-only backend routes were separated from the staff route group. Parent and student endpoints now use authentication, active-school resolution, password-change enforcement, subscription enforcement, and explicit school-scoped `role:parent` or `role:student` middleware. Student portal services retain `portal_student_access`, and parent service routes retain `portal_parent_access`.

The parent portal frontend was corrected to consume the actual backend response shape, which returns class, stream, and division as strings rather than nested objects. It now handles empty linked-child and fee states with shared empty-state UI and displays each child’s admission number. The student portal now explains an unlinked account instead of rendering a misleading placeholder, and its Results tab shows published results within the student portal rather than redirecting to the generic staff results workspace.

The staff provisioning modal now explains the complete account handoff, secure temporary-password handling, verification behavior, and the difference between a parent account and a single-student account.

The guide now includes dedicated parent-portal and student-portal modules, expanded role instructions, an exact portal-account control guide, and searchable Support Centre concepts for portal accounts, parent portals, student portals, linking, password changes, multi-child access, published results, and unlinked-account troubleshooting.

## Validation

The following checks passed after the changes: Laravel PHPUnit suite with 14 tests and 19 assertions, PHP lint for the affected portal controllers, Laravel route compilation, architecture guard, guide validator with 73 registered modules and 55 role guides, and Vite production build with 274 modules. The representative compiled routes show the expected `has.school`, `password.changed`, `subscription`, and `role:parent` or `role:student` middleware.

A live database test using real parent and student accounts is still required after the release is applied. Provider-dependent email delivery cannot be claimed from local source validation; in Termux, the existing local verification configuration determines whether the recipient must verify an email before login.
