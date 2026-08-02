import { useAuth } from "../context/AuthContext";

export default function Sidebar({
  page,
  setPage,
  open,
  closeSidebar,
}) {
  const { user } = useAuth();

  const role =
    user?.role ||
    user?.roles?.[0]?.slug ||
    user?.roles?.[0]?.name ||
    "guest";

  // Strict 17-item order according to system specification
  const allMenuItems = [
    { name: "Dashboard", page: "dashboard", roles: ["all"] },
    { name: "Students", page: "students", roles: ["all"] },
    { name: "Parents", page: "parents", roles: ["all"] },
    { name: "Teachers", page: "teachers", roles: ["all"] },
    { name: "Subjects", page: "subjects", roles: ["all"] },
    { name: "Classes", page: "classes", roles: ["all"] },
    { name: "Streams", page: "streams", roles: ["all"] },
    { name: "Academic Sessions", page: "academic-sessions", roles: ["all"] },
    { name: "Terms", page: "terms", roles: ["all"] },
    { name: "Attendance", page: "attendance", roles: ["all"] },
    { name: "Results & Exams", page: "results", roles: ["all"] },
    { name: "Fees & Payments", page: "fees", roles: ["all"] },
    { name: "Timetable", page: "timetable", roles: ["all"] },
    { name: "Report Cards", page: "report-cards", roles: ["all"] },
    { name: "Promotion & Graduation", page: "promotions", roles: ["all"] },
    { name: "Subscriptions", page: "subscriptions", roles: ["super_admin"] },
    { name: "Settings", page: "settings", roles: ["all"] },
  ];

  // Role filter check
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
