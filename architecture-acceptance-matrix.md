# DONO School ERP Architecture Acceptance Matrix

Source: user-supplied DONO De Creator School ERP Architecture diagram.

## Architectural boundaries

The platform has five layers: Software Owner (platform owner), Organization Owner, School, school-scoped Roles, and Students & Parents. Platform-wide actions belong only to `super_admin`; school operational data must remain isolated by `school_id`; students and parents use separate portals.

## Role dashboard requirements

| No. | Role | Required dashboard modules from diagram |
|---:|---|---|
| 1 | Platform Owner / Software Owner | Dashboard with overall system stats; Organizations; Schools; Subscriptions; Plans & Features; Payments & Invoices; System Settings; Countries / Currency; Email & SMS Settings; Backups & Logs; Audit Logs; System Health |
| 2 | Organization Owner | Dashboard; My Schools; Create School; Edit School; Delete School; View School; Subscription; Upgrade / Renew; Payment History; Users; Organization Profile |
| 3 | Proprietor / Proprietress / School Owner | Dashboard; Staff Management; Leadership Assignment; Academic Management; Student Management; Finance Management; Reports; School Settings; System Settings; Communication; Audit Logs |
| 4 | Principal / Headmaster | Dashboard; Manage Teachers; Manage Students; Approve Admissions; Approve Results; Approve Timetable; Approve Promotions; View Attendance; View Finance; Reports; Communication |
| 5 | Vice Principal Academic | Dashboard; Subjects; Assign Teachers; Timetable; Examinations; Continuous Assessment; Results Management; Promotion; Academic Reports; Question Bank (CBT) |
| 6 | Vice Principal Administration | Dashboard; Staff Management; Staff Attendance; Leave Management; Discipline / Behaviour; Inventory / Assets; Events Management; Health & Safety; Facilities Management; Reports |
| 7 | Nursery Head | Dashboard; Nursery Pupils; Nursery Teachers; Nursery Classes; Assessment; Attendance; Timetable; Reports; Communication |
| 8 | Primary Headmaster | Dashboard; Primary Classes; Primary Teachers; Subjects; Attendance; Assessment; Results; Promotion; Reports; Communication |
| 9 | Secondary Principal | Dashboard; JSS Management; SSS Management; Subjects; Teachers; Examinations (WAEC / NECO); Practicals; Continuous Assessment; Results; Reports |
| 10 | Teacher | Dashboard; My Classes; My Subjects; Take Attendance; Assignments; Upload CA Scores; Upload Exam Scores; View Students; Messages; Class Timetable |
| 11 | Form Teacher | Dashboard; My Class; Class Attendance; Behaviour Reports; Student Profiles; Parent Communication; Recommend Promotion; Assignments; Messages |
| 12 | Cashier / Bursar | Dashboard; Receive Payments; Invoices / Receipts; Pending Payments; Outstanding Fees; Discounts / Scholarships; Reverse Payment; Payment Reports |
| 13 | Accountant | Dashboard; Income; Expenses; Payroll; Budget; Profit / Loss; Tax Reports; Financial Reports |
| 14 | Librarian | Dashboard; Books; Borrow Books; Return Books; Lost Books; Fines; Members; Reports |
| 15 | Nurse | Dashboard; Medical Records; Clinic Visits; Medication; Allergies; Emergency Contacts; Health Reports |
| 16 | Hostel Master / Mistress | Dashboard; Hostels; Rooms; Bed Allocation; Hostel Attendance; Visitors; Reports |
| 17 | Transport Manager | Dashboard; Vehicles; Drivers; Routes; Student Allocation; Fuel Records; Maintenance; Reports |
| 18 | Receptionist | Dashboard; Visitors Log; Student Check-in / out; Staff Check-in; Appointments; Calls / Messages; Reports |
| 19 | Parent Portal | Dashboard; My Children; Attendance; Fees & Payments; Results; Assignments; Timetable; School Notices; Messages / Chat; Apply for Leave; Transport Tracking |
| 20 | Student Portal | Dashboard; My Timetable; Attendance; Assignments; My Results; Fees; Library; CBT / Exams; Messages; Notices |

## Shared modules across roles

Academic Sessions; Terms; Classes; Streams; Subjects; Students; Parents; Teachers; Attendance; Examinations; Results; Report Cards; Promotion; Graduation; Timetable; Fees & Payments; Payroll; Inventory; Library; Transport; Hostel; Clinic; Communication; Events; Settings.

## Platform differentiators to verify

Multi-school and multi-campus support; nursery, primary, and secondary divisions in one system; lifetime student records from admission through graduation and beyond; granular role-based access control; onboarding wizard; automated report cards and class positions; WAEC / NECO support and templates; CBT question bank; mobile-friendly parent portal; real-time notifications and messaging; audit logs; data security and backups; API integrations.

## Student journey to verify

Admission → Class Placement → Academic Activities → Results & Reports → Promotion → Graduation → Alumni Record.

## Technology and non-functional expectations

Backend: Laravel PHP. Frontend: React / JavaScript web interface. Database: MySQL. Authentication: Sanctum / token-based auth. Hosting: multi-tenant cloud deployment. Reports: PDF, Excel, and print-ready. Design: responsive web/mobile. Security: SSL, roles and permissions, and backups.

## Acceptance rule

A diagram item is complete only when the actual backend route/controller/model/permission contract exists, the correct role can reach it, unauthorized roles are denied, the data is school-scoped where applicable, the frontend page loads real API data, mutations work, and loading/error/empty/mobile states are handled consistently. A dashboard label or placeholder alone does not count as implemented.
