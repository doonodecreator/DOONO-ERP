import { useEffect, useState } from "react";
import api, { getApiBaseUrl } from "../services/api";
import { arrayFromResponse } from "../utils/response";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import "./PlatformEmailCenter.css";

const emptyForm = { subject: "", body: "", action_url: "", action_label: "", audience: "all", target_role: "", target_school_ids: [], target_user_ids: [] };
const audienceLabels = { all: "Everyone using DONO", role: "One role across all schools", school: "Everyone in selected schools", role_school: "One role in selected schools", users: "Selected user IDs" };

function resolveInboxActionUrl(value) {
  if (!value || typeof value !== "string" || typeof window === "undefined") return value || "";
  try {
    const url = new URL(value, window.location.origin);
    const apiOrigin = new URL(getApiBaseUrl(), window.location.origin).origin;
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname)) {
      url.protocol = new URL(apiOrigin).protocol;
      url.host = new URL(apiOrigin).host;
    }
    return url.toString();
  } catch {
    return value;
  }
}

function rewriteInboxBody(value) {
  if (!value || typeof value !== "string") return value || "";
  return value.replace(/https?:\/\/(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|\[::1\])(?::\\d+)?(\/api\/v1\/[^\s]+)/gi, (_, path) => resolveInboxActionUrl(path));
}

export default function PlatformEmailCenter() {
  const [settings, setSettings] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [localMessages, setLocalMessages] = useState([]);
  const [roles, setRoles] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [testEmail, setTestEmail] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const responses = await Promise.allSettled([
        api.get("/system-settings"),
        api.get("/platform-announcements"),
        api.get("/platform-email/status"),
        api.get("/local-email-messages", { params: { per_page: 100 } }),
        api.get("/roles"),
        api.get("/schools", { params: { per_page: 200 } }),
      ]);
      if (responses[0].status === "fulfilled") setSettings(responses[0].value?.data?.data || responses[0].value?.data || {});
      if (responses[1].status === "fulfilled") setAnnouncements(arrayFromResponse(responses[1].value));
      if (responses[2].status === "fulfilled") setEmailStatus(responses[2].value?.data?.data || responses[2].value?.data || null);
      if (responses[3].status === "fulfilled") setLocalMessages(arrayFromResponse(responses[3].value));
      if (responses[4].status === "fulfilled") setRoles(arrayFromResponse(responses[4].value));
      if (responses[5].status === "fulfilled") setSchools(arrayFromResponse(responses[5].value));
      if (responses.every((result) => result.status === "rejected")) throw responses[0].reason;
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load platform email controls.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function saveNotifications(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      await api.put("/system-settings", { email_notifications: Boolean(settings?.email_notifications), sms_notifications: Boolean(settings?.sms_notifications), local_email_mode: settings?.local_email_mode !== false });
      setMessage("Email settings saved."); await load();
    } catch (requestError) { setError(requestError?.response?.data?.message || "Unable to save email settings."); } finally { setSaving(false); }
  }

  async function sendTest(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const response = await api.post("/platform-email/test", { email: testEmail.trim().toLowerCase() }); setMessage(response?.data?.message || "Test message saved."); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to create test message."); }
    finally { setSaving(false); }
  }

  async function previewRecipients() {
    setSaving(true); setError(""); setPreview(null);
    try { const response = await api.post("/platform-announcements/preview-recipients", { audience: form.audience, target_role: form.target_role || null, target_school_ids: form.target_school_ids, target_user_ids: form.target_user_ids }); setPreview(response?.data?.data || null); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to calculate recipients."); }
    finally { setSaving(false); }
  }

  async function saveAnnouncement(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const response = await api.post("/platform-announcements", form); setForm(emptyForm); setPreview(null); setMessage(response?.data?.message || "Announcement saved as draft."); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to save announcement."); }
    finally { setSaving(false); }
  }

  async function sendAnnouncement(announcement) {
    if (!window.confirm(`Send “${announcement.subject}” to ${announcement.recipient_count || 0} verified recipients?`)) return;
    setSaving(true); setError(""); setMessage("");
    try { const response = await api.post(`/platform-announcements/${announcement.id}/send`); setMessage(response?.data?.message || "Announcement processed."); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to send announcement."); }
    finally { setSaving(false); }
  }

  async function deleteAnnouncement(announcement) {
    if (!window.confirm("Delete this announcement draft?")) return;
    try { await api.delete(`/platform-announcements/${announcement.id}`); setMessage("Announcement draft deleted."); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to delete announcement draft."); }
  }

  async function openMessage(localMessage) {
    setSelectedMessage(localMessage);
    if (!localMessage.read_at) {
      try { await api.post(`/local-email-messages/${localMessage.id}/read`); setLocalMessages((current) => current.map((item) => item.id === localMessage.id ? { ...item, read_at: new Date().toISOString() } : item)); }
      catch { /* Opening a local test message should remain usable even if read tracking fails. */ }
    }
  }

  async function clearInbox() {
    if (!window.confirm("Delete all local test messages?")) return;
    try { await api.delete("/local-email-messages"); setSelectedMessage(null); setMessage("Local Test Inbox cleared."); await load(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to clear local inbox."); }
  }

  function toggleSchool(id) {
    const schoolId = Number(id);
    setForm((current) => ({ ...current, target_school_ids: current.target_school_ids.includes(schoolId) ? current.target_school_ids.filter((value) => value !== schoolId) : [...current.target_school_ids, schoolId] }));
  }

  const roleOptions = Array.isArray(roles) ? roles.filter((role, index, list) => role?.slug && list.findIndex((item) => item.slug === role.slug) === index) : [];
  const schoolOptions = Array.isArray(schools) ? schools : [];
  const localMode = emailStatus?.local_email_mode !== false;

  if (loading) return <LoadingSpinner text="Loading platform email controls..." />;

  return <div className="space-y-6">{error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={load} className="ml-2 font-semibold underline">Retry</button></div>}{message && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
    <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-indigo-950">Local Test Inbox</h2><p className="mt-1 text-sm text-indigo-800">{localMode ? "Local mode is active. Messages stay inside DONO and no external email is sent." : "Real delivery mode is active. Messages will use the configured mail transport."}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${localMode ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{localMode ? "LOCAL TEST MODE" : "REAL DELIVERY MODE"}</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-indigo-900">{localMessages.length} local messages available</p><button type="button" onClick={clearInbox} className="rounded-lg border border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-900">Clear inbox</button></div>{localMessages.length === 0 ? <div className="mt-4 rounded-lg border border-dashed border-indigo-300 bg-white/60 p-5"><EmptyState title="No test messages yet" message="Register an account, request a password reset, send a test message, or send an announcement to see it here." /></div> : <div className="mt-4 grid gap-3">{localMessages.map((item) => <button type="button" key={item.id} onClick={() => openMessage(item)} className={`w-full rounded-lg border bg-white p-4 text-left ${item.read_at ? "border-slate-200" : "border-indigo-400 shadow-sm"}`}><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-900">{item.subject}</p><p className="mt-1 text-xs text-slate-500">To: {item.recipient_email} · {item.message_type}</p></div><span className="text-xs text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</span></div></button>)}</div>}</section>
    {selectedMessage && <section className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Local test message</p><h2 className="mt-1 text-xl font-bold text-slate-900">{selectedMessage.subject}</h2><p className="mt-1 text-sm text-slate-500">To: {selectedMessage.recipient_email}</p></div><button type="button" onClick={() => setSelectedMessage(null)} className="text-sm font-semibold text-slate-500 underline">Close</button></div><div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">{rewriteInboxBody(selectedMessage.body_text)}</div>{selectedMessage.action_data?.action_url && <a href={resolveInboxActionUrl(selectedMessage.action_data.action_url)} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">{selectedMessage.action_data.action_label || "Open action link"}</a>}</section>}
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Email mode and provider status</h2><p className="mt-1 text-sm text-slate-500">Keep Local Test Mode enabled while testing on your phone. No provider key is needed.</p><div className="mt-4 grid gap-3 sm:grid-cols-4"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Mode</p><p className="mt-1 font-semibold">{localMode ? "Local Test Inbox" : "Real delivery"}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Mailer</p><p className="mt-1 font-semibold">{emailStatus?.mailer || "Not used locally"}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">From address</p><p className="mt-1 break-all font-semibold">{emailStatus?.from_address || "Local only"}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">Status</p><p className={`mt-1 font-semibold ${emailStatus?.configured ? "text-emerald-700" : "text-amber-700"}`}>{emailStatus?.configured ? "Ready" : "Local testing"}</p></div></div></section>
    <form onSubmit={saveNotifications} className="platform-email-settings-form rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Notification preferences</h2><div className="platform-email-toggle-list mt-4"><label className="platform-email-toggle-row"><input type="checkbox" checked={Boolean(settings?.email_notifications)} onChange={(event) => setSettings({ ...settings, email_notifications: event.target.checked })} /><span>Enable email notifications</span></label><label className="platform-email-toggle-row"><input type="checkbox" checked={settings?.local_email_mode !== false} onChange={(event) => setSettings({ ...settings, local_email_mode: event.target.checked })} /><span>Local Test Mode</span></label><label className="platform-email-toggle-row"><input type="checkbox" checked={Boolean(settings?.sms_notifications)} onChange={(event) => setSettings({ ...settings, sms_notifications: event.target.checked })} /><span>Enable SMS notifications</span></label></div><button type="submit" disabled={saving} className="platform-email-save-button mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save settings"}</button></form>
    <form onSubmit={sendTest} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Create test message</h2><p className="mt-1 text-sm text-slate-500">In Local Test Mode this creates a message in the inbox, not an external email.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input required type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="test-recipient@example.com" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" /><button type="submit" disabled={saving} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create test message</button></div></form>
    <form onSubmit={saveAnnouncement} className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-5"><div><h2 className="font-bold text-indigo-950">Software-owner announcement</h2><p className="mt-1 text-sm text-indigo-800">Choose exactly who should receive this announcement. Only verified accounts are counted.</p></div><input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Announcement subject" className="w-full rounded-lg border bg-white px-3 py-2 text-sm" /><textarea required rows={6} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Write the announcement..." className="w-full rounded-lg border bg-white px-3 py-2 text-sm" /><div className="grid gap-3 sm:grid-cols-2"><input type="url" value={form.action_url} onChange={(event) => setForm({ ...form, action_url: event.target.value })} placeholder="Optional action link" className="rounded-lg border bg-white px-3 py-2 text-sm" /><input value={form.action_label} onChange={(event) => setForm({ ...form, action_label: event.target.value })} placeholder="Button label" className="rounded-lg border bg-white px-3 py-2 text-sm" /></div><label className="block text-sm font-semibold text-indigo-950">Audience<select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value, target_role: event.target.value === "role" || event.target.value === "role_school" ? form.target_role : "" })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal">{Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{(form.audience === "role" || form.audience === "role_school") && <label className="block text-sm font-semibold text-indigo-950">Role<select required value={form.target_role} onChange={(event) => setForm({ ...form, target_role: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal"><option value="">Select a role</option>{roleOptions.map((role) => <option key={role.slug} value={role.slug}>{role.name || role.slug}</option>)}</select></label>}{(form.audience === "school" || form.audience === "role_school") && <div><p className="text-sm font-semibold text-indigo-950">Schools</p><div className="mt-2 grid max-h-44 gap-2 overflow-y-auto rounded-lg border bg-white p-3 sm:grid-cols-2">{schoolOptions.length === 0 ? <p className="text-sm text-slate-500">No schools available.</p> : schoolOptions.map((school) => <label key={school.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.target_school_ids.includes(Number(school.id))} onChange={() => toggleSchool(school.id)} />{school.name}</label>)}</div></div>}{form.audience === "users" && <label className="block text-sm font-semibold text-indigo-950">User IDs<input value={(form.target_user_ids || []).join(",")} onChange={(event) => setForm({ ...form, target_user_ids: event.target.value.split(",").map((value) => Number(value.trim())).filter(Boolean) })} placeholder="Example: 12, 18, 25" className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal" /><span className="mt-1 block text-xs font-normal text-indigo-800">Use this only for controlled testing. The recipient preview will show the selected accounts.</span></label>}<div className="flex flex-wrap items-center gap-3"><button type="button" disabled={saving} onClick={previewRecipients} className="rounded-lg border border-indigo-400 bg-white px-4 py-2 text-sm font-semibold text-indigo-900">Preview recipients</button>{preview && <span className="text-sm font-semibold text-indigo-950">{preview.count} verified recipient(s)</span>}</div>{preview?.sample?.length > 0 && <div className="rounded-lg bg-white p-3 text-xs text-slate-600">Sample: {preview.sample.map((person) => `${person.name} (${person.email})`).join(" · ")}</div>}<button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save announcement draft</button></form>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Announcement history</h2>{announcements.length === 0 ? <EmptyState title="No announcements" message="Drafts and sent platform announcements will appear here." /> : <div className="mt-3 space-y-3">{announcements.map((announcement) => <article key={announcement.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{announcement.subject}</h3><p className="mt-1 text-xs text-slate-500">{announcement.status} · {announcement.recipient_count || 0} recipients{announcement.sent_at ? ` · Sent ${new Date(announcement.sent_at).toLocaleString()}` : ""}</p></div><div className="flex gap-2">{announcement.status === "draft" && <><button type="button" disabled={saving} onClick={() => sendAnnouncement(announcement)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Send now</button><button type="button" onClick={() => deleteAnnouncement(announcement)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button></>}</div></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{announcement.body}</p></article>)}</div>}</section>
  </div>;
}
