import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DashboardLayout({
  children,
  page,
  setPage,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f1f5f9",
      }}
    >
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
        />

        <main
          style={{
            padding: "20px",
            flex: 1,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
