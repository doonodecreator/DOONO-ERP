import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell";
import "./PublicAuth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const invitedEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      await login(response.data.token);
      if (returnTo) navigate(returnTo, { replace: true });
    } catch (requestError) {
      const code = requestError?.response?.data?.code;
      if (code === "EMAIL_VERIFICATION_REQUIRED") {
        navigate(`/verify-email?email=${encodeURIComponent(requestError?.response?.data?.email || email)}`);
        return;
      }
      setError(requestError.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell current="login" className="dono-auth-shell" footerTheme="dark">
      <section className="dono-auth-section" aria-labelledby="login-title">
        <form className="dono-auth-card" onSubmit={handleSubmit}>
          <div className="dono-auth-heading">
            <span className="dono-auth-kicker">Secure school access</span>
            <h1 id="login-title">Sign in to DOONO</h1>
            <p>Continue to your organization or school workspace.</p>
          </div>

          {returnTo && (
            <div className="dono-auth-notice" role="status">
              This sign-in is for an existing DOONO account. After successful login, you will return to the invitation and activate the school role. If this is your first DOONO account, go back and choose <strong>Create Account and Accept Role</strong> instead.
            </div>
          )}

          {error && <div className="dono-auth-error" role="alert">{error}</div>}

          <div className="dono-auth-fields">
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          <button type="submit" className="dono-auth-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          <button type="button" className="dono-auth-link" onClick={() => navigate(`/forgot-password?email=${encodeURIComponent(email)}`)}>Forgot password?</button>
        </form>
      </section>
    </PublicShell>
  );
}
