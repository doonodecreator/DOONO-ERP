import { useEffect, useMemo, useState } from "react";
import api, { resolveMediaUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";
import "./ProfileSettings.css";

function initials(name = "User") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export default function ProfileSettings() {
  const { user, refreshContext } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [mfaStatus, setMfaStatus] = useState(null);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUri, setMfaUri] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [mfaPassword, setMfaPassword] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  const previewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (removeAvatar) return "";
    return resolveMediaUrl(user?.avatar_url);
  }, [avatarFile, removeAvatar, user?.avatar_url]);

  useEffect(() => {
    setPreviewFailed(false);
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadSessions = async () => {
    try {
      setSessionLoading(true);
      const response = await api.get("/me/sessions");
      const data = response?.data?.data;
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionLoading(false);
    }
  };

  async function loadMfa() {
    try { const response = await api.get("/me/mfa"); setMfaStatus(response?.data?.data || null); } catch { setMfaStatus(null); }
  }

  useEffect(() => { loadSessions(); loadMfa(); }, []);

  async function revokeSession(id) {
    try {
      await api.delete(`/me/sessions/${id}`);
      setSessionMessage("The selected session was revoked.");
      await loadSessions();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to revoke that session.");
    }
  }

  async function startMfaSetup() {
    setMfaBusy(true); setError(""); setRecoveryCodes([]);
    try { const response = await api.post("/me/mfa/setup"); setMfaSecret(response?.data?.data?.secret || ""); setMfaUri(response?.data?.data?.otpauth_uri || ""); setMessage("MFA setup started. Add the secret to an authenticator app, then confirm its current code."); } catch (err) { setError(err?.response?.data?.message || "Unable to start MFA setup."); } finally { setMfaBusy(false); }
  }

  async function confirmMfa(event) {
    event.preventDefault(); setMfaBusy(true); setError("");
    try { const response = await api.post("/me/mfa/confirm", { code: mfaCode.trim() }); setRecoveryCodes(Array.isArray(response?.data?.data?.recovery_codes) ? response.data.data.recovery_codes : []); setMfaSecret(""); setMfaUri(""); setMfaCode(""); setMessage(response?.data?.message || "MFA enabled."); await loadMfa(); } catch (err) { setError(err?.response?.data?.message || "The authenticator code could not be confirmed."); } finally { setMfaBusy(false); }
  }

  async function disableMfa(event) {
    event.preventDefault(); setMfaBusy(true); setError("");
    try { await api.delete("/me/mfa", { data: { current_password: mfaPassword, code: mfaCode.trim() } }); setMfaPassword(""); setMfaCode(""); setMessage("MFA disabled."); await loadMfa(); } catch (err) { setError(err?.response?.data?.message || "MFA could not be disabled."); } finally { setMfaBusy(false); }
  }

  async function revokeOtherSessions() {
    try {
      const response = await api.delete("/me/sessions");
      setSessionMessage(response?.data?.message || "Other sessions were revoked.");
      await loadSessions();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to revoke other sessions.");
    }
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      if (avatarFile) formData.append("avatar", avatarFile);
      if (removeAvatar && !avatarFile) formData.append("remove_avatar", "1");

      await api.post("/me/profile", formData);
      const refreshedContext = await refreshContext();
      if (avatarFile && !refreshedContext?.user?.avatar_url) {
        throw new Error("The profile was saved, but the picture was not persisted. Please try again.");
      }
      setAvatarFile(null);
      setRemoveAvatar(false);
      setAvatarInputKey((current) => current + 1);
      setMessage("Your profile was updated successfully.");
    } catch (err) {
      const validation = err?.response?.data?.errors || err?.errors;
      const firstError = validation ? Object.values(validation).flat()?.[0] : null;
      setError(firstError || err?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <PageContainer><EmptyState title="Profile unavailable" message="Sign in again to manage your profile." /></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader title="My Profile" subtitle="Keep your identity and profile picture current across DOONO De Creator ERP." />
      {loading ? <LoadingSpinner text="Loading profile..." /> : (
        <SectionCard title="Account identity" subtitle="Your email is tied to your account and cannot be changed from this screen.">
          <form onSubmit={save} className="profile-settings-form">
            <div className="profile-settings-identity">
              <div className="profile-settings-avatar" aria-label={`${user.name || "User"} profile picture`}>
                {previewUrl && !previewFailed ? <img src={previewUrl} alt="Profile" onError={() => setPreviewFailed(true)} /> : <span>{initials(name || user.name)}</span>}
              </div>
              <div>
                <p className="profile-settings-name">{user.name || "User"}</p>
                <p className="profile-settings-email">{user.email}</p>
                <p className="profile-settings-help">Use a clear square JPG, PNG, or WebP image up to 5 MB.</p>
              </div>
            </div>

            <FormField label="Full name" htmlFor="profile-name" required>
              <input id="profile-name" required value={name} onChange={(event) => setName(event.target.value)} maxLength={255} />
            </FormField>
            <FormField label="Profile picture" htmlFor="profile-avatar" hint="Optional. This appears in the authenticated header and your account context.">
              <input key={avatarInputKey} id="profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setAvatarFile(event.target.files?.[0] || null); setRemoveAvatar(false); }} />
            </FormField>
            {user.avatar_url && !avatarFile && <label className="profile-settings-remove"><input type="checkbox" checked={removeAvatar} onChange={(event) => setRemoveAvatar(event.target.checked)} /> Remove current profile picture</label>}

            {error && <div className="profile-settings-feedback profile-settings-feedback-error" role="alert">{error}</div>}
            {message && <div className="profile-settings-feedback profile-settings-feedback-success" role="status">{message}</div>}
            <FormActions>
              <Button type="submit" variant="primary" loading={saving}>Save profile</Button>
            </FormActions>
          </form>
        </SectionCard>
      )}
      <SectionCard title="Active sessions" subtitle="Review the devices using your account. Revoke sessions you no longer recognize.">
        {sessionLoading ? <LoadingSpinner text="Loading sessions..." /> : sessions.length === 0 ? <EmptyState title="No sessions available" message="Sign in again if you need to create a new session." /> : <div className="space-y-3"><div className="flex justify-end"><Button variant="secondary" onClick={revokeOtherSessions} disabled={sessions.filter((session) => !session.current).length === 0}>Sign out other sessions</Button></div>{sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{session.name || "API session"} {session.current && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">Current</span>}</p><p className="text-sm text-slate-600">Created {session.created_at ? new Date(session.created_at).toLocaleString() : "unknown"}{session.last_used_at ? ` · Last used ${new Date(session.last_used_at).toLocaleString()}` : ""}</p></div>{!session.current && <Button variant="danger" size="sm" onClick={() => revokeSession(session.id)}>Revoke</Button>}</div>)}</div>}
        {sessionMessage && <div className="mt-3 profile-settings-feedback profile-settings-feedback-success" role="status">{sessionMessage}</div>}
      </SectionCard>
      <SectionCard title="Multi-factor authentication" subtitle="Protect sign-in with a time-based authenticator code. DOONO never stores the authenticator secret in plain API responses after setup.">
        {recoveryCodes.length > 0 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><h3 className="font-bold text-amber-900">Save these recovery codes now</h3><p className="mt-1 text-sm text-amber-800">Each code works once if you lose access to your authenticator. They will not be shown again.</p><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-amber-950 sm:grid-cols-4">{recoveryCodes.map((code) => <span key={code} className="rounded bg-white px-2 py-1 text-center">{code}</span>)}</div></div>}
        {mfaStatus?.enabled ? <form onSubmit={disableMfa} className="space-y-3"><p className="text-sm text-emerald-700">MFA is enabled{mfaStatus.recovery_codes_remaining !== undefined ? ` with ${mfaStatus.recovery_codes_remaining} recovery codes remaining.` : "."}</p><div className="grid gap-3 md:grid-cols-2"><input type="password" autoComplete="current-password" value={mfaPassword} onChange={(event) => setMfaPassword(event.target.value)} placeholder="Current password" className="ui-form-control" required /><input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="Authenticator or recovery code" className="ui-form-control" required /></div><Button type="submit" variant="danger" loading={mfaBusy}>Disable MFA</Button></form> : mfaSecret ? <form onSubmit={confirmMfa} className="space-y-3"><p className="text-sm text-slate-600">Add this secret to a TOTP authenticator app. If your app accepts an otpauth URI, use the value below.</p><code className="block overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-white">{mfaSecret}</code><code className="block overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{mfaUri}</code><div className="flex flex-col gap-3 sm:flex-row"><input inputMode="numeric" autoComplete="one-time-code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} placeholder="6-digit authenticator code" className="ui-form-control" required /><Button type="submit" variant="primary" loading={mfaBusy}>Confirm and enable MFA</Button></div></form> : <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">MFA is not enabled on this account.</p><Button variant="secondary" onClick={startMfaSetup} loading={mfaBusy}>Set up authenticator</Button></div>}
      </SectionCard>
    </PageContainer>
  );
}
