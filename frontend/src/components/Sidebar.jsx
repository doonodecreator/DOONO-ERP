import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function Sidebar({
  page,
  setPage,
  open,
  closeSidebar,
}) {
  const { roles, isPlatformAdmin } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin });

  // Role-customized menu mapping according to system architecture
  const allMenuItems = [
    { name: "Dashboard", page: "dashboard", roles: ["all"] },
    { name: "Staff Management", page: "staff", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher"] },
    { name: "Students", page: "students", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "bursar", "accountant", "receptionist"] },
    { name: "Parents", page: "parents", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher", "receptionist", "bursar", "accountant"] },
    { name: "Teachers", page: "teachers", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher", "secondary_principal", "primary_headmaster", "nursery_head"] },
    { name: "Subjects", page: "subjects", roles: ["super_admin", "proprietor", "principal", "vice_principal", "secondary_principal", "primary_headmaster", "teacher"] },
    { name: "Classes", page: "classes", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher", "secondary_principal", "primary_headmaster", "nursery_head", "teacher"] },
    { name: "Streams", page: "streams", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher"] },
    { name: "Academic Sessions", page: "academic-sessions", roles: ["super_admin", "proprietor", "principal", "vice_principal"] },
    { name: "Terms", page: "terms", roles: ["super_admin", "proprietor", "principal", "vice_principal"] },
    { name: "Attendance", page: "attendance", roles: ["super_admin", "proprietor", "principal", "vice_principal", "head_teacher", "secondary_principal", "primary_headmaster", "nursery_head", "teacher"] },
    { name: "Results & Exams", page: "results", roles: ["super_admin", "proprietor", "principal", "vice_principal", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "student", "parent"] },
    { name: "Fees & Payments", page: "fees", roles: ["super_admin", "proprietor", "principal", "bursar", "accountant", "parent", "student"] },
    { name: "Timetable", page: "timetable", roles: ["super_admin", "proprietor", "principal", "vice_principal", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "student", "parent"] },
    { name: "Report Cards", page: "report-cards", roles: ["super_admin", "proprietor", "principal", "vice_principal", "secondary_principal", "primary_headmaster", "nursery_head", "teacher", "parent", "student"] },
    { name: "Promotion & Graduation", page: "promotions", roles: ["super_admin", "proprietor", "principal", "vice_principal", "secondary_principal", "primary_headmaster"] },
    { name: "Subscriptions", page: "subscriptions", roles: ["super_admin", "proprietor"] },
    { name: "Settings", page: "settings", roles: ["super_admin", "proprietor", "principal"] },
  ];

  // Filter items dynamically based on role
  const menuItems = allMenuItems.filter(
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
