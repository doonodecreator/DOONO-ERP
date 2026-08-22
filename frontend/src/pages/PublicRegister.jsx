import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PublicShell from "../components/layout/PublicShell";
import "./PublicAuth.css";

export default function PublicRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    admin_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/register", formData);
      if (response?.data?.verification_required) {
        navigate(`/verify-email?email=${encodeURIComponent(response.data.email || formData.email)}`, { replace: true });
        return;
      }
      if (response?.data?.token) await login(response.data.token);
      navigate("/");
    } catch (requestError) {
      setError(requestError.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell current="register" className="dono-auth-shell" footerTheme="dark">
      <section className="dono-auth-section" aria-labelledby="register-title">
        <form className="dono-auth-card dono-register-card" onSubmit={handleSubmit}>
          <div className="dono-auth-heading">
            <span className="dono-auth-kicker">Start your school workspace</span>
            <h1 id="register-title">Create your organization</h1>
            <p>Set up the owner account first. You can configure the school and invite staff after verification.</p>
          </div>

          {error && <div className="dono-auth-error" role="alert">{error}</div>}

          <div className="dono-auth-fields dono-register-fields">
            <label htmlFor="organization-name">Organization name</label>
            <input id="organization-name" name="name" value={formData.name} onChange={handleChange} required autoComplete="organization" />
            <label htmlFor="organization-code">Organization code <span>(optional)</span></label>
            <input id="organization-code" name="code" value={formData.code} onChange={handleChange} autoComplete="off" />
            <label htmlFor="administrator-name">Administrator name</label>
            <input id="administrator-name" name="admin_name" value={formData.admin_name} onChange={handleChange} required autoComplete="name" />
            <label htmlFor="registration-email">Email address</label>
            <input id="registration-email" type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
            <label htmlFor="registration-phone">Phone number <span>(optional)</span></label>
            <input id="registration-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" />
            <label htmlFor="registration-password">Password</label>
            <input id="registration-password" type="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="new-password" />
            <label htmlFor="registration-password-confirmation">Confirm password</label>
            <input id="registration-password-confirmation" type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required autoComplete="new-password" />
          </div>

          <button type="submit" disabled={loading} className="dono-auth-submit">{loading ? "Creating organization…" : "Create organization"}</button>
        </form>
      </section>
    </PublicShell>
  );
}
