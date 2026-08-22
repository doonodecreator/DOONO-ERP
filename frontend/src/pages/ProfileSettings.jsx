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
    </PageContainer>
  );
}
