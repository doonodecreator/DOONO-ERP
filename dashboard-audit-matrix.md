# DONO Dashboard Audit Matrix

This report is generated from the current repository. It is a contract inventory, not an assumption that an endpoint is semantically correct.

| Dashboard | Source page | API calls | Frontend page targets | Potential gaps |
|---|---|---|---|---|
| 1 Platform Owner | `PlatformOwnerDashboard.jsx` | `/platform-owner/dashboard` | `none` | none detected |
| 2 Organization Owner | `OrganizationOwnerDashboard.jsx` | `/me/switch-school, /org-owner/dashboard` | `my_schools` | page `my_schools` not in App switch |
| 3 Proprietor | `ProprietorDashboard.jsx` | `/proprietor/dashboard, /school-setup/progress` | `audit_logs, leadership, reports, school_setup` | page `audit_logs` not in App switch; page `leadership` not in App switch; page `reports` not in App switch; page `school_setup` not in App switch |
| 4 Principal | `PrincipalDashboard.jsx` | `/principal/dashboard` | `approve_results` | page `approve_results` not in App switch |
| 5 Vice Principal Academic | `VicePrincipalAcademicDashboard.jsx` | `/vp-academic/dashboard` | `examinations, subjects` | none detected |
| 6 Vice Principal Admin | `VicePrincipalAdminDashboard.jsx` | `/leave-requests/`, /vp-admin/dashboard` | `events, leave_mgmt` | page `events` not in App switch; page `leave_mgmt` not in App switch |
| 7 Nursery Head | `NurseryHeadDashboard.jsx` | `/nursery-head/dashboard` | `assessment, classes` | page `assessment` not in App switch |
| 8 Primary Headmaster | `PrimaryHeadmasterDashboard.jsx` | `/primary-headmaster/dashboard` | `primary_classes, promotion, results` | page `primary_classes` not in App switch; page `promotion` not in App switch |
| 9 Secondary Principal | `SecondaryPrincipalDashboard.jsx` | `/secondary-principal/dashboard` | `classes, results_approvals` | page `results_approvals` not in App switch |
| 10 Teacher | `TeacherDashboard.jsx` | `/teacher/dashboard` | `attendance, ca_scores, my_classes, my_subjects` | page `ca_scores` not in App switch; page `my_classes` not in App switch; page `my_subjects` not in App switch |
| 11 Form Teacher | `FormTeacherDashboard.jsx` | `/form-teacher/dashboard` | `attendance, behaviour, my_class, parents` | page `behaviour` not in App switch; page `my_class` not in App switch |
| 12 Cashier/Bursar | `CashierDashboard.jsx` | `/fee-payments, /student-fees` | `none` | none detected |
| 13 Accountant | `AccountantDashboard.jsx` | `/expenses, /expenses/`, /fee-payments` | `none` | none detected |
| 14 Librarian | `LibrarianDashboard.jsx` | `/book-loans, /book-loans/`, /books, /students` | `none` | none detected |
| 15 Nurse | `NurseDashboard.jsx` | `/clinic-visits, /medical-records, /students` | `none` | none detected |
| 16 Hostel Master/Mistress | `HostelDashboard.jsx` | `/hostel-allocations, /hostel-rooms, /hostels, /students` | `none` | none detected |
| 17 Transport Manager | `TransportDashboard.jsx` | `/students, /transport-allocations, /transport-routes, /vehicles` | `none` | none detected |
| 18 Receptionist | `ReceptionDashboard.jsx` | `/appointments, /gate-passes, /students, /visitors, /visitors/`` | `none` | none detected |
| 19 Parent Portal | `ParentPortal.jsx` | `/parent/dashboard, /parent/report-cards/`` | `none` | none detected |
| 20 Student Portal | `StudentPortal.jsx` | `/student/dashboard, /student/report-card/download` | `assignments, results` | none detected |

## All frontend page cases

academic-sessions, add-parent, add-school, add-staff, add-student, add-subject, add-teacher, admissions, asset-register, assignments, attendance, audit-logs, books, classes, clinic, dashboard, discipline-cases, divisions, edit-parent, edit-staff, edit-student, edit-teacher, examinations, expenses, fees, fees-payments, hostels, leave-requests, link-student-parent, organizations, parent-profile, parents, promotions, report-cards, result-entry, results, role-invitations, safety-incidents, school-events, school-facilities, school-setup, schools, settings, staff, staff-attendance, streams, student-enrollments, student-profile, students, subjects, subscriptions, teacher-profile, teachers, terms, timetable, transport, visitors

## Route declaration samples


/activity-logs
/countries
/dashboard
/login
/logout
/me/context
/me/staff-profile
/me/switch-school
/org-owner/dashboard
/register
/roles
/save
/students
00:00
academic-sessions
accept
acceptAuthenticated
admin/revenue-dashboard
admissions
appointments
assignments
assignments/{assignment}
attendance
attendance/bulk
attendance/class-list
auth:sanctum
book-loans
books
bulkStore
classList
classes
clinic-visits
context
countries
coupons
currencies
dashboard
delegations
delegations/{user}
destroy
divisions
downloadLatestReportCard
downloadPdf
downloadReportCard
enrollments
exam-scores
examinations
expenses
expenses/{expense}
fee-payments
fees
form-teacher/dashboard
gate-passes
has.school
hostel-allocations
hostel-rooms
hostels
index
initializeSubscription
inspire
login
logout
medical-records
my-subscription
mySubscription
nursery-head/dashboard
options
organizations
parent/dashboard
parent/report-cards/{student}/download
payment-receipts
payments/initialize-subscription
payments/paystack/verify/{reference}
payments/paystack/webhook
payments/verify-subscription/{reference}
permission:approve_admissions
permission:approve_results
permission:assign_roles
permission:manage_academic_sessions
permission:manage_assignments
permission:manage_attendance
permission:manage_budget
permission:manage_classes
permission:manage_clinic
permission:manage_divisions
permission:manage_events
permission:manage_exam_scores
permission:manage_examinations
permission:manage_facilities
permission:manage_fee_categories
permission:manage_front_desk
permission:manage_hostel
permission:manage_library
permission:manage_promotions
permission:manage_staff
permission:manage_streams
permission:manage_student_fees
permission:manage_students
permission:manage_subjects
permission:manage_terms
permission:manage_timetable
permission:manage_transport
permission:receive_payments
permission:view_assignments
permission:view_finance_reports
permission:view_results
permission:view_students
permission:view_timetable
platform-owner/dashboard
preview
primary-head/dashboard
principal/dashboard
progress
promo-campaigns
promotions
proprietor/dashboard
publish
register
report-cards
report-cards/{reportCard}/download
result-entry
results
results/{result}/publish
revoke
role-invitations
role-invitations/accept
role-invitations/accept-authenticated
role-invitations/preview/{token}
role-invitations/{roleInvitation}/revoke
role:principal
role:proprietor
role:super_admin
save
school-events
school-events/options
school-facilities
school-facilities/options
school-settings
school-setup
school-subscriptions
schools
secondary-head/dashboard
show
staff
staffProfile
store
streams
student-fees
student/assignments
student/dashboard
student/report-card/download
studentAssignments
students
subjects
subscription
subscription-plans
subscription-plans/{subscriptionPlan}
subscriptions:expire
switchSchool
system-settings
teacher/dashboard
terms
timetables
transport-allocations
transport-routes
update
updateStaffProfile
v1
vehicles
verify
verifySubscription
visitors
vp-academic/dashboard
vp-admin/dashboard
webhook
welcome