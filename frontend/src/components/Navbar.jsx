import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug, formatRoleLabel } from "../utils/role";

export default function Navbar({ onMenuClick }) {
  const { user, roles, isPlatformAdmin } = useAuth();

  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin });
  const roleLabel = formatRoleLabel(role);

  return (
    <header
      style={{
        background: "#ffffff",
        height: "65px",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        gap: "10px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        <button
          onClick={onMenuClick}
          style={{
            fontSize: "24px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#1e3a8a",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-label="Toggle Navigation"
        >
          ☰
        </button>

        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "700",
              color: "#1e3a8a",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            DONO ERP
          </h2>

          <small
            style={{
              color: "#64748b",
              fontSize: "11px",
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "140px",
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
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          🔔
        </div>

        <div
          style={{
            background: "#1e3a8a",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "20px",
            fontWeight: "600",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          {roleLabel}
        </div>

        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#2563eb",
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: "15px",
            flexShrink: 0,
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || "G"}
        </div>
      </div>
    </header>
  );
}
