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
    "guest";

  const menuItems = [
    { name: "Dashboard", page: "dashboard" },
    { name: "Students", page: "students" },
    { name: "Parents", page: "parents" },
    { name: "Teachers", page: "teachers" },
    { name: "Subjects", page: "subjects" },
    { name: "Classes", page: "classes" },
    { name: "Streams", page: "streams" },
    { name: "Academic Sessions", page: "academic-sessions" },
    { name: "Terms", page: "terms" },
    { name: "Attendance", page: "attendance" },
    { name: "Results & Exams", page: "results" },
    { name: "Enter Results", page: "result-entry" },
    { name: "Fees & Payments", page: "fees" },
    { name: "Timetable", page: "timetable" },
    { name: "Report Cards", page: "report-cards" },
    { name: "Promotion & Graduation", page: "promotions" },

    ...(role === "super_admin"
      ? [
          {
            name: "Subscriptions",
            page: "subscriptions",
          },
        ]
      : []),

    { name: "Settings", page: "settings" },
  ];

  return (
    <>
      {open && (
        <div
          onClick={closeSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            zIndex: 998,
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
          transition: "0.3s",
          zIndex: 999,
          overflowY: "auto",
          boxShadow: "2px 0 20px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            padding: 20,
            fontSize: 24,
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255,255,255,.15)",
          }}
        >
          DONO ERP
        </div>

        {menuItems.map((item) => (
          <div
            key={item.page}
            onClick={() => {
              setPage(item.page);
              closeSidebar();
            }}
            style={{
              padding: "15px 20px",
              cursor: "pointer",
              background:
                page === item.page
                  ? "#2563eb"
                  : "transparent",
              borderBottom:
                "1px solid rgba(255,255,255,.08)",
            }}
          >
            {item.name}
          </div>
        ))}
      </aside>
    </>
  );
}
