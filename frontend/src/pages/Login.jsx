import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const loggedUser = {
  ...response.data.user,
  roles: response.data.roles,
  permissions: response.data.permissions,
};

login(response.data.token, loggedUser);

window.location.reload();
    } catch (err) {
      console.log(err);

      setError(
        err.message ||
        "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#eef2ff",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 380,
          background: "#fff",
          padding: 40,
          borderRadius: 20,
          boxShadow: "0 20px 40px rgba(0,0,0,.08)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#1e3a8a" }}>
          DONO School ERP
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: 30,
          }}
        >
          Sign in to continue
        </p>

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 20,
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            background: "#1e40af",
            color: "#fff",
            border: "none",
          }}
        >
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>
    </div>
  );
}
