# DOONO Higher-Education Expansion Roadmap

**Prepared by Manus AI — 25 August 2026**

## Executive recommendation

DOONO should expand as a **multi-sector education operating system**, not by forcing universities, polytechnics, and colleges of education into the existing primary/secondary workflow. The safest approach is to preserve the current `School` record as the tenant boundary for backward compatibility, add an explicit institution mode, and introduce a separate higher-education academic layer behind that tenant.

The current platform already has valuable reusable foundations: organization and school tenancy, the `user_roles` two-tier RBAC model, `CurrentContextService`, admission and enrollment history, fee and payment settlement, result workflows, student and parent portals, communications, library, transport, AI Tutor, moderated community, curated exchange, and controlled live-room infrastructure. The main problem is not that the entire platform must be replaced. The problem is that the **academic data model is currently K–12-shaped**.

## What the repository proves today

| Current contract | Evidence in the repository | Higher-education implication |
|---|---|---|
| Institution classification | The schools migration restricts `school_type` to `Primary`, `Secondary`, or `Combined`, with `has_primary` and `has_secondary` flags. | Add a non-destructive institution-mode abstraction. Do not put university values into the existing K–12 enum without a migration strategy. |
| Academic periods | The terms migration uses fixed `First Term`, `Second Term`, and `Third Term` values tied to an academic session. | Add flexible academic periods supporting semesters, trimesters, quarters, terms, and custom periods. |
| Learner placement | `StudentEnrollment` is tied to `division_id`, `class_id`, `stream_id`, `academic_session_id`, and `term_id`. | Higher education needs program, level, cohort, campus, course registration, and period-specific enrollment. |
| Learning hierarchy | Classes are under divisions, streams are attached to classes, and subjects are attached through class-subject mapping. | Add faculty → department → program → level → course → course offering → section. Keep the current hierarchy for K–12. |
| Departments | The current department model is shallow and mainly relates departments to subjects. It is not connected to programs, faculty, courses, or student registration. | Treat it as a legacy K–12 helper and introduce a proper higher-education department model or extend it carefully with explicit relationships. |
| Subjects | Subjects have school/division, mark, pass-mark, and maximum-mark fields, but no credit unit, program offering, semester, or transcript identity. | Introduce courses with credits, prerequisites, grading rules, course codes, and offerings. Do not rename existing subjects globally. |
| Results | The existing results and computation engine can support assessment and publication workflows. | Add grade scales, GPA/CGPA, credit attempts, repeats, carryovers, academic standing, transcript versions, and graduation clearance. |
| Tenancy and permissions | School-scoped records and `user_roles` already provide the right security direction. | Reuse them; add institution roles and faculty/department/program scopes rather than adding a second role column. |

## The correct target structure

A higher institution should be represented as an existing DOONO tenant with a selected **institution mode** such as `college_of_education`, `polytechnic`, `university`, `professional_institute`, or `other_higher_education`. The UI may call the tenant an “institution,” while the existing database table can remain `schools` during the compatibility phase.

The academic hierarchy should be generalized as follows:

> **Institution → Campus → Faculty/School → Department → Programme → Level → Course → Course Offering → Class/Section → Registration → Assessment → Result → Transcript**

A college of education may use schools/faculties and departments with NCE programmes. A polytechnic may use schools, departments, ND/HND programmes, industrial training, and course units. A university may use faculties, departments, undergraduate/postgraduate programmes, semesters, course registration, research supervision, and cumulative transcripts. These differences should be represented through configuration and institution mode, not scattered `if university` checks throughout controllers.

## What should be built first

### Phase 1: Institution mode and academic calendar

Add institution mode, campus support, academic calendar type, and flexible academic periods. A period should have a type such as semester, trimester, quarter, or term, with dates, sequence, current status, registration dates, examination dates, and publication status. The existing `terms` table and current K–12 controllers should continue working unchanged for school-mode tenants during the transition.

This phase should also introduce a higher-education setup wizard that asks whether the institution uses faculties, departments, programmes, levels, credits, semesters, trimesters, or custom periods. A university should not be shown a primary-school division/class/stream setup checklist.

### Phase 2: Faculty, department, programme, level, and course catalog

Create explicit school-scoped records for campuses, faculties or schools, departments, programmes, programme versions, levels, courses, course prerequisites, and course offerings. A course offering belongs to a flexible academic period and may have a lecturer, room, capacity, assessment plan, and section.

The existing `Subject` model should remain available for K–12. Higher education should use a separate `Course` concept because a course has credit units, prerequisites, programme applicability, transcript identity, and possibly lecture/practical/tutorial components.

### Phase 3: Admissions and student academic records

Extend admissions so an applicant can apply to a programme, entry level, campus, and admission session. Once accepted, create or link a student profile and an academic placement. Students should be able to have historical programme changes, deferment, withdrawal, transfer, suspension, graduation, and alumni status without destroying earlier registrations or results.

The existing automatic school-scoped admission numbering can remain the identity mechanism, but higher institutions should also have programme/session identifiers and, where required, matriculation numbers. These identifiers must be generated server-side and collision-safe.

### Phase 4: Course registration and assessment

Build course registration with add/drop windows, prerequisite checks, credit-load limits, registration approval, repeat/carryover rules, and a registration snapshot for each academic period. Results must reference the registration or course attempt rather than only a class subject.

The existing result workflow can be reused for continuous assessment, examination entry, approval, publication, and report generation. The higher-education layer must add configurable grade scales, grade points, credit units, GPA, CGPA, academic standing, probation rules, incomplete results, repeats, and transcript publication. Existing K–12 ranking and report-card logic should remain a separate mode.

### Phase 5: Finance, clearance, and institutional operations

Reuse the hardened invoice, payment, reversal, receipt, audit, and subscription foundations. Add programme tuition, per-credit or per-semester fees, accommodation, laboratory and practical fees, examination fees, departmental charges, scholarships, sponsors, instalment plans, refunds, and financial clearance.

A student should not register for a restricted period or download an official transcript when an institution’s configured clearance policy blocks it. This must be a transparent policy workflow with approved exceptions and audit records, not a hidden controller check.

### Phase 6: Higher-education portals and services

Add role-specific workspaces for registrar/admissions, bursary, exams and records, deans, heads of department, lecturers, academic advisers, librarians, hostel officers, ICT administrators, students, and alumni. Reuse the existing shared API client, `CurrentContextService`, school-scoped authorization, audit separation, notifications, AI Tutor, library, transport, community, and live-room controls.

The higher-education student portal should include programme and level, course registration, timetable, fees and clearance, results, GPA/CGPA, transcript requests, announcements, course materials, assignments, examination information, hostel where applicable, and supervised academic collaboration.

## Role model recommendation

Do not add `role` back to the user model. Continue using `user_roles` with `school_id` for school/institution scope. Add higher-education roles such as **Registrar, Deputy Registrar, Bursar, Exams and Records Officer, Dean, Head of Department, Programme Coordinator, Lecturer, Academic Adviser, Librarian, Hostel Officer, ICT Administrator, Student Affairs Officer, Research Supervisor, Student, and Alumni**.

Where finer control is necessary, add explicit scope columns or scope tables for faculty, department, programme, course offering, and campus. A lecturer should see only assigned course offerings; a Head of Department should see the department; a Dean should see the faculty; and a Registrar or institution owner should see the institution. These scopes must be enforced in Laravel queries and policies, not only hidden in the React sidebar.

## What can be reused immediately

| Existing DOONO foundation | Reuse plan |
|---|---|
| `CurrentContextService` | Keep as the single source of current organization, institution, role, permission, and academic context. Extend it with campus/faculty/department context only when those records exist. |
| `user_roles` RBAC | Add higher-education roles and scoped permissions without flattening roles. |
| Student identity and enrollment history | Preserve student profiles, automatic admission numbers, historical placements, and lifecycle audit; add programme and course-attempt relationships. |
| Finance settlement | Reuse invoice locking, payment references, reversals, receipts, and audit logging; add higher-education fee rules. |
| Result workflow | Reuse draft → review → approval → publication controls; add grade points, credits, GPA/CGPA, transcript versions, and academic standing. |
| Communication and notifications | Reuse school-scoped notices and targeted audiences; add faculty, department, programme, course, and registered-student audiences. |
| Library, transport, hostel, AI, community, and live rooms | Reuse the safety and tenancy foundations, then add higher-education eligibility and audience rules. |

## What must not be done

Do not change `school_type` by simply adding `University` and then continue using divisions, classes, streams, and terms everywhere. That would make the system appear to support higher institutions while producing incorrect registration, results, transcripts, and financial records.

Do not use one universal “subject” table for both a primary-school subject and a university course without preserving the different semantics. Do not calculate GPA by guessing from existing percentage results. Do not permit a lecturer to see every student in an institution merely because the lecturer has a generic teacher permission. Do not expose student names internationally through the existing exchange or community discovery mechanisms.

Do not promise accreditation compliance by code alone. Requirements from relevant national and professional regulators vary by jurisdiction and programme. DOONO should provide configurable workflows and exportable evidence, while each institution validates its legal, accreditation, privacy, records-retention, examination, and payment requirements.

## Recommended product packaging

The cleanest commercial model is one DOONO platform with selectable operating modes:

| Mode | Primary academic structure | Main audience |
|---|---|---|
| Basic/primary school | Division → class → stream → subject | Primary and nursery schools |
| Secondary school | Division → class → stream → subject → assessment | Secondary schools |
| College of education | Faculty/school → department → NCE programme → level → course | Colleges of education |
| Polytechnic | School → department → ND/HND programme → level → course/practical | Polytechnics |
| University | Faculty → department → undergraduate/postgraduate programme → level → course | Universities |
| Professional institute | Department/programme → cohort → module/course | Professional and vocational institutions |

The billing and subscription system can expose higher-education modules as plan features, but access enforcement must remain server-side and must not remove the institution’s ability to view its own historical records.

## Practical next build sequence

The first implementation tranche should be **institution mode + flexible academic periods + campus/faculty/department/programme/course catalog**. The second should be **student programme placement and course registration**. The third should be **credit-based results, GPA/CGPA, transcript, and clearance**. Only after those are stable should the project add research supervision, postgraduate workflows, alumni, advanced accreditation exports, or unrestricted external collaboration.

Before building the first tranche, prepare one representative data dictionary for each target type: one college of education, one polytechnic, and one university. Record their academic hierarchy, period structure, grading scale, admission identifiers, registration rules, fee rules, transcript fields, clearance rules, and required reports. Build against those verified examples rather than assumptions.

## Final recommendation

You do not need to abandon DOONO or create a completely separate application. You should **evolve the tenant into a configurable institution**, preserve the existing K–12 mode, and add a properly separated higher-education academic domain. This will let schools, colleges of education, polytechnics, and universities use the same secure operating system while each institution sees only the workflows that match its academic reality.
