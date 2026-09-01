import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const channels = ["in_app", "email", "sms", "push"];
const labels = { in_app: "In-app", email: "Email", sms: "SMS", push: "Push" };

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [schoolId, setSchoolId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/notification-preferences");
      setPreferences(Array.isArray(response?.data?.data) ? response.data.data : []);
      setSchoolId(response?.data?.school_id || null);
    } catch (reason) {
      setError(reason?.response?.data?.message || "Notification preferences could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function valueFor(type, channel, scoped) {
    const scope = scoped ? schoolId : null;
    const specific = preferences.find((item) => item.notification_type === type && item.channel === channel && (item.school_id || null) === scope);
    const fallback = preferences.find((item) => item.notification_type === "all" && item.channel === channel && (item.school_id || null) === scope);
    return (specific || fallback)?.is_enabled !== false;
  }

  async function setPreference(type, channel, enabled, scoped) {
    const key = `${type}:${channel}:${scoped ? "school" : "global"}`;
    setSaving(key);
    setError("");
    setMessage("");
    try {
      const response = await api.put("/notification-preferences", { notification_type: type, channel, is_enabled: enabled, school_id: scoped ? schoolId : null });
      const saved = response?.data?.data;
      setPreferences((current) => [...current.filter((item) => !(item.notification_type === saved.notification_type && item.channel === saved.channel && (item.school_id || null) === (saved.school_id || null))), saved]);
      setMessage("Notification preference saved.");
    } catch (reason) {
      setError(reason?.response?.data?.message || "Notification preference could not be saved.");
    } finally {
      setSaving("");
    }
  }

  const renderTable = (scoped) => <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Notification type</th>{channels.map((channel) => <th key={channel} className="p-4">{labels[channel]}</th>)}</tr></thead><tbody className="divide-y divide-slate-100"><tr><td className="p-4"><p className="font-semibold text-slate-900">All notifications</p><p className="text-xs text-slate-500">Default for this scope</p></td>{channels.map((channel) => { const key = `all:${channel}:${scoped ? "school" : "global"}`; return <td key={channel} className="p-4"><label className="flex items-center gap-2"><input type="checkbox" checked={valueFor("all", channel, scoped)} disabled={saving === key || (scoped && !schoolId)} onChange={(event) => setPreference("all", channel, event.target.checked, scoped)} /><span className="text-xs text-slate-600">{valueFor("all", channel, scoped) ? "On" : "Off"}</span></label></td>; })}</tr><tr><td className="p-4"><p className="font-semibold text-slate-900">School notices</p><p className="text-xs text-slate-500">Published communication</p></td>{channels.map((channel) => { const key = `notice:${channel}:${scoped ? "school" : "global"}`; return <td key={channel} className="p-4"><label className="flex items-center gap-2"><input type="checkbox" checked={valueFor("notice", channel, scoped)} disabled={saving === key || (scoped && !schoolId)} onChange={(event) => setPreference("notice", channel, event.target.checked, scoped)} /><span className="text-xs text-slate-600">{valueFor("notice", channel, scoped) ? "On" : "Off"}</span></label></td>; })}</tr></tbody></table></div>;

  return <PageContainer><PageHeader title="Notification Preferences" subtitle="Choose how DOONO should deliver notices. Defaults stay on until you deliberately change them." action={<button type="button" onClick={load} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Refresh</button>} />{error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}{message && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}{loading ? <LoadingSpinner text="Loading notification preferences..." /> : <div className="space-y-6"><section><h2 className="mb-2 text-lg font-bold text-slate-900">Global preferences</h2><p className="mb-3 text-sm text-slate-500">These apply everywhere unless the active school has its own preference.</p>{renderTable(false)}</section><section><h2 className="mb-2 text-lg font-bold text-slate-900">Active school preferences</h2><p className="mb-3 text-sm text-slate-500">{schoolId ? `These apply only to school #${schoolId}.` : "Select a school context to set school-specific preferences."}</p>{schoolId ? renderTable(true) : <EmptyState title="No active school" message="Global preferences are still available. Select a school when you need school-specific delivery settings." />}</section></div>}</PageContainer>;
}
