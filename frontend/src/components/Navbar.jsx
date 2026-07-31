import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  const role =
    user?.role ||
    user?.roles?.[0]?.slug ||
    user?.roles?.[0]?.name ||
    "Guest";

  const roleLabel =
    role === "super_admin"
      ? "Software Owner"
      : role
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header
      style={{
        background: "#ffffff",
        height: "70px",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <button
          onClick={onMenuClick}
          style={{
            fontSize: "26px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#1e3a8a",
          }}
        >
          ☰
        </button>

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              color: "#1e3a8a",
            }}
          >
            DONO ERP
          </h2>

          <small
            style={{
              color: "#64748b",
            }}
          >
            Welcome, {user?.name || "Guest"}
          </small>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          🔔
        </div>

        <div
          style={{
            background: "#1e3a8a",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: "30px",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          {roleLabel}
        </div>

        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#2563eb",
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || "G"}
        </div>
      </div>
    </header>
  );
}
