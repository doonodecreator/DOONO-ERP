import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function Sidebar({
  page,
  setPage,
  open,
  closeSidebar,
}) {
  const { roles, isPlatformAdmin, isOrganizationOwner } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner });

  // Platform Owner gets a distinct menu — not the school-operational list.
  // Per the architecture diagram: Dashboard, Organizations, Schools,
  // Subscriptions, System Settings, Audit Logs.
  // NOTE: pages marked "not yet built" fall back to the generic Dashboard
  // until their real pages exist — listed here so they're visible in nav,
  // not hidden, but they won't do anything real until built.
  const platformMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Organizations", page: "organizations" }, // page not yet built
    { name: "Schools", page: "schools" },              // page not yet built
    { name: "Subscriptions", page: "subscriptions" },
    { name: "System Settings", page: "settings" },
    { name: "Audit Logs", page: "audit-logs" },        // page not yet built
  ];

  const allMenuItems = [
    { name: "Dashboard", page: "dashboard", roles: ["all"] },
    { name: "Staff Management", page: "staff", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin"] },
    { name: "Students", page: "students", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "bursar", "accountant", "receptionist"] },
    { name: "Admissions", page: "admissions", roles: ["proprietor", "principal", "vice_principal_admin"] },
    { name: "Enrollment & Placement", page: "student-enrollments", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin"] },
    { name: "Parents", page: "parents", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin", "receptionist", "bursar", "accountant"] },
    { name: "Teachers", page: "teachers", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin", "secondary_principal", "primary_headmaster", "nursery_head"] },
    { name: "Subjects", page: "subjects", roles: ["proprietor", "principal", "vice_principal_academic", "secondary_principal", "primary_headmaster", "teacher", "form_teacher"] },
    { name: "Classes", page: "classes", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "form_teacher"] },
    { name: "Streams", page: "streams", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin"] },
    { name: "Academic Sessions", page: "academic-sessions", roles: ["proprietor", "principal", "vice_principal_academic"] },
    { name: "Terms", page: "terms", roles: ["proprietor", "principal", "vice_principal_academic"] },
    { name: "Attendance", page: "attendance", roles: ["proprietor", "principal", "vice_principal_academic", "vice_principal_admin", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "form_teacher"] },
    { name: "Results & Exams", page: "results", roles: ["proprietor", "principal", "vice_principal_academic", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "student", "parent"] },
    { name: "Fees & Payments", page: "fees", roles: ["proprietor", "principal", "bursar", "accountant", "parent", "student"] },
    { name: "Timetable", page: "timetable", roles: ["proprietor", "principal", "vice_principal_academic", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "student", "parent"] },
    { name: "Report Cards", page: "report-cards", roles: ["proprietor", "principal", "vice_principal_academic", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "parent", "student"] },
    { name: "Promotion & Graduation", page: "promotions", roles: ["proprietor", "principal", "vice_principal_academic", "secondary_principal", "primary_headmaster"] },
    { name: "Subscriptions", page: "subscriptions", roles: ["proprietor"] },
    { name: "Settings", page: "settings", roles: ["proprietor", "principal"] },
  ];

  const organizationOwnerMenuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "My Schools", page: "schools" },
  ];

  const menuItems =
    role === "super_admin"
      ? platformMenuItems
      : role === "organization_owner"
        ? organizationOwnerMenuItems
        : allMenuItems.filter(
          (item) => item.roles.includes("all") || item.roles.includes(role)
        );

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

      <aside
        style={{
          width: 260,
          background: "#1e3a8a",
          color: "#fff",
          position: "fixed",
          top: 0,
          left: open ? 0 : -280,
          height: "100vh",
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
          <span>DONO ERP</span>
          <button
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
