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
    intro: "You manage the catalogue, members, loans, returns, overdue items, and student-facing library access.",
    steps: [
      step("Build the catalogue", "Add books and classify them with title, author, ISBN, category, quantity, and availability.", "books"),
      step("Confirm members", "Review eligible students and staff before issuing a loan.", "library-members"),
      step("Issue and return books", "Record the borrower, book copy, issue date, due date, return condition, and overdue status.", "library-members"),
      step("Monitor usage", "Review overdue loans and keep the student library view accurate.", "library-members"),
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
    intro: "You manage vehicles, drivers, routes, stops, assignments, and transport communication.",
    steps: [
      step("Register transport assets", "Add vehicles, capacity, registration details, drivers, and service status.", "transport"),
      step("Create routes", "Define routes, stops, schedules, and assigned vehicles before assigning students.", "transport"),
      step("Assign riders", "Link students to the correct route and stop, keeping parent contact information current.", "transport"),
      step("Monitor exceptions", "Record breakdowns, route changes, delays, and safety notices for affected families.", "communication"),
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
      step("Create an admission", "Enter the learner’s identity, guardian details, contacts, documents, and admission number.", "admissions"),
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
    intro: "You work only with classes and subjects assigned to you. Your main cycle is timetable → attendance → assignments → scores → feedback.",
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
    intro: "You lead a specific form class. Your work combines class attendance, learner welfare, communication, assessment coordination, and form-level records.",
    steps: [
      step("Open your assigned form", "Confirm the class and stream assigned to you. Do not enter another form’s records.", "classes"),
      step("Track the class daily", "Record attendance, review discipline or welfare concerns, and follow up with parents where required.", "attendance"),
      step("Coordinate academic work", "Monitor assignments, scores, teacher submissions, and missing records for your form.", "results"),
      step("Support final reporting", "Review class comments, report-card readiness, and parent communication before publication.", "report-cards"),
    ],
  },
  parent: {
    label: "Parent / Guardian",
    intro: "You have a family portal. Select the correct child before reviewing fees, attendance, assignments, timetable, notices, CBT outcomes, or published report cards.",
    steps: [
      step("Choose a child", "If you have more than one child in the school, confirm the active child before viewing any record.", "dashboard"),
      step("Follow school activity", "Read notices, assignments, timetable updates, attendance, and communication from the school.", "communication"),
      step("Pay the correct invoice", "Open the child’s exact fee invoice, verify the amount and student identity, and complete Paystack payment.", "fees-payments"),
      step("View final outcomes", "Parents see results and report cards only after the school completes approval and final publication.", "report-cards"),
    ],
  },
  student: {
    label: "Student",
    intro: "You have a personal learning portal. Your access is limited to your own active enrollment, timetable, assignments, library, CBT tests, fees, and published results.",
    steps: [
      step("Check your learning day", "Use timetable, notices, assignments, and attendance to plan your school work.", "timetable"),
      step("Submit classwork", "Open assignments, read instructions, upload the required work, and confirm submission status.", "assignments"),
      step("Take CBT tests", "Start only published tests, watch the timer, answer from the supplied options, and submit before time expires.", "cbt"),
      step("Use school services", "Review your library loans, fees, and other services linked to your student account.", "library"),
      step("Read final results", "Your result and report card appear only after the school approves and publishes the official final outcome.", "results"),
    ],
  },
};

const MODULE_DETAILS = {
  dashboard: { purpose: "Your role-specific starting point.", steps: ["Read pending tasks and alerts first.", "Use dashboard action buttons to open the relevant workspace.", "Return here after completing a workflow to confirm the metric changed."], next: "Follow the first incomplete task rather than opening unrelated modules." },
  profile: { purpose: "Your authenticated identity across DOONO De Creator ERP.", steps: ["Confirm that the email shown belongs to you.", "Update your display name when it changes.", "Choose a clear JPG, PNG, or WebP profile picture if needed.", "Save and confirm that the header avatar changes.", "Log out and sign in again if testing a new device."], next: "Return to your role dashboard." },
  "school-branding": { purpose: "The proprietor workspace for school identity and official report-card design.", steps: ["Confirm that the active school is the school you intend to brand.", "Upload the school logo and optional report-card logo, principal signature, and school stamp.", "Choose the school colors, report-card theme, and layout.", "Select only the report-card sections your school actually publishes.", "Add approved custom header or footer text and save the design.", "Open Report Cards and download a published report to verify the final PDF."], next: "Report Cards and Communication." },
  "school-setup": { purpose: "The school foundation that makes every other module selectable.", steps: ["Create or confirm the active academic session.", "Create the active term and dates.", "Create divisions, classes, streams, and subjects.", "Assign staff and leadership after the structures exist.", "Reopen the setup checklist and confirm every item is complete."], next: "Academic sessions → Terms → Divisions → Classes → Streams → Subjects → Staff assignments." },
  admissions: { purpose: "Create a learner record before enrollment and portal access.", steps: ["Enter the learner’s identity and admission number.", "Add guardian and emergency contacts.", "Upload or record required documents.", "Enroll the learner in the correct session, term, class, and stream.", "Link the parent account before handing over portal access."], next: "Student enrollments." },
  students: { purpose: "School-scoped learner records and active enrollments.", steps: ["Search by name or admission number.", "Confirm the school and active enrollment.", "Review class, stream, parent link, and portal status.", "Use the profile actions for verified edits only."], next: "Parents or Student Enrollments." },
  parents: { purpose: "Parent profiles and multi-child portal relationships.", steps: ["Create or open the parent profile.", "Link each child to the correct school enrollment.", "Verify the parent email before portal handoff.", "Use the child switcher to confirm multiple-child access."], next: "Fees & Payments or Communication." },
  staff: { purpose: "School staff employment, role, and assignment records.", steps: ["Create or open the staff record.", "Assign only a role appropriate to the school.", "Use invitations for verified email-based acceptance.", "Assign classes or form-teacher responsibilities where required.", "Suspend or terminate employment through the employment action, not by deleting history."], next: "Role Invitations or Timetable." },
  "role-invitations": { purpose: "Securely assign school roles through verified invitations.", steps: ["Select the exact role and school.", "For form teachers, select the class and stream.", "Send the invitation to the intended email address.", "The invitee accepts the link, sets up the account, verifies the email, and signs in with that same email.", "Revoke or resend invitations when necessary."], next: "Staff Directory." },
  timetable: { purpose: "The term-wide schedule for classes, students, and teachers.", steps: ["Confirm the active session and term.", "Create periods, breaks, and special calendar entries.", "Assign the correct class, subject, teacher, start time, and end time.", "Check teacher and class conflicts before publishing.", "Confirm students see only their class timetable and teachers see only assigned lessons."], next: "Attendance or Results." },
  attendance: { purpose: "Daily attendance for the correct school, class, date, and learner group.", steps: ["Choose the date and assigned class.", "Confirm the roster is the active enrollment roster.", "Mark present, absent, late, or excused status.", "Save and review the summary before leaving the page."], next: "Assignments or Student profile." },
  assignments: { purpose: "Teacher-to-class work distribution and student submissions.", steps: ["Choose the assigned class and subject.", "Write clear instructions and a due date.", "Attach supporting material if needed.", "Publish the assignment.", "Review submissions and record feedback."], next: "Results or Communication." },
  "result-entry": { purpose: "The official component-based score sheet.", steps: ["Choose the assigned class, subject, session, and term.", "Review the active assessment structures and maximum marks.", "Enter every component for every learner; values are checked against maximum marks.", "Save and submit the sheet for approval.", "Do not edit after approval unless the submission is formally reopened."], next: "Results Management." },
  results: { purpose: "Submission review, approval, reopening, and official publication.", steps: ["Open the submitted class/subject sheet.", "Check component totals, grades, missing learners, and anomalies.", "Approve only after academic review.", "Publish only when all required subject submissions are complete.", "Reopen with a reason when a correction is genuinely required."], next: "Report Cards." },
  "report-cards": { purpose: "Final term summaries, positions, promotion status, and downloadable reports.", steps: ["Confirm the correct session and term.", "Wait for the required subject results to be approved and published.", "Review total, average, position, grade, remarks, and promotion status.", "Download or share only after the report card is marked published."], next: "Communication." },
  cbt: { purpose: "Approved question-bank authoring for computer-based tests.", steps: ["Create questions with one correct answer, valid options, subject, section, topic, difficulty, and marks.", "Submit questions for leadership review.", "Correct rejected questions and resubmit them.", "Do not delete questions already used in an assessment; deactivate them instead."], next: "CBT Assessments." },
  "cbt-assessments": { purpose: "Assemble and operate a timed CBT test.", steps: ["Select one class, subject, session, and term.", "Choose only approved questions for that subject.", "Set duration, pass mark, maximum attempts, availability window, shuffle, and result weight.", "Publish the test when ready.", "Close it after the test window, send results for review, then wait for official approval before final publication."], next: "Results Management." },
  fees: { purpose: "School fee categories, class rules, invoices, discounts, and student balances.", steps: ["Create or edit the fee category.", "Set class/division-specific amounts where required.", "Generate or review the student’s exact invoice.", "Confirm the parent can see the correct child and balance.", "Do not delete historical payment records."], next: "Fees & Payments." },
  "fees-payments": { purpose: "Invoice-specific fee collection and reconciliation.", steps: ["Open the exact student invoice.", "Verify child, class, fee category, amount, and outstanding balance.", "Start Paystack or record an authorized manual payment.", "Use the transaction reference to verify status.", "Treat pending payments as unresolved until verified; duplicate references are rejected."], next: "Financial Reports." },
  subscriptions: { purpose: "School subscription status, plans, trial, renewal, upgrade, and free-access controls.", steps: ["Review the current school status and expiry date.", "Choose a plan that fits the school.", "Start or renew Paystack checkout.", "Verify the transaction before assuming access changed.", "Platform-wide and school-specific free access are controlled separately by the Software Owner."], next: "Audit Logs." },
  communication: { purpose: "School-scoped notices and targeted communication.", steps: ["Choose the audience carefully.", "Write a clear title and message.", "Publish the notice.", "Monitor delivery and unread counts.", "Take down, edit, or republish when the information changes."], next: "Dashboard." },
  "audit-logs": { purpose: "Accountability history for the current platform or school context.", steps: ["Filter by date, actor, module, or action.", "Distinguish platform actions from school actions.", "Investigate unexpected changes using the actor and timestamp.", "Export or retain evidence according to school policy."], next: "The affected module." },
};

const PAGE_ALIASES = {
  library: "library",
  books: "library",
  "library-members": "library",
  cbt: "cbt",
  "cbt-assessments": "cbt-assessments",
  "fees-payments": "fees-payments",
  "report-cards": "report-cards",
  "result-entry": "result-entry",
};

export const pageGuideKey = (page) => PAGE_ALIASES[page] || page || "dashboard";

const normalizeSteps = (steps) => steps.map((item, index) => typeof item === "string" ? step(`Step ${index + 1}`, item) : item);

export function moduleGuide(page) {
  const key = pageGuideKey(page);
  const registryEntry = Object.values(ARCHITECTURE_MODULES).find((module) => module.page === key);
  const details = MODULE_DETAILS[key];
  if (details) return { key, title: registryEntry?.label || key, ...details, steps: normalizeSteps(details.steps) };
  return {
    key,
    title: registryEntry?.label || key.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    purpose: `The ${registryEntry?.label || key.replace(/[-_]/g, " ")} workspace for the current school and role.`,
    steps: normalizeSteps([
      "Confirm that you are working in the correct organization and school context.",
      "Read the page subtitle and filters before entering or changing records.",
      "Use the primary action to create or begin the workflow.",
      "Review the saved result and any validation message before leaving the page.",
      "Return to the dashboard to confirm the related task or metric changed.",
    ]),
    next: "Follow the next module in your role dashboard.",
  };
}

export function roleGuide(role) {
  return ROLE_GUIDES[role] || {
    label: role ? role.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "DOONO User",
    intro: "Use the navigation menu to open only the modules assigned to your role. The guide explains the purpose, order, and completion check for each workspace.",
    steps: [
      step("Start with your dashboard", "Read alerts and pending work before opening a module.", "dashboard"),
      step("Follow permission boundaries", "If a button is unavailable, ask the school owner or platform administrator rather than bypassing the control.", "dashboard"),
      step("Complete and verify", "Save the record, read the success message, and confirm the related list or metric updated.", "dashboard"),
    ],
  };
}

export const GUIDE_MODULE_KEYS = Object.keys(ARCHITECTURE_MODULES);
export const GUIDE_ROLE_KEYS = Object.keys(ROLE_GUIDES);
