import { ARCHITECTURE_MODULES } from "./architectureModules";

const step = (title, detail, action = null) => ({ title, detail, action });

export const ROLE_GUIDES = {
  super_admin: {
    label: "Software Owner",
    intro: "You control the DOONO platform itself. Start with system configuration, then monitor organizations, schools, subscriptions, payments, and audit activity.",
    steps: [
      step("Check platform health", "Review organizations, active schools, subscription status, system settings, and recent audit activity before changing platform-wide settings.", "dashboard"),
      step("Configure the platform", "Set countries, currency, email/SMS test delivery, subscription enforcement, plans, features, and platform notices before onboarding schools.", "settings"),
      step("Manage organizations and schools", "Create or review organizations, open a school only when you need to inspect school data, and keep platform actions separate from school actions.", "organizations"),
      step("Monitor billing", "Review plans, school subscriptions, Paystack payments, renewals, free-access grants, and failed or pending transactions.", "subscriptions"),
      step("Verify accountability", "Use audit logs to trace every platform action. School proprietors should see only their own school activity.", "audit-logs"),
    ],
  },
  organization_owner: {
    label: "Organization Owner",
    intro: "You own an organization and its schools. Use the organization workspace for ownership-level administration, then enter a specific school to manage school operations.",
    steps: [
      step("Review organization overview", "Confirm your organization identity, schools, users, and organization-level reports.", "dashboard"),
      step("Create or open a school", "Create a school with its country, currency, contact details, and owner assignment. Use Manage School to enter that school’s proprietor workspace.", "schools"),
      step("Complete school setup", "Inside a school, establish sessions, terms, divisions, classes, streams, subjects, and the first leadership assignments.", "school-setup"),
      step("Switch context deliberately", "Use the organization control to return to your organization dashboard. Do not confuse organization settings with school settings.", "organization-profile"),
    ],
  },
  proprietor: {
    label: "Proprietor / Proprietress",
    intro: "You own the school’s operations. Complete school setup first, appoint leadership, monitor finance and subscriptions, and delegate daily work without losing oversight.",
    steps: [
      step("Finish the school foundation", "Create the active session and term, divisions, classes, streams, and subjects before inviting staff or entering results.", "school-setup"),
      step("Assign leadership securely", "Invite principals, vice principals, heads, teachers, bursars, and other staff by verified email. Form teachers must be linked to a specific class or stream.", "role-invitations"),
      step("Open operational modules", "Use students, staff, fees, timetable, communication, results, CBT, library, clinic, hostel, transport, and other modules according to your permissions.", "dashboard"),
      step("Control money and access", "Review fee configuration, payments, expenses, subscription renewal, free-access status, and audit logs from the school context.", "fees"),
      step("Review outcomes", "Approve or monitor results, report cards, promotions, CBT publication, and school notices before parents and students see final information.", "results"),
    ],
  },
  principal: {
    label: "Principal",
    intro: "You are the school’s academic and operational approver. Review setup, staff assignments, communication, results, and final publication before information reaches families.",
    steps: [
      step("Review the school dashboard", "Start with pending admissions, attendance, staff tasks, timetable issues, result submissions, and notices.", "dashboard"),
      step("Confirm academic readiness", "Check that the active session, term, classes, streams, subjects, and teacher assignments are complete.", "school-setup"),
      step("Approve academic work", "Review submitted results, approve only after checking the marksheet, and publish only when the final result is ready.", "results"),
      step("Communicate clearly", "Publish school notices to the correct audience and take them down or republish them when circumstances change.", "communication"),
      step("Protect school records", "Use audit logs and staff management for accountability, while keeping platform-owner actions outside the school audit view.", "audit-logs"),
    ],
  },
  vice_principal_academic: {
    label: "Vice Principal Academic",
    intro: "You coordinate academic structures, teacher assignments, assessments, timetable, results, promotions, report cards, and CBT readiness.",
    steps: [
      step("Check academic structure", "Confirm classes, streams, subjects, active session, term, and staff subject/class assignments.", "subjects"),
      step("Build the timetable", "Assign teachers, subjects, classes, times, breaks, and term dates before students begin lessons.", "timetable"),
      step("Manage assessment entry", "Ensure assessment structures are configured within a 100% weight budget, then monitor teacher CA and exam submissions.", "result-entry"),
      step("Review results", "Approve valid result submissions, reopen only for controlled corrections, publish only after all required subject work is complete.", "results"),
      step("Manage CBT and reporting", "Approve question banks, assemble CBT tests, review outcomes, and monitor promotions and report cards.", "cbt"),
    ],
  },
  vice_principal_admin: {
    label: "Vice Principal Administration",
    intro: "You coordinate school administration, staff employment, attendance, discipline, safety, communication, facilities, and front-desk operations.",
    steps: [
      step("Review staffing", "Confirm staff records, employment status, role assignments, and pending invitations.", "staff"),
      step("Monitor daily administration", "Check staff attendance, leave requests, visitor records, incidents, discipline, and safety tasks.", "staff-attendance"),
      step("Coordinate services", "Review facilities, inventory, transport, hostel, clinic, library, and front-desk issues according to your permissions.", "school-facilities"),
      step("Communicate actions", "Send targeted notices and confirm that the selected audience is appropriate before publishing.", "communication"),
    ],
  },
  nursery_head: {
    label: "Nursery Head",
    intro: "You manage nursery learners, teachers, attendance, class activities, communication, and early-years academic follow-up.",
    steps: [
      step("Confirm nursery classes", "Review nursery divisions, classes, streams, subject assignments, and active learners.", "classes"),
      step("Monitor teachers and attendance", "Check assigned teachers and confirm daily attendance is recorded for every nursery class.", "attendance"),
      step("Follow learner progress", "Review assignments, assessment entry, behaviour notes, and communication sent to families.", "assignments"),
      step("Review term outcomes", "Check approved results and published report cards before discussing performance with parents.", "report-cards"),
    ],
  },
  primary_headmaster: {
    label: "Primary Headmaster",
    intro: "You manage primary academic delivery, teacher assignments, attendance, assessment, results, promotion, and parent communication.",
    steps: [
      step("Verify primary structure", "Confirm primary classes, streams, subjects, active learners, and form-teacher assignments.", "classes"),
      step("Coordinate delivery", "Review timetable, attendance, assignments, and teacher workload for each primary class.", "timetable"),
      step("Control assessment", "Monitor CA/exam score entry, CBT readiness, result submissions, and corrections.", "results"),
      step("Complete the term", "Approve results, verify positions and promotion status, and publish report cards only when final.", "report-cards"),
    ],
  },
  secondary_principal: {
    label: "Secondary Principal",
    intro: "You manage secondary academic delivery, external-exam readiness, CBT, results, promotion, and school-wide communication.",
    steps: [
      step("Check secondary readiness", "Review classes, streams, subjects, teachers, timetable, and examination schedule.", "examinations"),
      step("Manage assessment delivery", "Coordinate CA, examination scores, CBT question banks, CBT assessments, and external-exam records.", "cbt"),
      step("Approve results", "Review result submissions, confirm computations and rankings, then approve and publish the final result.", "results"),
      step("Close the academic cycle", "Review report cards, promotion, graduation, and parent/student communication.", "report-cards"),
    ],
  },
  accountant: {
    label: "Accountant",
    intro: "You manage financial records and reporting. Keep fee configuration, receipts, expenses, payroll, budgets, and reports accurate and school-scoped.",
    steps: [
      step("Configure financial foundations", "Confirm fee categories, class-specific fees, student invoices, discounts, and payment channels.", "fees"),
      step("Reconcile payments", "Match Paystack and manual payments to the correct student invoice and investigate pending or duplicate transactions.", "fees-payments"),
      step("Record expenses and payroll", "Maintain approved expenses, budgets, payroll, and supporting records.", "expenses"),
      step("Review reports", "Use financial reports and audit logs to reconcile collections, balances, and changes.", "financial-reports"),
    ],
  },
  bursar: {
    label: "Bursar / Cashier",
    intro: "You receive and reconcile school fee payments. Every payment must be attached to the correct student and invoice before issuing confirmation.",
    steps: [
      step("Find the correct student", "Search by student name or admission number and confirm the school, class, parent, and outstanding invoice.", "students"),
      step("Receive payment", "Record or verify the exact invoice payment. Never create an unallocated payment when the student invoice is unknown.", "fees-payments"),
      step("Check payment status", "Review transaction reference, Paystack state, receipt status, and duplicate-payment protection.", "fees-payments"),
      step("Reconcile daily", "Compare collections with payment records and report failed, pending, reversed, or suspicious transactions.", "financial-reports"),
    ],
  },
  librarian: {
    label: "Librarian",
    intro: "You manage the school catalogue, physical-copy inventory, active student members, loans, returns, reservations, and overdue follow-up.",
    steps: [
      step("Build the catalogue", "Add each book with its title, author, category, ISBN where available, total copies, and available copies. The available count is the stock that can currently be issued.", "books"),
      step("Confirm current members", "Library workspaces and issue forms use active students with an active school enrollment. A graduated, transferred, withdrawn, or historical student must not receive a new loan or reservation.", "library-members"),
      step("Issue and return books", "Select the exact student and book, set the due date, and save the loan. Returning a borrowed copy restores availability automatically; the completed loan remains as history for accountability.", "library-members"),
      step("Handle reservations", "Create or review a pending reservation only for a valid book and actively enrolled student. Fulfil, cancel, or expire the pending record instead of deleting its history.", "library-members"),
      step("Monitor usage", "Review overdue and borrowed records, reconcile the available-copy count, and use the student portal feed to confirm each learner sees only their own school library activity.", "library-members"),
    ],
  },
  nurse: {
    label: "Nurse",
    intro: "You manage confidential school health records, clinic visits, medical history, incidents, and follow-up actions.",
    steps: [
      step("Find the correct learner", "Confirm the student profile, school, class, parent contact, and emergency information before recording care.", "students"),
      step("Record a clinic visit", "Document symptoms, observations, treatment, referral, guardian notification, and follow-up without exposing unrelated records.", "clinic"),
      step("Maintain medical history", "Keep medical records current and review previous visits before making a new entry.", "clinic"),
      step("Escalate safety issues", "Record incidents and notify the appropriate school leadership when a matter requires follow-up.", "safety-incidents"),
    ],
  },
  hostel_master: {
    label: "Hostel Master",
    intro: "You manage boarding houses, beds, occupancy, residents, movements, and hostel incidents.",
    steps: [
      step("Configure hostel spaces", "Create houses, rooms, beds, capacity, and supervisors before assigning residents.", "hostels"),
      step("Assign residents", "Place only active students into available beds and confirm their class and guardian information.", "hostels"),
      step("Monitor occupancy", "Review available beds, transfers, check-in/out activity, and incidents.", "hostels"),
      step("Report exceptions", "Record welfare or safety issues and notify school leadership promptly.", "safety-incidents"),
    ],
  },
  hostel_mistress: {
    label: "Hostel Mistress",
    intro: "You manage girls’ boarding operations, resident welfare, room allocation, attendance, and incidents.",
    steps: [
      step("Review resident setup", "Confirm houses, rooms, beds, and active female resident assignments.", "hostels"),
      step("Track daily welfare", "Review hostel attendance, movements, health concerns, and incidents.", "hostels"),
      step("Maintain safe records", "Keep student and guardian information accurate and escalate safeguarding concerns through the proper channel.", "safety-incidents"),
    ],
  },
  transport_manager: {
    label: "Transport Manager",
    intro: "You manage school vehicles, safety inspections, routes, ordered stops, student allocations, and family-facing transport visibility.",
    steps: [
      step("Register transport assets", "Add the school-owned vehicle number, model, seating capacity, driver, phone number, and service status. Vehicle records are isolated to the active school.", "transport"),
      step("Prove vehicle readiness", "Record the inspection result for each vehicle. A route can carry students only when its vehicle is not in maintenance or inactive status and its latest inspection is Passed and not past its next due date.", "transport"),
      step("Create routes and stops", "Create a named route, optionally leave it unassigned while setup is in progress, then assign a ready vehicle and add ordered pickup/drop-off stops with times and addresses.", "transport"),
      step("Assign riders safely", "Select an active student with an active enrollment, a transport-ready route, and a pickup point. DOONO blocks duplicate active allocations and refuses allocations once the vehicle capacity is full.", "transport"),
      step("Monitor family visibility", "Parents and students see only active allocations linked to their own account in the current school. Use the route name, vehicle number, pickup point, and status shown in tracking to answer transport questions.", "transport"),
      step("Record exceptions", "When a vehicle fails inspection or transport changes, update the operational record and send a school-scoped notice through Communication. Allocation history and route/vehicle audit events remain available for review.", "communication"),
    ],
  },
  receptionist: {
    label: "Receptionist",
    intro: "You manage the front desk, visitors, enquiries, messages, and safe handoff of information.",
    steps: [
      step("Register visitors", "Record visitor identity, purpose, host, time in, badge, and time out.", "visitors"),
      step("Find records carefully", "Search students, parents, and staff without exposing information outside your permission.", "students"),
      step("Record enquiries", "Log follow-up requests and route them to the correct department.", "messages"),
      step("Escalate incidents", "Report safety or urgent welfare issues to the appropriate leader immediately.", "safety-incidents"),
    ],
  },
  registrar: {
    label: "Registrar",
    intro: "You manage admissions, student records, enrollment, class placement, and parent links.",
    steps: [
      step("Create an admission", "Enter the learner’s identity, guardian details, contacts, and documents. Do not type an admission number; DOONO assigns the permanent school-scoped number automatically after creation.", "admissions"),
      step("Enroll the learner", "Assign the correct school, session, term, class, stream, and status.", "student-enrollments"),
      step("Connect the parent", "Create or select the parent account and link every child correctly, especially when a parent has multiple children.", "parents"),
      step("Verify the record", "Review duplicates, missing documents, class placement, and portal-account status before completion.", "students"),
    ],
  },
  guidance_counselor: {
    label: "Guidance Counselor",
    intro: "You support learner welfare, behaviour follow-up, communication, referrals, and confidential student care.",
    steps: [
      step("Review the learner context", "Confirm the student profile, class, guardian contacts, attendance, and relevant incidents before opening a case.", "students"),
      step("Record a case", "Document the concern, intervention, referral, action owner, follow-up date, and resolution securely.", "discipline-cases"),
      step("Coordinate support", "Use communication and safety workflows when a case requires parent, nurse, hostel, or leadership involvement.", "communication"),
    ],
  },
  store_keeper: {
    label: "Store Keeper",
    intro: "You manage school assets, stock, issues, returns, suppliers, and inventory accountability.",
    steps: [
      step("Register assets", "Create items with category, quantity, condition, location, and ownership details.", "asset-register"),
      step("Record movement", "Document stock received, issued, returned, damaged, transferred, or disposed.", "asset-register"),
      step("Review exceptions", "Track low stock, missing assets, and unresolved discrepancies for the responsible leader.", "financial-reports"),
    ],
  },
  ict_administrator: {
    label: "ICT Administrator",
    intro: "You support users, devices, system access, communication tools, and technical readiness without changing school data beyond your permissions.",
    steps: [
      step("Review access", "Confirm staff invitations, portal accounts, password-reset needs, and role assignments.", "staff"),
      step("Check system services", "Review email/SMS test delivery, system health, audit logs, and connectivity indicators.", "system-health"),
      step("Support users safely", "Use the guide, error messages, and audit trail to diagnose issues before changing records.", "messages"),
    ],
  },
  security_officer: {
    label: "Security Officer",
    intro: "You manage visitor safety, incidents, access records, and escalation of urgent security events.",
    steps: [
      step("Register access", "Record visitor details, host, purpose, badge, entry time, and exit time.", "visitors"),
      step("Record incidents", "Document what happened, people involved, location, immediate action, and escalation.", "safety-incidents"),
      step("Follow up", "Keep incident status and leadership notifications current until resolution.", "communication"),
    ],
  },
  teacher: {
    label: "Teacher",
    intro: "You work only with classes and subjects assigned to you. Your main cycle is timetable → attendance → assignments → scores → feedback, with AI assistance available for planning but not for replacing professional judgment.",
    steps: [
      step("Check assignments", "Open your assigned classes and subjects. You should not create school-wide classes or unrelated subjects.", "classes"),
      step("Teach the timetable", "Use the timetable to see class, subject, start time, end time, and daily workload.", "timetable"),
      step("Record attendance", "Mark the correct class and date, then review missing or late attendance entries.", "attendance"),
      step("Give assignments", "Publish instructions, due dates, attachments, and class targets; then review submissions.", "assignments"),
      step("Enter results", "Select your assigned class and subject, enter every configured component, save, and submit for academic approval.", "result-entry"),
    ],
  },
  form_teacher: {
    label: "Form Teacher",
    intro: "You lead a specific form class. Your work combines class attendance, learner welfare, communication, assessment coordination, form-level records, and supervised student safety.",
    steps: [
      step("Open your assigned form", "Confirm the class and stream assigned to you. Do not enter another form’s records.", "classes"),
      step("Track the class daily", "Record attendance, review discipline or welfare concerns, and follow up with parents where required.", "attendance"),
      step("Coordinate academic work", "Monitor assignments, scores, teacher submissions, and missing records for your form.", "results"),
      step("Support final reporting", "Review class comments, report-card readiness, and parent communication before publication.", "report-cards"),
    ],
  },
  parent: {
    label: "Parent / Guardian",
    intro: "Your parent portal is created by authorized school staff and is linked to one parent record in one active school. The school must connect every child to that parent record before the family can see all children.",
    steps: [
      step("Complete account handoff", "Use the exact email and temporary password supplied by the school on the normal DOONO login page. Change the temporary password immediately and verify the email when the school has verification enabled.", "dashboard"),
      step("Choose a child", "If you have more than one child in the school, confirm the correct child card before reviewing that child’s fee, report, class, or admission information. Every child must have been linked separately by the school.", "dashboard"),
      step("Follow school activity", "Read the school notices and review each linked child’s class, stream, and admission number. Use the portal sections that your school has enabled for family services.", "dashboard"),
      step("Pay the correct invoice", "Open the child’s exact outstanding fee item, verify the amount and student identity, and complete the available payment flow.", "fees-payments"),
      step("View final outcomes", "Parents see results and report cards only after the school completes approval and final publication.", "report-cards"),
    ],
  },
  student: {
    label: "Student",
    intro: "Your student portal is a private learning workspace linked by school staff to one student record. Sign in with the exact supplied email, change the temporary password, and use only the records shown for your own active enrollment.",
    steps: [
      step("Complete account handoff", "Use the email and temporary password supplied by the school on the normal DOONO login page. Change the temporary password immediately and verify the email when the school has verification enabled. If the page says your profile is not linked, contact the school instead of creating another account.", "dashboard"),
      step("Check your learning day", "Use timetable, notices, assignments, and attendance to plan your school work.", "timetable"),
      step("Submit classwork", "Open assignments, read instructions, upload the required work, and confirm submission status.", "assignments"),
      step("Use learning sections", "Open Timetable, Assignments, Results, and Library from the student portal tabs. Only records published or assigned to your own active enrollment should appear.", "dashboard"),
      step("Use school services", "Review your library loans, fee information, attendance summary, notices, and other services linked to your student account. If your school exposes CBT from a separate student link, start only published tests and submit before time expires.", "library"),
      step("Read final results", "Your result and report card appear only after the school approves and publishes the official final outcome.", "results"),
      step("Use the AI Tutor safely", "Ask DOONO Tutor to explain a lesson, practise questions, or help you plan revision. Do not enter passwords, private records, or another learner’s information; the Tutor gives guidance and cannot change official grades.", "ai-tutor"),
      step("Participate respectfully", "Student Community is a school-moderated learning space. Posts and comments are reviewed before they appear, and you should report bullying, unsafe content, privacy problems, or anything that makes you uncomfortable.", "student-community"),
      step("Join approved projects", "Project Exchange is a curated space, not unrestricted social media. Join only a project approved by your school, use the learner alias shown by DOONO, and remember that international participation requires school opt-in and guardian consent.", "exchange"),
      step("Join a live learning room safely", "Open an approved room, read its purpose and time, then request admission. You enter a waiting room first; a school moderator must admit you, and no audio or video starts until the verified provider is ready.", "live-rooms"),
    ],
  },
};

const roleProfile = ({ definition, purpose, worksWith, canDo, cannotDo, workflow, firstChecks }) => ({
  definition,
  primaryPurpose: purpose,
  worksWith,
  canDo,
  cannotDo,
  dailyWorkflow: workflow,
  firstChecks,
});

export const ROLE_DETAILS = {
  super_admin: roleProfile({
    definition: "The Software Owner role manages the DOONO platform itself, not one school’s ordinary daily work. This is a platform-wide role and must remain separate from school-scoped roles.",
    purpose: "Keep the platform safe, available, correctly configured, financially sustainable, and accountable for every organization using it.",
    worksWith: "Organizations, school owners, subscriptions, platform settings, support cases, platform integrations, and platform audit records.",
    canDo: ["Create and manage organizations and schools at platform level.", "Configure plans, coupons, promo campaigns, free-access rules, system settings, feature flags, and platform notices.", "Review platform payments, system health, backups, support requests, and platform audit activity.", "Enter a school context only when a support or administration task requires it."],
    cannotDo: ["Treat a platform action as a school action or hide it from the platform audit trail.", "Give a school staff member the super_admin role through an ordinary school invitation.", "Assume that provider-dependent email, SMS, backup, AI, or live-room integrations work without readiness checks."],
    workflow: ["Check platform health and failed jobs.", "Review organizations, schools, subscriptions, and support requests.", "Make the smallest controlled configuration change.", "Verify the resulting audit entry and service status.", "Communicate material changes to affected school owners."],
    firstChecks: "Confirm that you are in the platform context and that the action is genuinely platform-wide before changing it."
  }),
  organization_owner: roleProfile({
    definition: "The Organization Owner owns an organization that may contain one or more schools. This role handles ownership and organization administration; school operations happen only after entering a specific school context.",
    purpose: "Maintain the organization identity, schools, organization users, billing relationship, and ownership decisions.",
    worksWith: "Organization profile, school list, organization users, organization reports, billing, and school context switching.",
    canDo: ["Create and open schools belonging to the organization.", "Manage organization profile and organization-level users where permitted.", "Review organization reports and billing information.", "Enter a selected school and work through the Proprietor school context."],
    cannotDo: ["See or manage another organization’s schools.", "Mix organization settings with a school’s academic, student, or finance records.", "Use the organization context to bypass school-scoped permissions."],
    workflow: ["Review the organization dashboard.", "Create or select the correct school.", "Use Manage School to enter that tenant.", "Complete school setup and operations there.", "Return to the organization context when finished."],
    firstChecks: "Read the organization and school name in the header before creating or changing anything."
  }),
  proprietor: roleProfile({
    definition: "The Proprietor or Proprietress is the owner or accountable operator of one school. The role has the broadest school-scoped authority, but it is still not a platform super-admin role.",
    purpose: "Establish the school, appoint trusted staff, control school configuration and finance, and supervise the quality of academic and operational records.",
    worksWith: "School setup, staff employment, role invitations, academic structures, fees, results, subscriptions, branding, audit logs, and school operations.",
    canDo: ["Complete sessions, terms, divisions, classes, streams, subjects, and school branding.", "Invite staff below the Proprietor’s authority and assign a Form Teacher to a specific class or stream.", "Manage school finance, fees, payments, reports, subscriptions, and school settings.", "Suspend or terminate staff through the employment workflow while preserving history.", "Review the school audit log, which excludes Software Owner platform actions."],
    cannotDo: ["Invite or create a super_admin or organization_owner through a school staff invitation.", "See another school’s records merely because the user owns one school.", "Publish unfinished results, expose draft report cards, or delete records that require correction or reversal history."],
    workflow: ["Complete the school foundation.", "Appoint leadership and finance staff.", "Open academic, finance, communication, and welfare workflows.", "Review approvals and exceptions.", "Use audit logs and reports to confirm that delegated work is complete."],
    firstChecks: "Confirm the selected school, current session, current term, and your delegated staff authority before acting."
  }),
  principal: roleProfile({
    definition: "The Principal is the school’s senior day-to-day academic and operational leader. The role reviews and approves important work but does not own platform billing or the Software Owner’s settings.",
    purpose: "Make sure teaching, admissions, staff activity, communication, results, and school operations are properly reviewed before becoming official.",
    worksWith: "Vice principals, heads, teachers, registrar, bursar, parents, students, and the Proprietor.",
    canDo: ["Review staff, students, admissions, attendance, timetable, finance summaries, communication, and results.", "Approve admissions, results, promotions, and timetables where the school workflow grants that authority.", "Publish or take down school notices through the communication workflow.", "Review school activity without seeing Software Owner platform actions."],
    cannotDo: ["Invite another Principal or a role at or above the Principal’s authority.", "Change platform plans, coupons, system settings, or another school’s records.", "Enter or alter a teacher’s marks outside the approved result correction workflow."],
    workflow: ["Read the dashboard’s pending items.", "Check academic and operational readiness.", "Review submitted work and supporting records.", "Approve or reject with a reason.", "Publish only after completeness checks."],
    firstChecks: "Verify that the session, term, class, and approval status belong to the school you are currently managing."
  }),
  vice_principal_academic: roleProfile({
    definition: "The Vice Principal Academic coordinates the school’s teaching and assessment system. This role prepares and reviews academic work but does not replace the final approver where approval is required.",
    purpose: "Keep academic structures, teacher assignments, timetables, assessments, results, promotions, and report cards ready and accurate.",
    worksWith: "Heads of section, teachers, Form Teachers, exam officers, Principal, students, and parents through published outcomes.",
    canDo: ["Manage academic structures, attendance, assessment activities, result entry, report-card preparation, and CBT readiness according to permission.", "Coordinate teacher subject/class assignments and timetable preparation.", "Review submitted scores and reopen controlled corrections where authorized.", "Prepare promotion and report-card workflows for approval."],
    cannotDo: ["Change school ownership, subscriptions, or platform settings.", "Approve your own work where the workflow requires an independent reviewer.", "Give a teacher access to an unrelated class or subject."],
    workflow: ["Confirm the academic foundation.", "Assign subjects and build the timetable.", "Configure assessment weights.", "Monitor teacher score submissions.", "Review and forward complete work for approval."],
    firstChecks: "Check the active session, term, assessment structure, and teacher assignment before opening an academic record."
  }),
  vice_principal_admin: roleProfile({
    definition: "The Vice Principal Administration coordinates the non-academic daily administration of the school, including staff attendance, discipline, safety, facilities, and front-desk operations.",
    purpose: "Keep people, facilities, incidents, visitors, services, and administrative follow-up organized and safe.",
    worksWith: "Principal, Proprietor, receptionist, security officer, store keeper, transport, hostel, clinic, and staff.",
    canDo: ["Review or manage staff attendance, leave, discipline, safety, facilities, inventory, front desk, and administrative communication as permitted.", "Follow up on visitors, incidents, assets, and service exceptions.", "Escalate urgent welfare or security matters to school leadership."],
    cannotDo: ["Approve academic results or change score records unless separately assigned an academic role.", "Change subscriptions, platform settings, or another school’s administration.", "Treat an incident note as a substitute for the required safeguarding escalation."],
    workflow: ["Check staff attendance and pending administration.", "Review visitor, discipline, safety, and facility exceptions.", "Assign follow-up responsibility.", "Confirm closure and preserve the record."],
    firstChecks: "Confirm whether the matter is an administration, academic, finance, health, or safeguarding workflow before acting."
  }),
  nursery_head: roleProfile({
    definition: "The Nursery Head leads early-years classes and staff within the nursery section. The role focuses on age-appropriate care, attendance, activities, assessment, and family communication.",
    purpose: "Make sure nursery learners are safely registered, supported, taught, observed, and reported on.",
    worksWith: "Nursery teachers, Form Teachers, parents, nurse, guidance staff, and school leadership.",
    canDo: ["Review nursery classes, streams, learners, attendance, assignments, assessments, communication, and report cards according to permission.", "Follow up missing attendance or learner welfare concerns.", "Coordinate nursery readiness with the Principal and academic leadership."],
    cannotDo: ["Change the whole-school structure or another division’s records without permission.", "Publish a result that has not passed the school approval process.", "Access unrelated health or family information beyond the minimum needed for the work."],
    workflow: ["Check nursery rosters and staff assignments.", "Monitor daily attendance and activities.", "Follow learner progress and concerns.", "Review approved outcomes and communicate appropriately."],
    firstChecks: "Select the nursery class, stream, current term, and active learner roster before reviewing a child."
  }),
  primary_headmaster: roleProfile({
    definition: "The Primary Headmaster leads primary teaching and learner administration. The role coordinates teachers, classes, attendance, assessment, promotion, and parent-facing outcomes for the primary section.",
    purpose: "Keep primary delivery and term completion consistent across classes and streams.",
    worksWith: "Primary teachers, Form Teachers, academic leadership, parents, and the Principal.",
    canDo: ["Review primary classes, streams, subjects, timetable, attendance, assignments, results, promotions, and report cards according to permission.", "Follow up incomplete teacher records and class-level issues.", "Support approved communication to primary families."],
    cannotDo: ["Create a result outside the assigned class and subject workflow.", "Change platform or subscription settings.", "Treat a draft or unapproved report card as a final family result."],
    workflow: ["Verify primary structure and assignments.", "Monitor daily teaching and attendance.", "Check assessment and result completeness.", "Review promotion and final report-card readiness."],
    firstChecks: "Confirm the primary class, stream, current term, and approval status before reviewing a result."
  }),
  secondary_principal: roleProfile({
    definition: "The Secondary Principal leads secondary academic delivery, examination readiness, CBT coordination, results, promotion, and communication for the secondary section.",
    purpose: "Ensure secondary learners receive an organized academic cycle and that examination outcomes are reviewed before publication.",
    worksWith: "Secondary teachers, Form Teachers, exam officers, Vice Principal Academic, Principal, parents, and students.",
    canDo: ["Coordinate secondary classes, timetable, assessment, CBT, results, promotions, and reports according to permission.", "Review subject submissions and examination readiness.", "Escalate missing or suspicious academic records before approval."],
    cannotDo: ["Change a published result silently or bypass reopen-and-reapprove controls.", "Grant a teacher access to another subject or class.", "Manage platform plans, organization settings, or unrelated school tenants."],
    workflow: ["Check examination and timetable readiness.", "Monitor CA, examination, and CBT submissions.", "Review computations and rankings.", "Approve and publish only the final complete outcome."],
    firstChecks: "Confirm the secondary class, subject coverage, assessment weights, and result submission state."
  }),
  accountant: roleProfile({
    definition: "The Accountant maintains the school’s financial records and reports. The role protects accuracy and reconciliation but does not automatically receive the Bursar’s cash-receiving authority.",
    purpose: "Keep invoices, payments, expenses, payroll, budgets, revenue, and reports complete and reconciled.",
    worksWith: "Bursar, Proprietor, Principal, parents, payment providers, payroll staff, and auditors.",
    canDo: ["View revenue and finance reports, manage payroll and budgets where assigned, and reconcile financial records.", "Investigate pending, failed, reversed, duplicate, or unmatched payment transactions.", "Use school-scoped reports to identify balances and exceptions."],
    cannotDo: ["Assume that viewing a payment report permits receiving cash or changing an invoice.", "Delete payment history to hide an error.", "Approve a refund or platform payment outside the authorized review workflow."],
    workflow: ["Confirm the academic period and school.", "Reconcile invoices with payment records.", "Review expenses, payroll, and budgets.", "Investigate exceptions.", "Close the period with a clear report."],
    firstChecks: "Confirm the school, invoice number, payment reference, currency, and transaction status before reconciling."
  }),
  bursar: roleProfile({
    definition: "The Bursar or Cashier receives school payments and records them against exact student invoices. The role handles money carefully but should not change academic or platform records.",
    purpose: "Collect, receipt, and reconcile payments without assigning money to the wrong learner, invoice, or school.",
    worksWith: "Parents, students, Accountant, Proprietor, payment provider, and finance reports.",
    canDo: ["Find the correct student invoice and record authorized manual payments.", "Review payment status, receipts, references, balances, and reconciliation outcomes.", "Report suspicious, pending, failed, reversed, or duplicate transactions."],
    cannotDo: ["Record an unallocated payment when the student or invoice is unknown.", "Change a student’s class, result, or parent link to resolve a payment problem.", "Assume that a pending gateway transaction is successful."],
    workflow: ["Identify the student and exact invoice.", "Verify amount, currency, and payment method.", "Record or confirm the payment once.", "Provide the receipt.", "Reconcile exceptions before closing the day."],
    firstChecks: "Verify student name, admission number, invoice number, outstanding balance, and transaction reference."
  }),
  librarian: roleProfile({
    definition: "The Librarian manages the school’s book catalogue, physical copies, loans, reservations, returns, and overdue follow-up.",
    purpose: "Make learning materials available while preserving accurate stock and borrower history.",
    worksWith: "Students, teachers, parents where relevant, school leadership, and the library inventory.",
    canDo: ["Create catalogue records and maintain total and available copies.", "Issue, return, reserve, fulfil, cancel, and follow up library items for actively enrolled learners.", "Review overdue and lost-item history."],
    cannotDo: ["Issue a new loan to a student who is inactive, graduated, withdrawn, transferred, or outside the school.", "Delete a loan to remove an overdue history.", "Expose one student’s library activity to another student."],
    workflow: ["Keep the catalogue accurate.", "Confirm the active learner and school.", "Issue or reserve the exact copy.", "Record return, loss, or damage.", "Review overdue exceptions."],
    firstChecks: "Confirm the active student enrollment and available-copy count before issuing or reserving a book."
  }),
  nurse: roleProfile({
    definition: "The Nurse manages confidential learner health and clinic information. This is a sensitive role: access should be limited to what is needed for care and safety.",
    purpose: "Record care accurately, support emergencies, protect health privacy, and coordinate follow-up.",
    worksWith: "Students, parents or guardians, guidance staff, hostel staff, safety officers, and school leadership.",
    canDo: ["Maintain medical profiles, clinic visits, treatment, referrals, emergency flags, and follow-up records.", "Notify authorized guardians or leaders through the correct communication path.", "Escalate urgent health or safeguarding matters."],
    cannotDo: ["Share medical details in a general school notice.", "Use health access to browse unrelated student or financial records.", "Delete a clinical history that should remain available for care and accountability."],
    workflow: ["Confirm the student identity.", "Review relevant history.", "Record the minimum necessary care information.", "Escalate or refer when needed.", "Set and follow the review date."],
    firstChecks: "Confirm the student, school, emergency information, and the confidentiality level of the record."
  }),
  hostel_master: roleProfile({
    definition: "The Hostel Master manages boarding facilities, rooms, beds, male or mixed resident operations, movements, occupancy, and hostel welfare.",
    purpose: "Keep boarding placement and resident welfare accurate, safe, and capacity-aware.",
    worksWith: "Boarding students, parents, nurse, security, guidance staff, Proprietor, and school leadership.",
    canDo: ["Configure hostel blocks, rooms, beds, supervisors, allocations, occupancy, and movements.", "Assign only eligible active students to available beds.", "Record incidents and escalate welfare concerns."],
    cannotDo: ["Assign a student to an occupied bed or outside the school.", "Treat a hostel allocation as proof of admission or fee payment.", "Ignore a safety or health escalation because the student is in boarding."],
    workflow: ["Confirm room and bed capacity.", "Verify the active student and guardian details.", "Create or update the allocation.", "Monitor occupancy and movements.", "Escalate exceptions."],
    firstChecks: "Check active enrollment, boarding eligibility, room type, bed availability, and guardian information."
  }),
  hostel_mistress: roleProfile({
    definition: "The Hostel Mistress manages girls’ boarding operations, resident welfare, room allocation, movements, attendance, and safeguarding follow-up.",
    purpose: "Provide an accurate and safe residential record for female learners and escalate welfare matters quickly.",
    worksWith: "Female boarding students, parents, nurse, guidance staff, security, Hostel Master, and school leadership.",
    canDo: ["Review and manage assigned hostel spaces, resident allocations, movements, welfare notes, and incidents.", "Follow up attendance, health, and safeguarding concerns through approved workflows.", "Maintain accurate resident and guardian information."],
    cannotDo: ["Share sensitive welfare details in general communication.", "Assign a bed without checking capacity and active enrollment.", "Close an incident without recording the follow-up outcome."],
    workflow: ["Review resident setup.", "Check daily welfare and movements.", "Record concerns factually.", "Coordinate care or escalation.", "Confirm resolution and preserve history."],
    firstChecks: "Confirm the resident’s active enrollment, hostel placement, emergency contact, and confidentiality needs."
  }),
  transport_manager: roleProfile({
    definition: "The Transport Manager operates school vehicles, routes, stops, inspections, rider allocations, capacity, and family-facing transport information.",
    purpose: "Move learners safely and maintain a traceable transport operation.",
    worksWith: "Drivers, parents, students, reception, security, Proprietor, and school administration.",
    canDo: ["Register vehicles, record inspections, create routes and ordered stops, and allocate active students.", "Monitor vehicle readiness, capacity, route occupancy, and allocation history.", "Communicate transport exceptions through school-scoped notices."],
    cannotDo: ["Allocate a student to a vehicle that fails inspection, is inactive, or is full.", "Expose another family’s route or pickup information.", "Treat a route record as evidence that a vehicle inspection passed."],
    workflow: ["Check vehicle status and latest inspection.", "Maintain routes and stops.", "Confirm active enrollment and pickup point.", "Allocate within capacity.", "Record changes and communicate exceptions."],
    firstChecks: "Confirm the school, vehicle readiness, inspection due date, route capacity, and student enrollment."
  }),
  receptionist: roleProfile({
    definition: "The Receptionist is the school’s front-desk record keeper for visitors, enquiries, appointments, messages, and safe information handoff.",
    purpose: "Make the school entrance and first contact organized, respectful, and safe.",
    worksWith: "Visitors, parents, students, staff, security, Principal, and the responsible department.",
    canDo: ["Register visitors, check visitors in and out, schedule appointments, and record enquiries.", "Search permitted identity records to route a request correctly.", "Escalate safety, welfare, or urgent communication issues."],
    cannotDo: ["Disclose private student, health, finance, or staff information to an unverified visitor.", "Change academic, payment, or employment records merely because someone asks at the desk.", "Close a safety incident without the responsible officer’s follow-up."],
    workflow: ["Verify the visitor or requester.", "Record the purpose and host.", "Issue the appropriate handoff or badge.", "Record completion or exit.", "Escalate unresolved matters."],
    firstChecks: "Confirm identity, purpose, host, school context, and whether the request contains sensitive information."
  }),
  registrar: roleProfile({
    definition: "The Registrar manages admissions and the official learner record from application or intake through placement, parent linking, and enrollment history.",
    purpose: "Create one accurate student identity and place the learner in the correct school academic context.",
    worksWith: "Applicants, parents, students, teachers, Principal, Proprietor, and academic records.",
    canDo: ["Create admissions, review documents, assign enrollment placement, link parents, and maintain student records according to permission.", "Use the automatic admission-number workflow.", "Correct placement through authorized enrollment or lifecycle workflows."],
    cannotDo: ["Invent or manually overwrite an admission number in the ordinary admission form.", "Create duplicate student or parent accounts because a link is missing.", "Change a published academic result as a shortcut for correcting an admission record."],
    workflow: ["Verify identity and guardian information.", "Choose the correct session, term, division, class, and stream.", "Complete the admission.", "Record the automatic admission number.", "Link the parent and verify the portal state."],
    firstChecks: "Confirm duplicate risk, school context, academic period, placement, documents, and guardian contact."
  }),
  guidance_counselor: roleProfile({
    definition: "The Guidance Counselor supports learner welfare, behaviour follow-up, referrals, communication, and confidential interventions.",
    purpose: "Help learners receive appropriate support while keeping sensitive case information limited and accountable.",
    worksWith: "Students, parents, teachers, Form Teachers, nurse, hostel staff, Principal, and safeguarding leads.",
    canDo: ["Open and manage discipline or support cases, interventions, referrals, action owners, and follow-up dates.", "Coordinate with guardians and responsible school staff through permitted communication.", "Escalate serious welfare or safety concerns."],
    cannotDo: ["Publish sensitive case details in a general notice.", "Treat a private case note as a final disciplinary decision without the required authority.", "Delete a case to remove an uncomfortable history."],
    workflow: ["Understand the learner context.", "Record the concern factually.", "Agree an intervention or referral.", "Set a follow-up date.", "Record outcome or escalate."],
    firstChecks: "Confirm the student identity, active school, confidentiality level, and required safeguarding route."
  }),
  store_keeper: roleProfile({
    definition: "The Store Keeper manages school stock and assets, including receipt, issue, return, condition, location, and discrepancy follow-up.",
    purpose: "Keep physical resources traceable from purchase or receipt to current location and final disposition.",
    worksWith: "Proprietor, Principal, Accountant, teachers, departments, suppliers, and service staff.",
    canDo: ["Register assets, record stock movement, track condition, and review low-stock or missing-item exceptions.", "Document issued, returned, damaged, transferred, lost, or disposed items.", "Provide inventory evidence for finance and administration."],
    cannotDo: ["Remove an asset history just because an item is missing.", "Record a disposal without the school’s approval process.", "Change student, fee, or result records to explain an inventory discrepancy."],
    workflow: ["Receive and identify the item.", "Record quantity, condition, and location.", "Record each issue or movement.", "Reconcile counts.", "Escalate discrepancies."],
    firstChecks: "Confirm item identity, quantity, condition, location, custodian, and supporting reference."
  }),
  ict_administrator: roleProfile({
    definition: "The ICT Administrator supports technical access, user accounts, devices, service readiness, and troubleshooting. The role is not automatically an academic or finance administrator.",
    purpose: "Keep users connected to the correct systems while protecting credentials, school data, and service configuration.",
    worksWith: "All school users, Proprietor, Principal, support staff, email/SMS providers, and platform support.",
    canDo: ["Review invitations, portal-account problems, connectivity indicators, service readiness, and communication configuration according to permission.", "Help users follow the guide and provide safe troubleshooting evidence.", "Escalate provider, backup, queue, or storage failures."],
    cannotDo: ["Ask for or store another user’s password or one-time code.", "Use technical access to browse unrelated student, health, or financial records.", "Enable an untested provider or bypass school permissions to make a button appear available."],
    workflow: ["Reproduce the problem safely.", "Check context, role, permission, network, and service status.", "Read the exact error.", "Apply the smallest approved fix.", "Record or escalate the incident."],
    firstChecks: "Confirm the user, school context, role, browser/device, endpoint, timestamp, and exact error without collecting secrets."
  }),
  security_officer: roleProfile({
    definition: "The Security Officer manages entry records, visitor safety, incidents, access checks, and urgent security escalation.",
    purpose: "Protect people and school property through accurate access and incident records.",
    worksWith: "Receptionist, Principal, Vice Principal Admin, parents, visitors, staff, students, and emergency contacts.",
    canDo: ["Record visitor identity, host, purpose, badge, entry, exit, incidents, immediate action, and escalation.", "Follow the status of an incident until the responsible leader closes it.", "Use only the identity details needed for a safe access decision."],
    cannotDo: ["Share incident or student details with an unverified person.", "Erase an access record because an incident was resolved.", "Replace medical, discipline, or safeguarding professionals when escalation is required."],
    workflow: ["Verify entry information.", "Record access or refusal.", "Document incidents factually.", "Notify the responsible leader.", "Update status until closure."],
    firstChecks: "Confirm identity, location, time, immediate risk, and escalation path before recording or sharing information."
  }),
  teacher: roleProfile({
    definition: "The Teacher delivers lessons and assessments for the classes and subjects assigned to them. A teacher is not a school-structure administrator by default.",
    purpose: "Teach assigned learners, record attendance, distribute work, enter accurate scores, and provide useful feedback.",
    worksWith: "Students, Form Teachers, Heads, Vice Principal Academic, Principal, parents through approved channels, and assigned subjects.",
    canDo: ["View assigned timetable lessons, mark attendance for permitted class groups, publish assignments, and enter scores for assigned subjects.", "Use approved CBT question and assessment workflows where the role is granted access.", "Review assigned learner work and provide feedback."],
    cannotDo: ["Create or change school-wide classes, divisions, streams, or unrelated subjects.", "Enter another teacher’s subject or class results.", "Approve or publish official results unless separately assigned that authority."],
    workflow: ["Check assigned classes and subjects.", "Follow the timetable.", "Record attendance.", "Publish assignments and review submissions.", "Enter, save, and submit scores for approval."],
    firstChecks: "Confirm assigned class, stream, subject, current session, current term, and assessment structure before entering data."
  }),
  form_teacher: roleProfile({
    definition: "The Form Teacher is the pastoral and daily-record lead for one specific class or stream. The role is class-bound, not a license to manage every class.",
    purpose: "Keep one form’s attendance, welfare, communication, coordination, and class-level records complete.",
    worksWith: "Learners in the assigned form, subject teachers, parents, guidance staff, school heads, and the Principal.",
    canDo: ["Manage attendance and class-level follow-up for the assigned class or stream.", "Coordinate missing assignments, scores, comments, welfare issues, and parent communication for that form.", "Review class report-card readiness according to permission."],
    cannotDo: ["Open another form’s roster or mark another stream’s attendance.", "Invite staff or change the school structure unless separately assigned another role.", "Publish a final result simply because the class is assigned to them."],
    workflow: ["Confirm the assigned class and stream.", "Track the form daily.", "Follow up missing records and welfare concerns.", "Coordinate subject teachers.", "Review class readiness before final publication."],
    firstChecks: "Confirm the exact class-and-stream assignment shown by the school before recording attendance or follow-up."
  }),
  parent: roleProfile({
    definition: "The Parent or Guardian portal role belongs to an adult linked by the school to one or more children in one active school. It is a family-view role, not a staff role.",
    purpose: "Follow linked children’s notices, attendance, fees, assignments, transport, and published results without seeing unrelated learners.",
    worksWith: "The school, linked children, teachers through approved communication, finance, and published portal records.",
    canDo: ["Select among children that the school has linked to the same parent record.", "View permitted notices, fee balances, payment history, attendance, assignments, transport, and published report cards.", "Submit supported parent actions such as leave requests or payments for the correct child."],
    cannotDo: ["Add a child to the portal by creating a second account.", "See another family’s child, draft result, private health note, or staff record.", "Edit classes, subjects, scores, fees, or school settings."],
    workflow: ["Sign in with the exact supplied email.", "Change the temporary password and verify when required.", "Choose the correct child.", "Review the relevant service.", "Contact the school when a link or record is missing."],
    firstChecks: "Confirm the child name, school, class, invoice, and publication status before acting."
  }),
  student: roleProfile({
    definition: "The Student portal role belongs to one learner record linked by the school. It is a private learning workspace, not an administrative staff account.",
    purpose: "Help the learner follow their own timetable, assignments, attendance, library, CBT, notices, fees, and published results.",
    worksWith: "Teachers, Form Teacher, parents or guardians, school support, and the learner’s own active enrollment.",
    canDo: ["View and use learning activities assigned to the student’s active enrollment.", "Submit assignments, answer approved CBT tests, view permitted library and fee information, and read published results.", "Use AI Tutor, moderated community, approved exchange, and live learning rooms only when the school enables them and the safeguards allow it."],
    cannotDo: ["View another learner or school, edit academic structures, approve results, issue an ID card, or see draft results.", "Create another account to solve a missing student link.", "Share passwords, private records, unsafe videos, or another learner’s information."],
    workflow: ["Sign in with the exact school-supplied email.", "Change the temporary password and verify when required.", "Check timetable and assignments.", "Submit work and monitor feedback.", "Read results only after official publication."],
    firstChecks: "Confirm your name, school, class, and active enrollment. Contact the school if the profile is unlinked."
  }),
};

const MODULE_DETAILS = {
  dashboard: { purpose: "Your role-specific starting point.", steps: ["Read pending tasks and alerts first.", "Use dashboard action buttons to open the relevant workspace.", "Return here after completing a workflow to confirm the metric changed.", "If a metric does not change, check the selected school, active session, permissions, and the saved record before trying again."], next: "Follow the first incomplete task rather than opening unrelated modules." },
  "support-centre": { purpose: "A tracked place to learn DOONO, report a problem, and follow the answer until it is resolved.", steps: ["Search the help cards using simple words such as login, fees, results, timetable, or invitation.", "Read the role and module explanation before changing a record; it tells you what must already exist and what should happen next.", "If the guide does not solve the problem, select Ask for support.", "Write the exact screen, steps taken, expected result, actual result, error message, school, and approximate time; never include a password or full payment-card details.", "Keep the ticket reference so the same issue is not submitted repeatedly, and reply to questions inside the ticket."], next: "Check My support requests until the status is resolved or closed. For urgent safety or payment matters, contact the responsible institution immediately as well as opening a ticket." },
  "work-inbox": { purpose: "A role-safe list of real actions that need your attention in the current organization or school context.", steps: ["Open Work Inbox after signing in; the list is generated from real setup records, approvals, invitations, unread notifications, pending leave requests, and communication delivery failures.", "Read the priority and record count before opening a workspace. High priority items normally block a school workflow; medium items require follow-up but may not block today’s work.", "Open the linked workspace and complete the action there. The inbox does not create a second version of the record and does not replace the module’s permission checks.", "Refresh after completing an action. The item disappears only when its real underlying status changes or the prerequisite is completed.", "If the list is empty, that means no known action is pending for this context; it does not mean that every future task is complete.", "If an item seems wrong, confirm the active school, role, permission, session, and term, then send the exact item and error to Support Centre."], next: "Open the linked workspace, complete the real action, then refresh the inbox." },
  notifications: { purpose: "Context-scoped messages and alerts delivered to your account.", steps: ["Open Notifications to read the message title, full body, time, and unread state.", "Unread notifications belong only to your account and current organization or school context; changing school context changes which notifications are visible.", "Use Mark read after understanding the message. The notification bell and Work Inbox unread task count will update after the real read action succeeds.", "Use Work Inbox for actions that require you to open another workspace, and Notifications for the message details behind the alert.", "If a notice is missing, confirm the intended audience, active school, notification preference, and publication or delivery status before reporting a problem."], next: "Work Inbox, Notification Preferences, or the module named in the notice." },
  "global-search": { purpose: "A safe cross-module search for records that your current role is allowed to view.", steps: ["Enter at least two characters: a student name or admission number, parent or guardian name, staff number, email, phone, enrollment name, result identity, school name, or school code.", "Choose a record type when you want fewer results. All available searches are automatically limited to the current organization or school context.", "Review the record type and supporting details before opening a workspace. When a supported record is opened, DOONO carries only its type and identifier to the destination, then the destination fetches the permitted record again; the search shortcut never grants a new permission.", "Students open Student 360. Parents open the authorized parent directory and then the parent profile. Staff open the staff directory; a proprietor with employment permission can continue to the edit screen, while other roles remain in the view-only directory. Enrollment and result searches open their existing workspaces without inventing a detail endpoint.", "If the record has moved schools, was deleted, or is no longer permitted, the destination will not open it. Confirm the active school, spelling, permission, and whether the record was actually saved. A different school context will not appear in this search.", "Never use global search to look for passwords, payment-card data, medical notes, or other hidden credentials; those fields are intentionally not searchable."], next: "Open the linked workspace and use its normal record filters to continue." },
  profile: { purpose: "Your authenticated identity across DOONO De Creator ERP.", steps: ["Confirm that the email shown belongs to you.", "Update your display name when it changes.", "Choose a clear JPG, PNG, or WebP profile picture if needed.", "Save and confirm that the header avatar changes.", "Log out and sign in again if testing a new device."], next: "Return to your role dashboard." },
  "school-branding": { purpose: "The proprietor workspace for school identity and official report-card design.", steps: ["Confirm that the active school is the school you intend to brand.", "Upload the school logo and optional report-card logo, principal signature, and school stamp.", "Choose the school colors, report-card theme, and layout.", "Select only the report-card sections your school actually publishes.", "Add approved custom header or footer text and save the design.", "Open Report Cards and download a published report to verify the final PDF."], next: "Report Cards and Communication." },
  "school-setup": { purpose: "The school foundation that makes every other module selectable and ready for daily operations.", steps: ["Create or confirm the academic session and mark the intended session as current; a historical session alone does not make the school ready.", "Create the term and dates under that session, then mark the intended term as current.", "Create divisions, classes, streams, and subjects only after the academic foundation exists.", "Assign staff and leadership after the structures exist. Delegated setup permissions let an approved Principal or Vice Principal Academic manage only the setup areas explicitly granted by the Proprietor.", "Reopen the setup checklist and confirm every item is complete. The checklist reads real records; marking a step understood does not create the missing session, class, subject, or staff assignment."], next: "Academic sessions → Terms → Divisions → Classes → Streams → Subjects → Staff assignments." },
  admissions: { purpose: "Create a learner record and first active enrollment in the active school.", whyItMatters: "Admission is the beginning of the learner’s official history. It connects identity, photograph, automatic admission number, academic placement, parent linking, fees, results, report cards, and future searches into one record.", beforeYouStart: "Have the learner’s official name, date of birth, admission date, clear profile photo if available, guardian details, and correct session, term, division, class, and stream ready. Confirm that the learner is not already registered in this school.", steps: ["Confirm the organization, school, academic session, term, division, class, and stream before starting; these choices decide which school records the learner will enter.", "Enter the learner’s official identity, date of birth, admission date, and optional health or origin information.", "Upload a clear front-facing JPG, PNG, or WebP profile photo if the school wants it on the ID card. Check the preview before continuing.", "Do not type an admission number. DOONO creates the official number automatically after the admission succeeds, using the school’s collision-safe sequence.", "Review the success screen and write down the issued number. It is the learner’s permanent identifier for the ID card, invoices, report cards, transcript, and future searches.", "The admission transaction creates one Active enrollment for the selected term. If the student already has that session/term placement, DOONO rejects the duplicate rather than creating a second roster record.", "Confirm the learner appears in Students, verify the saved photo, generate a test ID card, and then link the correct parent or guardian account. A parent with multiple children must have each child linked separately to the correct learner record."], next: "Students → Edit Student or ID card → Parents / Parent Portal.", controls: ["Use the student photo field for the learner’s identity photograph, not a school logo or document scan.", "Use Complete Admission only after checking placement and the photo preview.", "Do not invent an admission number; the school sequence creates it after a successful save.", "If the ID card shows initials, edit the student, save the photo, and generate the card again."], successSignals: ["The success page displays a newly generated admission number.", "The student appears in the Students Directory with the correct class and stream.", "The saved profile photo is visible when the student record is reopened.", "The generated ID card shows the learner’s photograph instead of initials.", "The correct parent link can be created without creating a duplicate student."] },
  "parent-portal": { purpose: "The private family workspace for a parent or guardian to follow every child linked to that parent record in the active school.", steps: ["The school first creates the parent record and links each child through Parents or Link Student to Parent. A parent with two children needs two child links; one link does not automatically include another child.", "From the parent record, an authorized staff member selects Create Parent Portal Account, confirms the parent’s real email, sets a temporary password, and records the relationship.", "The staff member gives the login email and temporary password to the parent securely. Do not send the password in a public group or store it in an exposed message.", "The parent opens the normal DOONO sign-in page, enters the exact invited email and temporary password, and changes the temporary password when DOONO requests it. If email verification is enabled, the parent must verify that same email before signing in.", "After login, the parent portal shows only linked children in the active school. The parent can review school notices, each child’s class and admission number, outstanding fee items, payments, and published report cards. Draft or unpublished results remain hidden.", "If an existing parent portal account is later given a new child link, corrected relationship, or removed child link, DOONO synchronizes the guardian portal graph from the canonical parent-child records automatically.", "If a child is missing, the parent should not create a second account. The school must open the correct parent record and add the missing child link."], next: "Parent Portal → choose My Children → open Fees Breakdown or a published report card." },
  "student-portal": { purpose: "The private learner workspace for one student account linked to one active student record.", steps: ["The school first creates or opens the student record and selects Create Student Portal Account. The login email must belong to the intended student or the responsible family handoff.", "The school gives the login email and temporary password securely. The student uses the same email at the normal DOONO sign-in page; a different email creates an invalid-login or unlinked-account problem.", "On first login, the student changes the temporary password. If verification is enabled, the student completes verification before using the portal.", "The student portal then loads the student’s own class and admission number, timetable, published notices, assigned work, library activity, fees, CBT tests, attendance summary, and published results according to the school’s current records.", "A student cannot choose another child, view another school, issue an ID card, edit school structures, approve results, or see draft/unpublished final results.", "If the page says Student profile not linked, the login is valid but the account is not connected to a student row. The school administrator must link the account from that exact student record; signing in repeatedly will not fix the missing link."], next: "Student Portal → Overview → Timetable → Assignments → Results → Library." },
  students: { purpose: "School-scoped learner records, current placement, permanent admission identity, and permission-filtered Student 360 review.", steps: ["Search by name or the permanent admission number.", "Confirm the active school, lifecycle status, and current enrollment.", "Edit identity and health details here, but do not change class placement, session, admission number, or lifecycle status from the ordinary profile form.", "Open Student 360 only when you need the authorized combined view of identity, enrollment history, attendance, published results, fees, and assignments.", "Use Promotion / Graduation for movement to another session, repetition, transfer, or graduation."], next: "Parents, Student Enrollments, or Promotion / Graduation." },
  "student-enrollments": { purpose: "The term-level academic placement history that connects a student to a session, term, division, class, stream, and lifecycle status.", steps: ["Create an enrollment only after the student, school, academic session, term, division, class, and optional stream are verified.", "New ordinary placements are always Active. DOONO prevents a duplicate enrollment for the same student, academic session, and term.", "Use Promotion / Graduation for promotion, repetition, transfer, withdrawal, or graduation instead of changing lifecycle status manually in this form.", "Ordinary enrollment edits can correct placement details but cannot change the student or lifecycle status. The authorized lifecycle workflow preserves the official history.", "When a new session and term become current, DOONO synchronizes the active target enrollment into the student’s current placement.", "Keep old enrollments because invoices, attendance, results, report cards, and transcripts point to the historical enrollment that produced them."], next: "Promotion / Graduation, Results, Fees & Payments, or Student 360." },
  promotions: { purpose: "The official end-of-session decision workflow that turns a reviewed academic outcome into a new placement or a terminal state.", steps: ["Select the exact student and verify that the source session, division, class, and stream match the student’s active enrollment.", "Select the target session and destination division, class, and stream for a promoted or repeated learner. The target session must already have terms.", "Choose Promoted when the learner moves to the destination placement, or Repeated when the learner stays at the selected repeat placement; DOONO creates one target enrollment for every term in the target session.", "Choose Transferred only when the learner is leaving the school; DOONO closes the source active enrollment and marks the student transferred without creating a new school enrollment.", "Choose Graduated only for a completed final-school outcome; DOONO closes active enrollments, marks the student Graduated, creates the graduation history record, and ends active learning access.", "Do not delete an official lifecycle decision. The record is permanent academic history; only its date or remarks can be corrected through the limited edit action."], next: "Student Enrollments, Graduation & Alumni, or published Report Cards." },
  graduation: { purpose: "The official graduation and alumni register that closes active student learning while preserving certificates and historical records.", steps: ["Select the exact student and final academic session; verify the admission number before completing the record.", "Use Pending when the school is preparing the record but the learner is still active. Pending does not close enrollment or portal access.", "Use Graduated or Alumni only when the school has approved the final outcome. DOONO marks the student Graduated and closes active enrollments in one transaction.", "Add the certificate number, graduation date, destination, and notes when they are available; these details belong to the official alumni record, not the ordinary student profile.", "After completion, the student cannot use active timetable, assignment, CBT, or leave workflows. Linked parents and authorized staff retain permitted historical records, including published report cards.", "Completed graduation history cannot be deleted. Correct missing certificate or destination details instead of removing the official record."], next: "Report Cards, Student 360, or the linked Parent Portal." },
  parents: { purpose: "Parent profiles and multi-child portal relationships.", steps: ["Create or open the parent profile.", "Link each child to the correct school enrollment; one link does not automatically include siblings.", "Verify the parent email before portal handoff and create one parent portal account for that parent record.", "After login, ask the parent to review each linked child card and report any missing child to the school rather than creating a second account."], next: "Parent Portal, Fees & Payments, or Communication." },
  staff: { purpose: "School staff employment, role, and assignment records.", steps: ["Create or open the staff record.", "Assign only a role appropriate to the school.", "Use invitations for verified email-based acceptance.", "Assign classes or form-teacher responsibilities where required.", "Suspend or terminate employment through the employment action, not by deleting history."], next: "Role Invitations or Timetable." },
  "role-invitations": { purpose: "Securely assign school-scoped staff roles through verified invitations and controlled employment authority.", steps: ["Only the school Proprietor can open this workspace, invite role holders, revoke pending invitations, or manage employment actions. A Principal cannot invite another Principal or grant a role at or above the Principal’s authority.", "Select the exact available school role. Platform roles, organization owners, Proprietors, parent accounts, and student accounts cannot be issued through a school staff invitation.", "For Form Teacher invitations, select the exact class and optional stream. Acceptance creates the active form-teacher assignment for that class; it is not a random teacher assignment.", "Send the one-time link to the intended email address. The invitee accepts it, sets up the account, completes the configured verification or first-password process, and signs in with that same email.", "Use the staff directory after acceptance to confirm the employment record and role. An active Principal or Vice Principal Academic may receive only the setup permissions the Proprietor explicitly delegates.", "When a staff member leaves or must be suspended, the Proprietor changes the employment status or terminates the employment. DOONO revokes that school’s role access and tokens while preserving employment and academic history."], next: "Staff Directory." },
  timetable: { purpose: "The term-wide schedule for classes, students, and teachers with controlled publication.", steps: ["Confirm the active session and term.", "Create periods, breaks, and special calendar entries.", "Assign the correct class, subject, teacher, start time, and end time.", "Resolve teacher, class, and room collision messages.", "Save the entry as draft, then submit it. An approver cannot approve a draft; the required order is draft → submitted → approved → published.", "If an approved or published entry is edited, DOONO returns it to draft and clears the previous approval so the changed schedule is reviewed again.", "Confirm students see only published entries for their class and teachers see only published lessons assigned to them. Whole-school breaks and events follow their configured audience."], next: "Attendance or Results." },
  attendance: { purpose: "Daily attendance for the correct school, current active enrollment, class or stream, date, and learner group, with immutable history for authorized corrections.", steps: ["Choose the date, current session, term, and assigned class. The roster is built from active enrollment records only; graduated, transferred, withdrawn, or historical placements cannot be marked as a current register.", "If you are a teacher assigned to one stream, select the exact class-and-stream option. The backend checks that every submitted row belongs to that active stream and rejects a whole-class payload that exceeds your teaching scope.", "Mark present, absent, late, or excused status.", "Save and review the summary before leaving the page. A failed or offline save is shown as an error or queued synchronization state, not silently treated as a completed server update.", "When changing a saved record, enter a clear correction reason; unchanged resubmissions do not create duplicate correction history, and every changed row keeps its before-and-after record.", "An absent status can create one preference-aware in-app alert for each linked parent portal user; duplicate register submissions do not duplicate that alert.", "Use the attendance record history endpoint when investigating who changed a saved status."], next: "Assignments or Student 360." },
  leave: { purpose: "Staff and student leave requests reviewed in the correct school context.", steps: ["Submit a request for the correct staff member or linked active student, with dates and a clear reason.", "School-scoped Proprietor, Principal, or Vice Principal Admin roles review staff and student leave requests; a platform-wide role is not assumed to grant school review authority.", "A requester cannot approve their own staff leave request.", "Only Pending requests can be approved, rejected, or cancelled. Once decided, the record remains history and cannot be reviewed again.", "If a parent cannot see or submit a student request, verify the child link, active student status, current school, and portal account rather than creating a duplicate child or account."], next: "Staff Attendance, Parent Portal, or Student Portal." },
  assignments: { purpose: "Teacher-to-class work distribution and student submissions.", steps: ["Choose the assigned class and subject.", "Write clear instructions and a due date.", "Attach supporting material when needed.", "Save as draft while preparing or publish when the instructions are ready.", "Students see only published work for their current class and stream, can type an answer, and can attach a file.", "Review submissions, note whether work is late, return corrections, or record a grade and feedback."], next: "Results or Communication." },
  "result-entry": { purpose: "The official component-based score sheet for continuous assessment and examination marks.", steps: ["Choose the assigned class, subject, session, and term. Teachers are limited to their assigned timetable class and subject; form teachers are limited to their assigned form class.", "Review the active assessment structures and maximum marks before entering marks.", "Enter every component for every learner; values are checked against maximum marks and the computed total and grade are rebuilt by the backend.", "Save and submit the sheet for approval. If you return later, DOONO resumes the existing class/subject/session/term submission and restores saved component scores instead of creating a duplicate.", "A submitted, approved, or published sheet is read-only in Result Entry. An authorized reviewer must reopen it with a reason before correction.", "If a class has no students or assessment structures, resolve that setup prerequisite first; the empty state is an explanation, not a broken score table."], next: "Results Management." },
  results: { purpose: "Submission review, approval, reopening, and official publication.", steps: ["Open the submitted class/subject sheet.", "Check component totals, grades, missing learners, and anomalies.", "Approve only after academic review.", "Publish only when all required subject submissions are complete.", "Reopen with a reason when a correction is genuinely required."], next: "Report Cards." },
  "report-cards": { purpose: "Final term summaries, positions, publication status, verification links, and downloadable reports.", steps: ["Confirm the correct session, term, and class filters.", "Review draft cards as authorized staff work in progress, but do not treat them as final results.", "Wait for every required subject submission to be approved and published; the computation engine then marks the student summary and report card published and assigns verification data.", "Review total, average, position, grade, remarks, and promotion status after publication.", "Download or share only after the report card is marked Published. Draft cards intentionally show Available after publish and cannot be downloaded or exposed through parent/student portals."], next: "Communication." },
  "school-insights": { purpose: "Explainable attendance and published-result summaries for authorized school leadership.", steps: ["Confirm that the active school is the school you intend to review.", "Read the factual cards before reading the review warnings.", "Treat every warning as a request for human review, not as a final decision or accusation.", "Open the underlying academic or attendance workspace to verify the records.", "Record the intervention and review the same period again after new data is published."], next: "Attendance, Results Management, or Support Centre if the underlying records look incorrect." },
  "feature-flags": { purpose: "A super-admin control room for safely releasing optional capabilities to the platform, one organization, or one school.", steps: ["Create a lowercase flag key and explain the feature it controls.", "Choose platform, organization, or school scope; a school override takes precedence over an organization override, which takes precedence over the platform default.", "Use a rollout percentage for staged release and enable the flag only when the feature is real and tested.", "Check the affected workspace after enabling it, then reduce the rollout or disable the flag immediately if a verified problem appears.", "Do not use feature flags to bypass subscription entitlements, permissions, tenant boundaries, or approval workflows."], next: "System Health, Audit Logs, or Support Centre when investigating a rollout." },
  "notification-preferences": { purpose: "Your personal control over how DOONO sends notices and other supported notifications.", steps: ["Use Global preferences when the same choice should apply across your account.", "Use Active school preferences only when one school needs a different setting.", "Keep In-app enabled if you want the notification bell to show school notices.", "Turn on email, SMS, or push only when that channel is configured and you consent to receive it.", "If a message disappears, check this page before assuming the school failed to send it; school-specific settings override global settings."], next: "Notifications or Support Centre." },
  cbt: { purpose: "Approved question-bank authoring for computer-based tests.", steps: ["Create questions with one correct answer, valid options, subject, section, topic, difficulty, and marks.", "Submit questions for leadership review.", "Correct rejected questions and resubmit them.", "Do not delete questions already used in an assessment; deactivate them instead."], next: "CBT Assessments." },
  "cbt-assessments": { purpose: "Assemble and operate a timed CBT test.", steps: ["Select one class, subject, session, and term.", "Choose only approved questions for that subject.", "Set duration, pass mark, maximum attempts, availability window, shuffle, and result weight.", "Publish the test when ready.", "Close it after the test window, send results for review, then wait for official approval before final publication."], next: "Results Management." },
  fees: { purpose: "School fee structures, class rules, invoice generation, discounts, and student balances.", steps: ["Create a fee structure in Fees & Payments and select the exact academic session, term, division, and class. A saved structure is a billing rule; it is not yet an invoice sent to a student.", "Review the configured structure and confirm the amount, category, active state, class, session, and term before generating anything.", "Select Generate invoices on the configured row. DOONO creates invoices only for active enrollments in that class and session, maps the structure to a valid school fee category, and does not duplicate an existing matching invoice.", "Read the success or empty result message. Zero new invoices means there are no active enrollments, no active matching structure, or matching invoices already exist; it is not a silent failure.", "Open the invoice list to verify the student, invoice number, amount due, and status, then confirm the parent portal shows the correct child balance.", "Apply discounts through the invoice workflow and never delete historical payment records. If a fee structure is inactive, it cannot generate new invoices."], next: "Fees & Payments → Payment logs or Student Invoices." },
  "fees-payments": { purpose: "Invoice-specific fee collection, receipt history, and reconciliation.", steps: ["Use Fees to generate invoices from an active class fee structure before expecting an invoice to appear.", "Open the exact student invoice and verify the child, class, fee category, amount, and outstanding balance.", "Start Paystack or record an authorized manual payment against that exact invoice; the backend rejects zero, over-balance, cross-school, and unallocated payments.", "Use the transaction reference to verify status and keep the receipt returned by the system. Repeating the same valid reference is idempotent; reusing it for another amount or invoice is rejected.", "Treat pending payments as unresolved until verified. Reversed payments are excluded from the live balance, their receipts are cancelled, and their records remain visible for audit.", "Use Payment logs to reconcile the learner, invoice number, receipt, amount, current balance, method, and reversal state, then use Financial Reports for the school-wide balance."], next: "Financial Reports." },
  subscriptions: { purpose: "School subscription status, plans, trial, renewal, upgrade, and free-access controls.", steps: ["Review the current school status and expiry date.", "Choose a plan that fits the school.", "Start or renew Paystack checkout.", "Verify the transaction before assuming access changed.", "Platform-wide and school-specific free access are controlled separately by the Software Owner."], next: "Audit Logs." },
  communication: { purpose: "School-scoped notices and targeted communication with visible publication and delivery state.", steps: ["Choose the audience carefully: Everyone, Staff, Parents, Students, or one Individual user. Individual messages require a recipient from the active school; an audience-wide notice cannot retain an old direct recipient.", "Write a clear subject and message, then select the delivery channel. In-app delivery is available inside DOONO; SMS and push remain unavailable until their provider, recipient, and callback configuration is ready.", "Save as a draft when the message is still being prepared, or publish it when the audience should receive it. Published messages appear only in the intended school audience and portals.", "Monitor the recipient count and delivery status. Queued, provider accepted, delivered, failed, and partially delivered are different real outcomes; a provider-accepted message is not proof that every device received it.", "If a published notice is wrong or no longer valid, use Take down to remove it from active delivery and save it as a draft. Editing an audience, recipient, content, or channel clears prior delivery records and treats the corrected publication as a new delivery attempt.", "Retry external delivery only when the record shows failed or partially delivered recipients. Keep the audit trail and do not create a duplicate notice just because one provider attempt failed."], next: "Notifications, Work Inbox, or the intended audience portal." },
  library: { purpose: "School library catalogue, physical-copy inventory, active enrollment eligibility, loans, reservations, and safe return tracking.", steps: ["Add each title with its author, category, ISBN where available, and physical-copy count. The system keeps available copies separate from total copies.", "Issue or reserve only for an active student who also has an Active enrollment in the current school. The backend checks this even if a stale page or manually crafted request is submitted.", "Set the due date when issuing a loan. Returning a borrowed copy restores one available copy; lost or damaged history is retained instead of being deleted.", "Review pending reservations and move them to fulfilled, cancelled, or expired through the lifecycle action. Historical loan and reservation rows remain available for accountability.", "Students can view only their own school library activity through the student portal; staff library records remain protected by school permission."], next: "Transport or Student Portal." },
  transport: { purpose: "School transport operations from school-owned vehicles and current safety checks to routes, ordered stops, capacity-aware allocations, and linked tracking.", steps: ["Register a vehicle in the active school and record its capacity, driver, and service status. Vehicle, route, inspection, and allocation records cannot cross school boundaries.", "Record an inspection before carrying students. The latest inspection must be Passed and not past its next due date, and the vehicle must not be Maintenance or Inactive.", "Create a route and add ordered stops. A route may remain unassigned during setup, but a student allocation requires a vehicle that passes the readiness checks.", "Allocate only an active student with an Active enrollment. DOONO blocks duplicate active student allocations and compares active route allocations with the vehicle seating capacity.", "Parents and students see only their own active linked allocation, including the canonical route name, vehicle number, pickup point, and status. They cannot use tracking to discover unrelated school records."], next: "Communication or Support Centre." },
  health: { purpose: "Confidential school health records, clinic visits, emergency flags, referrals, and follow-up dates.", steps: ["Open the active school health workspace as an authorized clinic user.", "Create one medical profile per student for allergies, chronic conditions, blood group, genotype, and emergency contact details.", "Log each clinic visit with the complaint, treatment, and minimum necessary notes.", "Mark emergency escalation, referral destination, referral status, and follow-up date when applicable.", "Use updates rather than deletion so the health history and access audit remain accountable."], next: "Support Centre for access or workflow questions." },
  "ai-tutor": { purpose: "A server-side educational assistant that explains lessons and supports study without becoming an official teacher or decision-maker.", steps: ["Ask one clear learning question at a time and mention the subject or level when useful.", "Use the answer as guidance: check important work with a teacher and do not copy an answer as if it were your own assessment.", "Never enter passwords, payment details, medical notes, private student records, or another person’s information.", "If the Tutor says it cannot answer, asks for a trusted adult, or appears uncertain, follow the school workflow instead of forcing it to guess.", "If the AI is not configured, the page will explain that the server provider must be enabled; this is an honest configuration state, not a failed student account."], next: "Assignments, Results, Support Centre, or your teacher for official academic decisions." },
  "student-community": { purpose: "A protected school learning community where active students submit moderated posts, comments, reports, and approved learning videos.", steps: ["Open the community only with your own active, linked student account. The backend checks the active school and enrollment again.", "Write helpful, respectful learning content. Every post and comment begins in moderation and is not visible to other students until approved by the school.", "Video uploads stay private until approved and require guardian consent configured by the school. Do not show phone numbers, home addresses, uniforms outside approved policy, or another learner without permission.", "Use Report when content is bullying, harassing, unsafe, sexual, invasive of privacy, or spam. A report goes to the school moderation queue; do not retaliate or publish the report details.", "Live rooms and international exchanges are separate controlled capabilities. They require school approval, guardian consent where applicable, and a verified live provider; the community page must never be treated as unrestricted global social media."], next: "AI Tutor, Assignments, Communication, or Support Centre." },
  exchange: { purpose: "A curated project collaboration system between schools that have explicitly opted in.", steps: ["School leaders enable exchange only after reviewing safeguarding requirements. International exchange has a separate opt-in and must not be enabled casually.", "A school submits a project with its subject, age band, purpose, and dates. It stays in review until an authorized moderator approves it.", "Only schools that have opted in can be invited, and the target school must accept the invitation before its learners can see the project.", "A student must have an active linked account and Active enrollment. Joining creates a pending participation request; a school moderator approves it before participation is active.", "Learners use a safe alias and do not receive direct contact details through this workflow. Guardian approval is required for international exchange participation.", "Live video, private messaging, unrestricted student search, and cross-school public profiles are not provided by this page. Use the school’s moderated communication and report channels for concerns."], next: "Student Community, AI Tutor, Communication, or Support Centre." },
  "live-rooms": { purpose: "Scheduled, school-controlled live learning sessions with waiting-room admission and safeguarding controls.", steps: ["A permitted school leader schedules a room with a clear learning purpose, audience, participant limit, time, and recording-consent setting.", "The room stays pending until an authorized moderator approves it. Approval creates a schedule, not an automatic live broadcast.", "Before enabling live service, the administrator must confirm the provider account, private server credentials, public client URL, signed webhook secret, browser client, recording policy, and safeguarding approval. Keep the adapter-ready switch off until these checks are complete.", "A student can request admission only with an active linked student account and Active enrollment, and only when the room audience includes that student’s school or accepted exchange project. If recording is planned, guardian consent with video permission is required before request, admission, and token issuance.", "Every student first enters Waiting. A moderator reviews the request and admits or removes the participant; the room limit is enforced by the server.", "After admission and provider readiness, the student opens the room to request a five-minute token. The browser shows loading, connected, reconnecting, disconnected, and error states and provides an explicit Leave room action.", "Use Report for bullying, harassment, unsafe conduct, sexual content, privacy violations, or spam. A report goes to the school safeguarding queue.", "If the page says the provider is not ready, this is intentional. DOONO will not pretend that a scheduled record is a working video call. A verified provider, admission adapter, recording policy, private output storage, retention period, and callbacks must be configured first. Completed or failed recordings are automatically eligible for deletion after the configured retention period."], next: "Student Community, Project Exchange, Communication, or Support Centre." },
  "audit-logs": { purpose: "Accountability history for the current platform or school context.", steps: ["Filter by date, actor, module, or action.", "Distinguish platform actions from school actions.", "Investigate unexpected changes using the actor and timestamp.", "Export or retain evidence according to school policy."], next: "The affected module." },
};

const PAGE_ALIASES = {
  support_center: "support-centre",
  library: "library",
  books: "library",
  "library-members": "library",
  cbt: "cbt",
  "cbt-assessments": "cbt-assessments",
  "fees-payments": "fees-payments",
  "report-cards": "report-cards",
  "result-entry": "result-entry",
  "parent-portal": "parent-portal",
  "student-portal": "student-portal",
  "portal-access": "parent-portal",
};

export const pageGuideKey = (page) => PAGE_ALIASES[page] || page || "dashboard";

const normalizeSteps = (steps) => steps.map((item, index) => typeof item === "string" ? step(`Step ${index + 1}`, item) : item);

export function moduleGuide(page) {
  const key = pageGuideKey(page);
  const registryEntry = Object.values(ARCHITECTURE_MODULES).find((module) => module.page === key);
  const details = MODULE_DETAILS[key];
  if (details) return enrichModuleGuide(key, { key, title: registryEntry?.label || key, ...details, steps: normalizeSteps(details.steps) });
  return enrichModuleGuide(key, {
    key,
    title: registryEntry?.label || key.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    purpose: `The ${registryEntry?.label || key.replace(/[-_]/g, " ")} workspace for the current school and role.`,
    steps: normalizeSteps([
      "Confirm that you are working in the correct organization and school context.",
      "Read the page subtitle and filters before entering or changing records.",
      "Use the primary action to create or begin the workflow.",
      "Review the saved result and any validation message before leaving the page.",
      "Return to the dashboard to confirm the related task or metric changed.",
      "If the result is not what you expected, open Support Centre, search the module name, and include the ticket reference when requesting help.",
    ]),
    next: "Follow the next module in your role dashboard.",
  });
}

export function roleGuide(role) {
  const base = ROLE_GUIDES[role] || {
    label: role ? role.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "DOONO User",
    intro: "Use the navigation menu to open only the modules assigned to your role. The guide explains the purpose, order, and completion check for each workspace.",
    steps: [
      step("Start with your dashboard", "Read alerts and pending work before opening a module.", "dashboard"),
      step("Follow permission boundaries", "If a button is unavailable, ask the school owner or platform administrator rather than bypassing the control.", "dashboard"),
      step("Complete and verify", "Save the record, read the success message, and confirm the related list or metric updated.", "dashboard"),
    ],
  };
  const detail = ROLE_DETAILS[role] || {
    definition: "A DOONO role describes the responsibility and data boundary assigned to the signed-in person.",
    primaryPurpose: "Complete the work assigned to your role using the correct school context and approval sequence.",
    worksWith: "The users, records, and workflows shown in your permitted navigation.",
    canDo: ["Use the modules and actions granted to your role and current school context.", "Complete required fields and verify the saved result."],
    cannotDo: ["Bypass a permission, school boundary, approval, or privacy control."],
    dailyWorkflow: ["Start with the dashboard.", "Open the correct workspace.", "Save, verify, and escalate unresolved errors through Support Centre."],
    firstChecks: "Confirm your role, active school, academic period, and permissions before starting."
  };
  return { ...base, ...detail };
}

export const GUIDE_MODULE_KEYS = Object.keys(ARCHITECTURE_MODULES);
export const GUIDE_ROLE_KEYS = Object.keys(ROLE_GUIDES);


const CONTROL_GUIDES = {
  "admission number": {
    title: "Automatic admission number",
    what: "This is the permanent identifier DOONO assigns to a student when the school completes a new admission. It is not a number staff need to invent or type.",
    how: "Complete the student identity and academic placement fields, then click Complete Admission or Create student once. After the backend saves the student, read the success screen and keep the issued number. Search the Students directory by that number whenever you need the exact learner record.",
    benefit: "Automatic numbering prevents duplicate numbers, reduces manual mistakes, keeps each school’s records organized, and gives official documents a consistent student reference.",
    after: "The number remains the same when the learner changes class, stream, term, session, parent link, or status. Ordinary profile edits cannot change it. If an old record has a legacy number or a genuine correction is required, use a future authorized correction or import process rather than typing a replacement into the normal form.",
    access: "The number is generated only in the current school context. The server ignores a client-supplied number during normal creation, and school records remain isolated from other schools."
  },
  "id card": {
    title: "Generate student ID card",
    what: "This creates a printable identity card for the selected active student. It is an official school document, not a fee receipt or report card.",
    how: "First confirm the student’s name, admission number, class, stream, and active school context. Click ID card, wait for the PDF download, then review the school name, student name, admission number, class, stream, and validity notice before printing or sharing it.",
    benefit: "It gives the school a simple way to identify an active learner during entry checks, school activities, transport, library use, examinations, or emergencies.",
    after: "The action is recorded in the school audit trail. The card is generated only for an active student and remains valid while that student remains active.",
    access: "Users with permission to view students can generate it, but the student record must belong to the active school and the student must be active."
  },
  transcript: {
    title: "Download published transcript",
    what: "This downloads an official history of the student’s published subject results across sessions and terms.",
    how: "Confirm the student and school, click Transcript, and inspect the downloaded PDF. Only published results are included; draft or unapproved scores are intentionally excluded.",
    benefit: "It provides a consolidated academic record for authorized school administration, transfers, applications, and long-term student records.",
    after: "The download is recorded as an official-document action. If a result is missing, verify that it has been approved and published rather than trying to edit the transcript itself.",
    access: "Access follows school scope and result-view permissions."
  },
  "portal account": {
    title: "Create or link portal account",
    what: "This creates a controlled parent or student login and connects it to the exact school record that the person is allowed to use.",
    how: "Open the correct parent or student record, confirm the active school, confirm the real email, and choose the correct portal-account action. Set a temporary password of at least eight characters, confirm it, and hand the credentials to the recipient privately. The recipient signs in through the normal DOONO login page with that same email, changes the temporary password, and completes email verification when enabled.",
    benefit: "It lets families receive notices, view published results, follow attendance, see assignments, use supported school services, and pay the correct invoice without exposing another learner’s records.",
    after: "The portal status should show linked. For a parent, every child must be linked separately to the same parent record. For a student, the account must point to one student record. If the portal is empty or says unlinked, check the account link and active school rather than creating another login."
  },
  edit: {
    title: "Edit record",
    what: "This opens the existing record so authorized information can be corrected without creating a duplicate.",
    how: "Review the current values first, change only what is supported by evidence, then save. For financial, attendance, results, employment, or health records, use the official correction or history workflow when one is provided.",
    benefit: "It keeps one accurate record and preserves the history needed for accountability.",
    after: "Look for the success message, confirm the list shows the new value, and check the audit history when the record is sensitive."
  },
  delete: {
    title: "Delete record",
    what: "This removes a record only where the system permits deletion. Historical, financial, result, health, and audit records should normally be corrected, reversed, archived, or suspended instead.",
    how: "Confirm the record and read the warning before continuing. Never delete a record simply because it is incorrect; use the correction or reversal action when available.",
    benefit: "It prevents accidental duplicates while protecting records that must remain for accountability.",
    after: "Confirm the list and dashboard changed, and verify that linked historical records were not improperly removed."
  },
  save: {
    title: "Save changes",
    what: "This validates the form and stores the information in the active organization or school context.",
    how: "Complete required fields, check the selected school/session/term, click Save once, and wait for the success or validation message. Do not leave while the button is loading.",
    benefit: "It makes the information available to the next authorized workflow instead of leaving it only on your device.",
    after: "The form may clear, the record may appear in the list, and a dashboard count or status may change."
  },
  publish: {
    title: "Publish",
    what: "Publishing changes a prepared draft into information that the intended audience can see or use.",
    how: "Review the audience, dates, totals, attachments, and approval status first. Publish only when the content is complete and authorized; use unpublish, take down, or correction controls when circumstances change.",
    benefit: "It gives families and staff timely access to approved information while keeping unfinished work private.",
    after: "The status should show published, and the permitted audience should be able to see it."
  },
  approve: {
    title: "Approve",
    what: "Approval is an accountability checkpoint confirming that an authorized reviewer has checked the submitted work.",
    how: "Open the underlying record, verify completeness and correctness, then approve only when it meets school policy. If it is wrong, reject or reopen with a clear reason instead.",
    benefit: "It prevents draft scores, schedules, or notices from becoming official without review.",
    after: "The workflow moves to the next state and the approval actor/time should be visible in history."
  },
  reopen: {
    title: "Reopen for correction",
    what: "This returns an approved or submitted item to a controlled correction state; it is not a general undo button.",
    how: "Use it only when a genuine correction is needed, provide the reason, correct the named fields, and submit it for approval again.",
    benefit: "It allows mistakes to be corrected without silently changing an official record.",
    after: "The reopened state and reason remain visible in the record history."
  },
  retry: {
    title: "Retry delivery",
    what: "This queues a failed external SMS or push delivery again after the underlying problem has been checked.",
    how: "Review the failure detail, confirm the recipient consent and contact/token, correct provider configuration if needed, then click Retry once. It does not resend an in-app message blindly.",
    benefit: "It recovers temporary provider or network failures while keeping each attempt traceable.",
    after: "The delivery ledger should show a new queued or provider-accepted attempt."
  },
  "manage school": {
    title: "Manage school",
    what: "This switches from the organization-owner workspace into the selected school’s tenant context.",
    how: "Confirm the school name, click Manage School, and use the school dashboard for divisions, classes, streams, staff, fees, students, and operations. Use Back to Organisation when you are finished.",
    benefit: "It keeps organization ownership tasks separate from day-to-day school administration and prevents mixing data between schools.",
    after: "The header and dashboard should identify the selected school and the available modules should follow the school role."
  },
  "back to organisation": {
    title: "Return to organisation",
    what: "This leaves the school tenant context and returns to organization-level administration.",
    how: "Click it when you have finished school work. Confirm that the organization dashboard, not the school dashboard, is displayed before changing ownership-level settings.",
    benefit: "It prevents organization settings, subscription controls, and school records from being confused with one another.",
    after: "The organization name and organization-level navigation should be visible."
  },
  "configured fees payment": {
    title: "Configure fee payment",
    what: "This opens the fee setup workflow where authorized school finance users define what a class or learner is expected to pay before an invoice can be collected.",
    how: "Choose the active school and academic period, create fee categories and amounts, apply class or division rules when needed, review generated invoices, and verify the parent sees the correct child and balance.",
    benefit: "It lets a school charge different amounts for different classes or graduating groups without losing invoice-level traceability.",
    after: "A configured fee should be visible in the fee list and usable for an exact student invoice."
  },
  "add timetable": {
    title: "Add timetable entry",
    what: "This creates one scheduled lesson, break, or special timetable entry for the active term.",
    how: "Select the correct class, stream, subject, teacher, day/date, start time, end time, and entry type. Resolve collision warnings, save as draft, submit for review, and publish only after approval.",
    benefit: "It gives teachers and students a reliable view of where they should be and when, while preventing conflicting assignments.",
    after: "The entry should appear in the draft or published timetable according to its status, and each role should see only permitted lessons."
  },
  invite: {
    title: "Invite user",
    what: "This sends a time-limited invitation that assigns a role to a verified email address within the selected school.",
    how: "Choose the exact role and, where required, class or stream assignment. Check the email carefully, send the invitation, and tell the recipient to accept using that same email and complete profile setup.",
    benefit: "It creates accountable access without sharing passwords or granting a person more school authority than intended.",
    after: "The invitation should show pending, accepted, expired, revoked, or active status."
  },
  search: {
    title: "Search and filter",
    what: "This narrows the visible records without changing the underlying data.",
    how: "Use a name, admission number, reference, date, school, status, or category that the page supports. Clear filters before concluding that a record does not exist.",
    benefit: "It helps you find the exact student, invoice, staff member, ticket, or event without scanning the entire list.",
    after: "The result count and table should reflect the active filters."
  },
  refresh: {
    title: "Refresh data",
    what: "This requests the latest authorized data from the backend and replaces the current page state.",
    how: "Use it after another user changes a record or after a queued action finishes. If it fails, read the error and retry after checking connectivity.",
    benefit: "It reduces confusion caused by an old page view.",
    after: "The loading state ends and the latest list, status, or dashboard number appears."
  },
  logout: {
    title: "Log out",
    what: "This ends the current authenticated session on the device.",
    how: "Use it whenever you finish on a shared device. Sign in again with your own account rather than using another person’s session.",
    benefit: "It protects school, student, family, health, and financial information from the next person using the device.",
    after: "The login screen should appear and protected pages should no longer be accessible."
  }
};

const MODULE_FIELD_GUIDES = {
  "id-card": [
    { name: "Student", explanation: "The active learner whose identity will be printed; confirm the name and admission number before generating." },
    { name: "Class and stream", explanation: "The learner’s current academic placement, used to help staff identify the student." },
    { name: "Validity", explanation: "The card states that it remains valid while the student is active and identifies where a found card should be returned." }
  ],
  students: [
    { name: "Student identity", explanation: "Names, admission number, gender, and other identifying details used to find the correct learner." },
    { name: "Profile photo", explanation: "The learner’s official JPG, PNG, or WebP photograph. When saved successfully, the ID-card PDF uses this image; when no valid photo exists, the card falls back to initials." },
    { name: "Enrollment", explanation: "School, session, term, division, class, stream, and active status that determine which school workflows can use the record." },
    { name: "Parent and portal", explanation: "The linked guardian and portal state used for family access and multi-child selection." }
  ],
  "fees-payments": [
    { name: "Student and invoice", explanation: "The exact learner and invoice receiving the payment; never record a payment without confirming both." },
    { name: "Amount", explanation: "The amount being settled, checked against the outstanding balance to prevent overpayment." },
    { name: "Method and reference", explanation: "How the payment was received and the unique gateway or manual reference used for reconciliation." }
  ],
  timetable: [
    { name: "Class, stream, and subject", explanation: "The learner group and lesson content that define who should see the entry." },
    { name: "Teacher", explanation: "The assigned staff member who should see this lesson in the teacher timetable." },
    { name: "Start and end time", explanation: "The lesson period used to detect collisions and show the daily schedule." }
  ],
  "result-entry": [
    { name: "Session, term, class, and subject", explanation: "The academic context for the score sheet; choosing the wrong one changes the record being edited." },
    { name: "Assessment component", explanation: "The configured CA, examination, or other component with its maximum mark and weight." },
    { name: "Score", explanation: "The learner’s mark, validated against the component maximum before submission." }
  ],
  communication: [
    { name: "Audience", explanation: "The users or role group who should receive the notice; verify the school scope before publishing." },
    { name: "Title and message", explanation: "The clear instruction or information recipients will read in their portal and supported channels." },
    { name: "Status and delivery", explanation: "Whether the notice is draft, published, taken down, queued, accepted, or failed." }
  ],
  "school-setup": [
    { name: "Academic session and term", explanation: "The period that contains classes, subjects, attendance, fees, timetable, and results." },
    { name: "Division, class, and stream", explanation: "The school structure used to place learners and filter teacher work." },
    { name: "Subject and assignment", explanation: "The teachable subject and the staff/class links needed before academic entry screens can load." }
  ]
};

function enrichModuleGuide(key, guide) {
  const title = guide.title || key.replace(/[-_]/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
  const fields = MODULE_FIELD_GUIDES[key] || [
    { name: "Active context", explanation: "The organization, school, session, term, class, or child selected at the top of the page." },
    { name: "Required information", explanation: "Complete the fields marked required and choose values supplied by earlier setup workflows." },
    { name: "Status", explanation: "The saved, submitted, approved, published, failed, or archived state shown after an action." }
  ];
  return {
    key,
    ...guide,
    title,
    audience: `This explanation is for the ${title} workspace in the active role and school context.`,
    whyItMatters: `${guide.purpose} Completing it correctly gives the next authorized person reliable information instead of an incomplete or ambiguous record.`,
    beforeYouStart: guide.beforeYouStart || "Confirm the active organization, school, session, term, class, stream, or child shown on the page. Check that the prerequisite setup record already exists and that your role is allowed to perform this action.",
    fields,
    successSignals: guide.successSignals || ["A success message or completed status appears.", "The saved record, list, preview, or dashboard number changes.", "The next authorized role can see the expected result without receiving an unexplained empty state."],
    controls: guide.controls || ["Save or submit only after reviewing the selected context.", "Use the page’s correction, approval, publish, or retry action instead of repeating a request blindly.", "Open Support Centre with the exact screen, button, expected result, actual result, and error if the result is not clear."]
  };
}

const PAGE_CONTROL_GUIDES = {
  admissions: {
    "complete admission": { title: "Complete Admission", what: "This action creates one official student record and the first academic enrollment together. It is the point at which DOONO assigns the permanent admission number.", how: "Review the learner identity, date of birth, admission date, photo, school placement, session, term, class, and stream. Click once and wait for the success or validation message.", benefit: "It prevents a student from existing without a usable academic placement and keeps the admission number, class roster, parent linking, fees, results, and ID card connected.", after: "The success screen shows the automatically generated admission number. Open Students, confirm the photo and placement, then link the parent portal.", access: "Authorized admissions staff in the active school context." },
    "student profile photo": { title: "Student Profile Photo", what: "This is the learner’s official profile photograph stored with the student record and reused by authorized documents such as the ID card.", how: "Choose a clear front-facing JPG, PNG, or WebP image within the displayed size limit. Confirm the preview shows the correct learner before completing the admission.", benefit: "It helps staff identify the correct learner and allows the official ID card to display the learner’s real photograph instead of initials.", after: "The image is stored under the active school. After admission, reopen the student record and generate the ID card to verify that the photo appears.", access: "Authorized admissions staff; the file is tied to the current school and is not a public profile." },
    "back to students": { title: "Back to Students", what: "This leaves the admission form without creating a new student.", how: "Use it only after saving or when you intentionally want to cancel the current form. Unsaved values will not become an admission.", benefit: "It returns you to the existing learner directory without creating an incomplete record.", after: "The Students Directory should appear in the current school context.", access: "Any user who can open the admission page." }
  },
  students: {
    "id card": { title: "Generate Student ID Card", what: "This creates the official front-and-back identity-card PDF for the selected active learner, including the saved profile photo when one exists.", how: "Confirm the learner name, admission number, school, class, stream, and status. Select ID card once, wait for the PDF, and inspect the photograph, school identity, learner details, emergency contact, and validity statement.", benefit: "It gives the school a consistent identity document for entry checks, examinations, transport, library use, activities, and emergencies.", after: "The PDF downloads and the action is recorded in the school audit log. If initials appear, return to Edit Student, upload and save the correct photo, then generate the card again.", access: "Authorized school staff with `issue_student_id_cards`; students cannot issue or download their own ID card." },
    "portal account": { title: "Student Portal Account", what: "This creates or links the learner’s login to exactly one student record in the active school.", how: "Confirm the learner and real email, set a temporary password, and hand it to the learner or guardian privately. The recipient must use the same email and change the temporary password.", benefit: "It connects the correct learner to timetable, assignments, CBT, library, fees, notices, attendance, and published results without exposing another student.", after: "The directory changes to Portal linked. If it does not, refresh and inspect the student record instead of creating a second account.", access: "Authorized staff with student-management permission." },
    edit: { title: "Edit Student", what: "This opens the existing learner profile for supported corrections, including a profile-photo update.", how: "Confirm the admission number and school, change only verified identity or profile information, upload the correct photo if needed, and save. Use Promotion / Graduation for lifecycle changes.", benefit: "It keeps one continuous learner record and prevents duplicate admissions or broken links to results and invoices.", after: "The list and profile should show the saved values. Generate the ID card again if the photo was changed.", access: "Authorized school staff; sensitive fields remain permission-controlled." },
    transcript: { title: "Download Published Transcript", what: "This creates a document containing the learner’s published academic history, not draft or unapproved marks.", how: "Verify the student and school, select Transcript, and inspect the downloaded PDF before sharing it.", benefit: "It provides an official consolidated record for authorized school administration and future student needs.", after: "The download is recorded. If results are missing, verify that they were approved and published.", access: "Authorized users with result-view permission." }
  },
  "id-card": {
    "id card": { title: "Student ID Card Document", what: "This is the official identity document workflow for an active learner. The front contains identity and photograph; the back contains verification, school contact, emergency contact, and authorization details.", how: "Confirm the student is active and the saved photo is correct. Generate the PDF, inspect both pages, and print only for approved school use.", benefit: "It supports safe learner identification while keeping the document separate from fee receipts and academic report cards.", after: "A two-page ID-1/CR80-sized PDF is downloaded and the official-document action is audited.", access: "Authorized school staff only; the student portal does not provide an ID-card download action." }
  },
  "school-setup": {
    "save": { title: "Save School Setup", what: "This stores one foundation record that later modules use to populate their selectors.", how: "Check the session or term name, dates, active state, division, class, stream, or subject fields, then save once and read the result.", benefit: "Correct setup is why teachers can select classes, students can receive placements, and results, fees, timetable, and attendance can load the right options.", after: "The record appears in the setup list and the relevant checklist item should become complete.", access: "Authorized school setup roles." },
    "complete setup": { title: "Complete Setup Step", what: "This records that you understand a setup instruction; it does not create the academic record itself.", how: "Only mark it complete after the real session, term, division, class, stream, subject, or assignment exists and is visible in the corresponding list.", benefit: "It prevents a checklist from falsely saying the school is ready when a prerequisite is still missing.", after: "The checklist status changes, but the underlying module remains the authority for the actual record.", access: "Authorized setup users." }
  },
  timetable: {
    "add timetable": { title: "Add Timetable Entry", what: "This schedules one lesson, break, or special event for the selected term.", how: "Choose the exact class, stream, subject, teacher, date or day, start time, end time, and entry type. Resolve collisions, save as draft, submit, and wait for approval before publishing.", benefit: "It gives teachers and students a reliable schedule and prevents a teacher, class, or room from being booked inconsistently.", after: "The entry appears in its workflow state. Published students see their class lessons; teachers see only assigned lessons.", access: "Authorized timetable users in the active school." },
    publish: { title: "Publish Timetable", what: "This makes approved timetable entries visible to their intended classes and teachers.", how: "Check collision warnings, dates, teacher, class, stream, and approval state before publishing.", benefit: "It prevents families from relying on an unfinished timetable.", after: "Only published entries appear in the relevant student or teacher timetable.", access: "Authorized timetable approvers." }
  },
  "result-entry": {
    save: { title: "Save Score Sheet", what: "This stores the current component marks for the selected class, subject, session, and term without yet making them official.", how: "Enter marks within each component’s maximum, confirm every learner, and save. Read validation messages for missing or excessive values.", benefit: "It lets a teacher continue safely without losing a partially completed sheet.", after: "Reopening the same context restores the saved scores. Use Submit only when the sheet is complete.", access: "Assigned teachers and authorized academic users." },
    submit: { title: "Submit Score Sheet", what: "This sends a completed score sheet to the academic review workflow.", how: "Check that all learners and components are complete, then submit once. A submitted sheet becomes read-only until an authorized reviewer reopens it.", benefit: "It separates teacher entry from approval and protects official results from silent changes.", after: "The status becomes Submitted and the reviewer can approve or return it.", access: "Assigned teachers or authorized score-entry users." }
  },
  results: {
    approve: { title: "Approve Results", what: "This confirms that an authorized reviewer checked the submitted score work and accepts it for the next stage.", how: "Review totals, grades, missing learners, class context, and anomalies. Approve only when the evidence is complete; otherwise reject or reopen with a reason.", benefit: "It prevents unfinished or incorrect marks from reaching families.", after: "The result advances to the approved state and records who approved it and when.", access: "Authorized academic approvers, not ordinary students or parents." },
    publish: { title: "Publish Final Result", what: "This makes the approved result, ranking, promotion status, and report-card information available to the intended audience.", how: "Confirm all required subjects are approved and the final computation is correct. Publish only once the school is ready to stand behind the outcome.", benefit: "It creates a clear boundary between internal preparation and official family communication.", after: "Parents and students can see the published outcome; draft and unapproved results remain hidden.", access: "Authorized result publishers." }
  },
  fees: {
    "generate invoices": { title: "Generate Student Invoices", what: "This creates invoice records from an active fee structure for eligible active enrollments in the selected class and academic period.", how: "Confirm the fee category, amount, session, term, division, class, and existing invoice state, then generate once.", benefit: "It turns a school billing rule into traceable student-level balances without duplicating matching invoices.", after: "The result reports how many invoices were created. Verify a sample invoice and the parent portal balance.", access: "Authorized finance users." }
  },
  "fees-payments": {
    "receive payment": { title: "Receive Payment", what: "This records money against one exact student invoice; it is not a general cash deposit action.", how: "Verify student, admission number, invoice, amount, currency, method, and reference before saving. Treat Pending as unresolved.", benefit: "It keeps every collection attached to the correct child and balance.", after: "A receipt or pending status appears and finance reports can reconcile it.", access: "Authorized bursar, cashier, or finance users." }
  },
  communication: {
    publish: { title: "Publish School Notice", what: "This sends a prepared notice to its selected school audience through the configured channels.", how: "Check audience, recipient, subject, message, channel, attachments, and school context before publishing.", benefit: "It ensures families or staff receive the right instruction without exposing it to an unintended audience.", after: "The notice shows its publication and delivery state. Use Take down if it is no longer valid.", access: "Authorized communication users." },
    "take down": { title: "Take Down Notice", what: "This removes a published notice from active audience visibility while keeping its history.", how: "Use it when a notice is wrong, expired, or no longer applicable. Record a corrected notice through the normal draft-and-publish workflow.", benefit: "It stops outdated information without deleting the accountability trail.", after: "The notice becomes inactive or draft according to its workflow state, and the audit entry remains.", access: "Authorized notice publishers." }
  },
  cbt: {
    publish: { title: "Publish CBT Assessment", what: "This makes a configured timed test available to its selected class during its allowed window.", how: "Confirm approved questions, subject, class, duration, attempts, pass mark, schedule, and result weight before publishing.", benefit: "It prevents students from starting an incomplete or incorrectly configured test.", after: "Eligible students can see the test. Their score remains subject to the official results workflow.", access: "Authorized CBT and academic users." }
  },
  "parent-portal": {
    "choose child": { title: "Choose a Child", what: "This selects which linked learner’s information the parent is currently reviewing.", how: "Check the child’s full name, class, admission number, and school before opening fees, attendance, assignments, or results.", benefit: "It prevents a multi-child parent from paying or reading the wrong child’s record.", after: "The selected child context controls the next portal pages.", access: "The authenticated parent account and its school-linked children only." }
  },
  "student-portal": {
    "start test": { title: "Start CBT Test", what: "This starts one published computer-based assessment for the eligible student and begins the official timer.", how: "Read the instructions, confirm the subject and duration, start only when ready, and answer within the time window.", benefit: "It creates a controlled attempt tied to the correct student and published assessment.", after: "Answers autosave when possible, the timer runs, and the attempt must be submitted before or at expiry.", access: "The authenticated student with an eligible active enrollment." }
  },
  "support-centre": {
    "ask for support": { title: "Ask for Support", what: "This opens a tracked support request rather than sending an untraceable complaint.", how: "Describe the screen, exact steps, expected result, actual result, school, time, and error. Never include a password, one-time code, or full payment-card details.", benefit: "It gives the support team enough evidence to reproduce and follow the issue.", after: "A reference number is created; use it for replies and follow-up.", access: "Authenticated users may create requests; platform support staff manage the response." }
  }
};

export function controlGuide(label, page = "dashboard", role = "") {
  const normalized = String(label || "").trim().toLowerCase().replace(/\s+/g, " ");
  const activeModule = moduleGuide(page);
  const pageControls = PAGE_CONTROL_GUIDES[page] || {};
  const pageKey = Object.keys(pageControls).find((key) => normalized === key || normalized.includes(key) || key.includes(normalized));
  if (pageKey) return { key: `${page}:${pageKey}`, ...pageControls[pageKey], page, role };

  const exact = CONTROL_GUIDES[normalized];
  const matchedKey = exact ? normalized : Object.keys(CONTROL_GUIDES).find((key) => normalized.includes(key) || key.includes(normalized));
  if (matchedKey) {
    const generic = CONTROL_GUIDES[matchedKey];
    return {
      key: `${page}:${matchedKey}`,
      ...generic,
      title: `${generic.title} · ${activeModule.title}`,
      what: `${generic.what} On this page, it applies specifically to ${activeModule.title}. ${activeModule.purpose}`,
      how: `${generic.how} Before acting, check this feature’s prerequisite: ${activeModule.beforeYouStart}`,
      benefit: activeModule.whyItMatters,
      after: `${generic.after} For this page, look for: ${Array.isArray(activeModule.successSignals) ? activeModule.successSignals.join(" ") : activeModule.next}`,
      page,
      role
    };
  }
  return {
    key: normalized || "control",
    title: normalized ? `${label} · ${activeModule.title}` : `Use a control in ${activeModule.title}`,
    what: normalized ? `This control belongs to the ${activeModule.title} feature. It starts, saves, filters, or changes the record currently shown on this page; it is not a general-purpose action outside this workflow.` : `This control changes the current ${activeModule.title} workflow.`,
    how: `Start by checking the page’s required context: ${activeModule.beforeYouStart} Then use the control once, wait for the response, and read the success or validation message.`,
    benefit: activeModule.whyItMatters,
    after: `For this feature, completion should look like this: ${Array.isArray(activeModule.successSignals) ? activeModule.successSignals.join(" ") : activeModule.next}`,
    access: `Your ability to use it depends on your ${role || "current role"}, permission, active school context, and the ${activeModule.title} record’s workflow state.`,
    page,
    role
  };
}

export const GUIDE_MODULE_KEYS_WITH_DOCUMENTS = [...new Set([...GUIDE_MODULE_KEYS, "id-card", "work-inbox", "notifications", "global-search"])];


MODULE_DETAILS["id-card"] = {
  purpose: "The official student identity-card document workflow for an active learner.",
  steps: [
    step("Confirm the learner", "Open the student record and verify the full name, admission number, school, current class, stream, and active status before generating the card.", "students"),
    step("Generate the PDF", "Click ID card once and wait for the download to finish. The backend checks that the student belongs to the active school and is active.", "students"),
    step("Inspect the card", "Open the PDF and check the school name, student name, admission number, class, stream, border, and validity message. Report any wrong source data before printing.", "students"),
    step("Print or share safely", "Print the card for the school’s approved use or share it only with the learner or authorized guardian. Avoid posting it publicly because it contains identifying information.", "students"),
    step("Keep the record current", "Generate a new card when the student’s class, stream, name, admission number, or active status changes. A card is valid only while the student remains active.", "students")
  ],
  next: "Return to Students and use Student 360 or the parent portal only when you need the learner’s other authorized records.",
  successSignals: [
    "The PDF downloads with the student admission number in its filename.",
    "The document shows the correct school, learner identity, class, and stream.",
    "The download is recorded in the school audit history.",
    "The card states that it is valid while the student remains active."
  ],
  controls: [
    "Use ID card only after confirming the selected student and school.",
    "Do not use it as proof that fees are paid; use the invoice and receipt workflow for payment evidence.",
    "Do not use it as a final academic result; use published report cards or transcripts for academic evidence.",
    "If generation is blocked, check that the student is active and belongs to the current school."
  ]
};

PAGE_ALIASES["student-id-card"] = "id-card";
PAGE_ALIASES["id_card"] = "id-card";


export const CONCEPT_GUIDES = [
  { key: "organization", title: "Organization", meaning: "The ownership container that can own one or more schools. It is not the same as a school tenant.", example: "An organization owner may manage School A and School B, then enter one school at a time.", why: "Separating organization ownership from school operations prevents settings or records from one school being confused with another.", related: ["Manage School", "Back to Organisation", "School context"] },
  { key: "school-context", title: "School context", meaning: "The school currently selected for the work you are doing.", example: "Before creating a division, fee, student, or timetable entry, check the school name in the header.", why: "DOONO uses the active school context to keep records isolated between schools.", related: ["Tenant isolation", "Current school", "Role"] },
  { key: "school-operating-system", title: "School Operating System", meaning: "One connected platform for running a school, where people, academic records, finance, communication, welfare, operations, documents, and family portals use the same school context and permission rules.", example: "A student admission creates a permanent identity, a current enrollment drives the class timetable and assignments, approved results create report cards, and a linked parent can view only the permitted child records.", why: "It prevents the school from depending on disconnected spreadsheets and separate tools that disagree about people, classes, payments, results, or responsibilities.", related: ["School context", "Enrollment", "Tenant isolation", "Portal"] },
  { key: "tenant-isolation", title: "Tenant isolation", meaning: "A security rule that allows a user to see and change only the organization or school records their role authorizes.", example: "A proprietor can see activity for their school, while a parent sees only the children linked to that parent account.", why: "It protects student, health, financial, staff, and audit information from cross-school exposure.", related: ["School context", "Permission", "Audit log"] },
  { key: "role", title: "Role", meaning: "The responsibility assigned to a user, such as Proprietor, Principal, Teacher, Bursar, Parent, or Student.", example: "A teacher can enter scores for assigned subjects but should not create school-wide classes.", why: "Roles make the menu and actions match the work a person is trusted to perform.", related: ["Permission", "Role invitation", "Approval"] },
  { key: "permission", title: "Permission", meaning: "A specific capability attached to a role, such as view_students, manage_fees, or approve_results.", example: "Seeing a Students menu does not automatically mean the user may delete student records.", why: "Permissions provide fine-grained control inside a role and protect sensitive actions.", related: ["Role", "School context", "Audit log"] },
  { key: "academic-session", title: "Academic session", meaning: "The broad school year or academic cycle that contains terms, enrollments, fees, attendance, timetable, and results.", example: "2026/2027 can contain first, second, and third term records.", why: "Choosing the correct session keeps records from different school years separate.", related: ["Term", "Enrollment", "Report card"] },
  { key: "term", title: "Term", meaning: "A defined period inside an academic session, normally with dates and an active status.", example: "First Term is the period used for the current attendance, fees, timetable, and result entries.", why: "Most academic records belong to one term, so an incorrect term can make selection lists appear empty or put data in the wrong period.", related: ["Academic session", "Active context", "Result"] },
  { key: "division", title: "Division", meaning: "A broad section of a school, such as Nursery, Primary, or Secondary.", example: "Primary 6 and JSS 1 may belong to different divisions with different rules.", why: "Divisions help schools organize structures, fees, subjects, and reporting according to their educational stages.", related: ["Class", "Stream", "School setup"] },
  { key: "class", title: "Class", meaning: "The academic level or form a learner belongs to inside a division.", example: "Primary 6 or Junior Secondary School 1 is a class.", why: "Classes determine rosters, teacher assignments, fees, timetable visibility, assessments, and reporting.", related: ["Division", "Stream", "Enrollment"] },
  { key: "stream", title: "Stream", meaning: "A subdivision of a class used when one class is split into groups, such as JSS 1A and JSS 1B.", example: "A student in JSS1 A should not be placed on the JSS1 B roster.", why: "Streams keep large classes, teacher work, attendance, assignments, and timetable entries correctly separated.", related: ["Class", "Form teacher", "Enrollment"] },
  { key: "enrollment", title: "Enrollment", meaning: "The record connecting a student to a school, session, term, division, class, stream, and active status.", example: "A parent with two children has two learner relationships, and each child may have a different class.", why: "Enrollment determines which lessons, assignments, fees, attendance, and published results a person may see.", related: ["Student", "Parent portal", "Class"] },
  { key: "invoice", title: "Student invoice", meaning: "The exact amount a particular student is expected to pay for a configured fee and academic period.", example: "A parent must open the child’s invoice before paying, especially when the parent has multiple children.", why: "Invoice-level payment prevents money from being assigned to the wrong child or school.", related: ["Fee", "Receipt", "Payment reference"] },
  { key: "receipt", title: "Receipt", meaning: "The school’s record that an invoice payment was accepted and associated with a student.", example: "A successful gateway transaction should be reconciled with the correct student invoice and receipt.", why: "It gives the school and family an auditable confirmation rather than relying only on a bank message.", related: ["Invoice", "Payment status", "Audit log"] },
  { key: "assessment", title: "Assessment component", meaning: "A configured part of a result, such as CA, test, practical, or examination, with a maximum mark and weight.", example: "CA may contribute 40% and examination 60%; the total configured weight must be valid.", why: "The result engine needs the component structure before teachers can enter reliable scores.", related: ["Result entry", "Result computation", "Approval"] },
  { key: "result-computation", title: "Result computation", meaning: "The process that combines approved components into totals, averages, grades, positions, remarks, and promotion outcomes according to school rules.", example: "A student’s first position should be computed only from the approved records in the correct class and term.", why: "It turns separate teacher entries into a consistent official academic outcome.", related: ["Assessment", "Approval", "Report card"] },
  { key: "approval", title: "Approval", meaning: "A deliberate review checkpoint by an authorized academic or operational user before work becomes official.", example: "A principal reviews submitted marks before approving them.", why: "Approval prevents unfinished or incorrect drafts from reaching parents and students.", related: ["Publish", "Reopen", "Audit log"] },
  { key: "publish", title: "Publish", meaning: "The controlled action that makes an approved notice, result, timetable, or report available to its intended audience.", example: "Parents should see a report card only after the school approves and publishes the final result.", why: "It separates preparation from official communication.", related: ["Approval", "Portal", "Take down"] },
  { key: "portal", title: "Parent or student portal", meaning: "A private, school-scoped workspace reached after a parent or student account is linked to the correct record.", example: "A parent with two children sees both only after the school links both student records to the same parent portal identity; a student sees only their own records.", why: "Portal linking gives families useful access while preventing another student, parent, or school from being exposed.", related: ["Portal account", "Enrollment", "Tenant isolation", "Published result"] },
  { key: "portal-account", title: "Portal account", meaning: "The login identity created by authorized school staff and linked to a parent or student record.", example: "The school enters the recipient’s email and temporary password once, then the recipient signs in with that same email and changes the password privately.", why: "The account link connects authentication to the correct school data; a password alone does not grant access to a student or parent record.", related: ["Parent portal", "Student portal", "Password change", "Tenant isolation"] },
  { key: "parent-portal", title: "Parent portal", meaning: "The family view of notices, linked children, fee balances, and published report cards for one active school.", example: "A parent selects the correct child context when checking an invoice or published report card.", why: "It supports multiple children without combining unrelated students or schools.", related: ["Portal account", "Student", "Invoice", "Published result"] },
  { key: "student-portal", title: "Student portal", meaning: "The learner’s own view of timetable, assignments, library, CBT, attendance, fees, notices, and published results.", example: "A student sees their current class timetable and only assignments published for that class or stream.", why: "It gives learners useful day-to-day information without granting staff administration powers or access to another learner.", related: ["Portal account", "Enrollment", "Assignment", "Published result"] },
  { key: "audit-log", title: "Audit log", meaning: "A trace of important actions, including who acted, what changed, when it happened, and which organization or school context was involved.", example: "Downloading a student ID card is recorded as an official-document action.", why: "It helps schools investigate mistakes, protect records, and demonstrate accountability.", related: ["Tenant isolation", "Correction", "Approval"] },
  { key: "admission-number", title: "Admission number", meaning: "The permanent identifier DOONO automatically assigns to a student when a school creates the student record.", example: "A new learner may receive a number such as ABC-000027. Staff search with it when opening the exact student record or checking an official document.", why: "Automatic, school-specific numbering prevents manual duplicates and keeps the same learner identifiable across classes, streams, terms, sessions, invoices, results, transcripts, and ID cards.", related: ["Student", "Admission", "Enrollment", "Student ID card"] },
  { key: "id-card", title: "Student ID card", meaning: "A printable identity document for an active student showing the school, learner name, admission number, class, stream, and validity notice.", example: "It can help identify a student during entry checks, school activities, transport, library use, or emergencies.", why: "It identifies the learner but is not proof of fee payment or a final academic result.", related: ["Student", "Admission number", "Official document"] },
  { key: "offline", title: "Offline work", meaning: "A limited ability to keep the app shell and approved queueable actions available when connectivity drops.", example: "CBT answers and attendance register changes can be retained and synchronized under their conflict rules.", why: "It reduces lost work in unstable networks, but high-risk mutations should remain online until their conflict policy is safe.", related: ["Sync", "Conflict", "Idempotency"] },
  { key: "idempotency", title: "Idempotency", meaning: "A protection that makes repeating the same request safe instead of creating duplicate payments, attendance entries, or queued changes.", example: "A stable request key lets the server recognize a retry of the same operation.", why: "Mobile networks can retry requests, and financial or academic records must not duplicate because of that retry.", related: ["Offline", "Payment reference", "Retry"] }
];

export const conceptGuide = (key) => CONCEPT_GUIDES.find((concept) => concept.key === key) || CONCEPT_GUIDES.find((concept) => concept.title.toLowerCase() === String(key || "").toLowerCase());
