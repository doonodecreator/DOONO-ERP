import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { getPrimaryRoleSlug } from "../utils/role";

export default function Sidebar({
  page,
  setPage,
  open,
  closeSidebar,
}) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school, refreshContext } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });

  const backToOrganization = async () => {
    try {
      await api.post("/me/switch-school", { school_id: null });
      await refreshContext();
      window.location.href = "/"; // Force a full reload to reset all states
    } catch (err) {
      alert("Failed to switch back to organization context.");
    }
  };

  const platformMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Organizations", page: "organizations" },
    { name: "Schools", page: "schools" },
    { name: "Subscriptions", page: "subscriptions" },
    { name: "Plans & Features", page: "subscriptions" },
    { name: "Payments & Invoices", page: "platform-payments" },
    { name: "System Settings", page: "settings" },
    { name: "Countries / Currency", page: "countries-currency" },
    { name: "Email & SMS Settings", page: "email-sms-settings" },
    { name: "Backups & Logs", page: "backups-logs" },
    { name: "Audit Logs", page: "audit-logs" },
    { name: "System Health", page: "system-health" },
  ];

  const organizationOwnerMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Create School", page: "add-school" },
    { name: "My Schools", page: "schools" },
    { name: "Organization Users", page: "organization-users" },
    { name: "Organization Profile", page: "organization-profile" },
    { name: "Billing & Subscription", page: "subscriptions" },
    { name: "Organization Reports", page: "organization-reports" },
  ];

  // Proprietor (School Owner) - exactly 10 core modules per architecture diagram
  const proprietorMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Staff Management", page: "staff" },
    { name: "Leadership Assignment", page: "role-invitations" },
    { name: "Initial School Setup", page: "school-setup" },
    { name: "Academic Sessions", page: "academic-sessions" },
    { name: "Divisions", page: "divisions" },
    { name: "Academic Management", page: "classes" },
    { name: "Student Management", page: "students" },
    { name: "Finance Management", page: "fees" },
    { name: "Reports", page: "report-cards" },
    { name: "School Settings", page: "settings" },
    { name: "School Branding & Report Cards", page: "school-branding" },
    { name: "Subscriptions", page: "subscriptions" },
    { name: "Audit Logs", page: "audit-logs" },
    { name: "Communication", page: "communication" },
    { name: "CBT Oversight", page: "cbt-assessments" },
    { name: "Assessment Structure", page: "assessment-structures" },
  ];

  const principalMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Manage Teachers", page: "teachers" },
    { name: "Manage Students", page: "students" },
    { name: "Review Admissions & Placement", page: "student-enrollments" },
    { name: "Approve Results", page: "results" },
    { name: "Approve Timetable", page: "timetable" },
    { name: "Approve Promotions", page: "promotions" },
    { name: "View Attendance", page: "attendance" },
    { name: "View Finance", page: "fees" },
    { name: "Reports", page: "report-cards" },
    { name: "CBT Question Review", page: "cbt" },
    { name: "CBT Assessments", page: "cbt-assessments" },
    { name: "Communication", page: "communication" },
  ];

  const parentMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "My Children", page: "dashboard" },
    { name: "Attendance", page: "attendance" },
    { name: "Fees & Payments", page: "fees-payments" },
    { name: "Results", page: "report-cards" },
    { name: "Assignments", page: "assignments" },
    { name: "Timetable", page: "timetable" },
    { name: "School Notices", page: "notices" },
    { name: "Messages / Chat", page: "messages" },
    { name: "Apply for Leave", page: "leave-application" },
    { name: "Transport Tracking", page: "transport-tracking" },
  ];

  const studentMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "My Timetable", page: "timetable" },
    { name: "Attendance", page: "attendance" },
    { name: "Assignments", page: "assignments" },
    { name: "My Results", page: "results" },
    { name: "Fees", page: "fees-payments" },
    { name: "Library", page: "books" },
    { name: "CBT / Exams", page: "cbt" },
    { name: "Messages", page: "messages" },
    { name: "Notices", page: "notices" },
    { name: "Transport Tracking", page: "transport-tracking" },
    { name: "Apply for Leave", page: "leave-application" },
  ];

  const roleMenuItems = {
    vice_principal_academic: [
      { name: "Dashboard", page: "dashboard" }, { name: "Subjects", page: "subjects" }, { name: "Assign Teachers", page: "teachers" },
      { name: "Timetable", page: "timetable" }, { name: "Examinations", page: "examinations" }, { name: "CBT Question Bank", page: "cbt" }, { name: "CBT Assessments", page: "cbt-assessments" }, { name: "Results Management", page: "results" },
      { name: "Promotion", page: "promotions" }, { name: "Academic Reports", page: "report-cards" }, { name: "Communication", page: "communication" },
    ],
    vice_principal_admin: [
      { name: "Dashboard", page: "dashboard" }, { name: "Staff Management", page: "staff" }, { name: "Staff Attendance", page: "staff-attendance" },
      { name: "Leave Management", page: "leave-requests" }, { name: "Discipline / Behaviour", page: "discipline-cases" }, { name: "Inventory / Assets", page: "asset-register" },
      { name: "Events Management", page: "school-events" }, { name: "Health & Safety", page: "safety-incidents" }, { name: "Facilities Management", page: "school-facilities" },
      { name: "Reports", page: "report-cards" },
    ],
    nursery_head: [
      { name: "Dashboard", page: "dashboard" }, { name: "Nursery Pupils", page: "students" }, { name: "Nursery Teachers", page: "teachers" },
      { name: "Nursery Classes", page: "classes" }, { name: "Assessment", page: "results" }, { name: "Attendance", page: "attendance" },
      { name: "Timetable", page: "timetable" }, { name: "Reports", page: "report-cards" }, { name: "Communication", page: "communication" },
    ],
    primary_headmaster: [
      { name: "Dashboard", page: "dashboard" }, { name: "Primary Classes", page: "classes" }, { name: "Primary Teachers", page: "teachers" },
      { name: "Subjects", page: "subjects" }, { name: "Attendance", page: "attendance" }, { name: "CBT Question Bank", page: "cbt" }, { name: "CBT Assessments", page: "cbt-assessments" }, { name: "Assessment", page: "results" },
      { name: "Promotion", page: "promotions" }, { name: "Reports", page: "report-cards" }, { name: "Communication", page: "communication" },
    ],
    secondary_principal: [
      { name: "Dashboard", page: "dashboard" }, { name: "JSS Management", page: "classes" }, { name: "SSS Management", page: "classes" },
      { name: "Subjects", page: "subjects" }, { name: "Teachers", page: "teachers" }, { name: "Examinations", page: "examinations" }, { name: "CBT Question Bank", page: "cbt" }, { name: "CBT Assessments", page: "cbt-assessments" }, { name: "External Exams (WAEC/NECO)", page: "external-exams" }, { name: "Practicals", page: "practicals" },
      { name: "Results", page: "results" }, { name: "Promotion", page: "promotions" }, { name: "Graduation & Alumni", page: "graduation" }, { name: "Reports", page: "report-cards" }, { name: "Communication", page: "communication" },
    ],
    teacher: [
      { name: "Dashboard", page: "dashboard" }, { name: "My Classes", page: "classes" }, { name: "My Subjects", page: "subjects" },
      { name: "Take Attendance", page: "attendance" }, { name: "Assignments", page: "assignments" }, { name: "CBT Question Bank", page: "cbt" }, { name: "Upload CA Scores", page: "result-entry" },
      { name: "Upload Exam Scores", page: "result-entry" }, { name: "View Students", page: "students" }, { name: "Class Timetable", page: "timetable" }, { name: "Messages", page: "messages" },
    ],
    form_teacher: [
      { name: "Dashboard", page: "dashboard" }, { name: "My Class", page: "classes" }, { name: "Class Attendance", page: "attendance" },
      { name: "Behaviour Reports", page: "discipline-cases" }, { name: "Student Profiles", page: "students" }, { name: "Recommend Promotion", page: "promotions" },
      { name: "Assignments", page: "assignments" }, { name: "Parent Communication", page: "communication" }, { name: "Messages", page: "messages" },
    ],
    bursar: [
      { name: "Dashboard", page: "dashboard" }, { name: "Receive Payments", page: "fees-payments" }, { name: "Invoices / Receipts", page: "fees-payments" },
      { name: "Pending Payments", page: "fees-payments" }, { name: "Outstanding Fees", page: "fees" }, { name: "Discounts / Scholarships", page: "fee-discounts" }, { name: "Reverse Payment", page: "reverse-payment" }, { name: "Payment Reports", page: "payment-reports" },
    ],
    cashier: [
      { name: "Dashboard", page: "dashboard" }, { name: "Receive Payments", page: "fees-payments" }, { name: "Invoices / Receipts", page: "fees-payments" },
      { name: "Pending Payments", page: "fees-payments" }, { name: "Outstanding Fees", page: "fees" }, { name: "Discounts / Scholarships", page: "fee-discounts" }, { name: "Reverse Payment", page: "reverse-payment" }, { name: "Payment Reports", page: "payment-reports" },
    ],
    accountant: [
      { name: "Dashboard", page: "dashboard" }, { name: "Income", page: "fees-payments" }, { name: "Expenses", page: "expenses" },
      { name: "Payroll", page: "payroll" }, { name: "Budget", page: "expenses" }, { name: "Profit / Loss", page: "profit-loss" }, { name: "Tax Reports", page: "tax-reports" }, { name: "Financial Reports", page: "financial-reports" },
    ],
    librarian: [
      { name: "Dashboard", page: "dashboard" }, { name: "Books", page: "books" }, { name: "Borrow Books", page: "books" }, { name: "Return Books", page: "books" },
      { name: "Lost Books", page: "books" }, { name: "Fines", page: "books" }, { name: "Members", page: "library-members" }, { name: "Reports", page: "library-reports" },
    ],
    nurse: [
      { name: "Dashboard", page: "dashboard" }, { name: "Medical Records", page: "clinic" }, { name: "Clinic Visits", page: "clinic" },
      { name: "Medication", page: "clinic" }, { name: "Allergies", page: "clinic" }, { name: "Emergency Contacts", page: "clinic" }, { name: "Health Reports", page: "clinic" },
    ],
    hostel_master: [
      { name: "Dashboard", page: "dashboard" }, { name: "Hostels", page: "hostels" }, { name: "Rooms", page: "hostels" }, { name: "Bed Allocation", page: "hostels" },
      { name: "Hostel Attendance", page: "hostels" }, { name: "Visitors", page: "visitors" }, { name: "Reports", page: "hostel-reports" },
    ],
    hostel_mistress: [
      { name: "Dashboard", page: "dashboard" }, { name: "Hostels", page: "hostels" }, { name: "Rooms", page: "hostels" }, { name: "Bed Allocation", page: "hostels" },
      { name: "Hostel Attendance", page: "hostels" }, { name: "Visitors", page: "visitors" }, { name: "Reports", page: "hostel-reports" },
    ],
    transport_manager: [
      { name: "Dashboard", page: "dashboard" }, { name: "Vehicles", page: "transport" }, { name: "Drivers", page: "transport" }, { name: "Routes", page: "transport" },
      { name: "Student Allocation", page: "transport" }, { name: "Fuel Records", page: "transport-fuel" }, { name: "Maintenance", page: "transport-maintenance" }, { name: "Reports", page: "transport-reports" },
    ],
    receptionist: [
      { name: "Dashboard", page: "dashboard" }, { name: "Visitors Log", page: "visitors" }, { name: "Student Check-in/out", page: "visitors" },
      { name: "Staff Check-in", page: "staff-check-in" }, { name: "Appointments", page: "visitors" }, { name: "Calls / Messages", page: "reception-calls" }, { name: "Reports", page: "reception-reports" },
    ],
  };

  const menuItems =
    role === "super_admin"
      ? platformMenuItems
      : role === "organization_owner"
        ? organizationOwnerMenuItems
        : role === "proprietor"
          ? proprietorMenuItems
          : role === "principal"
            ? principalMenuItems
            : role === "parent"
              ? parentMenuItems
              : role === "student"
                ? studentMenuItems
                : roleMenuItems[role] || [{ name: "Dashboard", page: "dashboard" }];

  return (
    <>
      {open && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 1001,
          }}
        />
      )}

      <aside id="dono-sidebar"
        style={{
          width: 260,
          background: "#1e3a8a",
          color: "#fff",
          position: "fixed",
          top: 0,
          left: open ? 0 : -280,
          height: "100dvh",
          maxHeight: "100dvh",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          transition: "left 0.3s ease-in-out",
          zIndex: 1002,
          overflowY: "auto",
          boxShadow: "2px 0 20px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            padding: "20px 16px",
            fontSize: "22px",
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>DOONO De Creator</span>
          <button type="button"
            onClick={closeSidebar}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <nav style={{ padding: "10px 0" }}>
          {isOrganizationOwner && school && (
            <div
              onClick={backToOrganization}
              style={{
                padding: "14px 20px",
                cursor: "pointer",
                background: "rgba(16, 185, 129, 0.15)",
                borderBottom: "1px solid rgba(255,255,255,.15)",
                color: "#34d399",
                fontWeight: "700",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ← Back to Organization
            </div>
          )}
          {menuItems.map((item) => (
            <div
              key={item.page}
              onClick={() => {
                setPage(item.page);
                closeSidebar();
              }}
              style={{
                padding: "14px 20px",
                cursor: "pointer",
                background:
                  page === item.page
                    ? "#2563eb"
                    : "transparent",
                borderBottom:
                  "1px solid rgba(255,255,255,.05)",
                fontWeight: page === item.page ? "600" : "400",
                fontSize: "14px",
                transition: "background 0.2s",
              }}
            >
              {item.name}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
