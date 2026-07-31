import { useAuth } from "../context/AuthContext";

export default function Navbar() {
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
    <div
      style={{
        background: "white",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>Dashboard</h2>

        <p
          style={{
            margin: 0,
            color: "#666",
          }}
        >
          Welcome to DONO ERP
        </p>
      </div>

      <div
        style={{
          background: "#1e3a8a",
          color: "white",
          padding: "12px 18px",
          borderRadius: "50px",
          fontWeight: "bold",
        }}
      >
        {roleLabel}
      </div>
    </div>
  );
}
