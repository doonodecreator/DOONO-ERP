
export default function Sidebar({ page, setPage }) {
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
    { name: "Report Cards", page: "report-cards" },
    { name: "Fees & Payments", page: "fees" },
    { name: "Timetable", page: "timetable" },
    { name: "Promotion & Graduation", page: "promotions" },
    { name: "Subscriptions", page: "subscriptions" },
    { name: "Settings", page: "settings" },
  ];

  return (
    <div
      style={{
        width: "250px",
        background: "#1e3a8a",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ marginBottom: "40px" }}>DONO ERP</h2>

      {menuItems.map((menu) => (
        <div
          key={menu.page}
          onClick={() => setPage(menu.page)}
          style={{
            padding: "15px 10px",
            marginBottom: "10px",
            borderRadius: "10px",
            cursor: "pointer",
            background:
              page === menu.page
                ? "#2563eb"
                : "transparent",
          }}
        >
          {menu.name}
        </div>
      ))}
    </div>
  );
}
