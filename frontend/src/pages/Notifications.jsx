import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";

function notificationItems(response) {
  const value = response?.data?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/notifications", { params: { per_page: 50 } });
      setItems(notificationItems(response));
    } catch (requestError) {
      setItems([]);
      setError(requestError?.response?.data?.message || "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.post("/notifications/read-all");
      setItems((current) => (Array.isArray(current) ? current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })) : []));
      window.dispatchEvent(new Event("dono:notifications-changed"));
      setMessage("All notifications in this context are marked as read.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Notifications could not be marked as read.");
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (item) => {
    if (!item?.id || item.read_at) return;
    try {
      await api.post(`/notifications/${item.id}/read`);
      setItems((current) => (Array.isArray(current) ? current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry) : []));
      window.dispatchEvent(new Event("dono:notifications-changed"));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "This notification could not be marked as read.");
    }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;
  const unread = items.filter((item) => !item?.read_at).length;

  return (
    <PageContainer>
      <PageHeader title="Notifications" subtitle="Messages and alerts for your current role and school context." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={load} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Refresh</button>{unread > 0 && <button type="button" onClick={markAllRead} disabled={saving} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : `Mark ${unread} as read`}</button>}</div>} />
      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {message && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}
      {items.length === 0 ? <EmptyState title="No notifications yet" message="When an authorized school or platform workflow sends a message to this account, it will appear here." /> : <section className="space-y-3" aria-label="Notifications">{items.map((item) => <article key={item.id} className={`rounded-xl border bg-white p-4 shadow-sm ${item.read_at ? "border-slate-200" : "border-blue-200 bg-blue-50/30"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{item.title || item.subject || "DOONO notification"}</h2>{!item.read_at && <span className="rounded-full bg-blue-700 px-2 py-1 text-[10px] font-bold uppercase text-white">Unread</span>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.body || "No additional details were provided."}</p><p className="mt-2 text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}</p></div>{!item.read_at && <button type="button" onClick={() => markRead(item)} className="shrink-0 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700">Mark read</button>}</div></article>)}</section>}
    </PageContainer>
  );
}
