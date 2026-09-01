import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";

const priorityClasses = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-slate-200 bg-slate-50 text-slate-600",
};

function inboxPayload(response) {
  const value = response?.data?.data;
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value, items: Array.isArray(value.items) ? value.items : [] }
    : { items: [], summary: { total: 0, high: 0, medium: 0, low: 0 } };
}

export default function WorkInbox({ setPage }) {
  const [payload, setPayload] = useState({ items: [], summary: { total: 0, high: 0, medium: 0, low: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/work-inbox");
      setPayload(inboxPayload(response));
    } catch (requestError) {
      setPayload({ items: [], summary: { total: 0, high: 0, medium: 0, low: 0 } });
      setError(requestError?.response?.data?.message || "The work inbox could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner text="Loading your work inbox..." />;

  const items = Array.isArray(payload.items) ? payload.items : [];
  const summary = payload.summary && typeof payload.summary === "object" ? payload.summary : {};

  return (
    <PageContainer>
      <PageHeader
        title="Work Inbox"
        subtitle="The next actions that matter in your current role and school context."
        action={<button type="button" onClick={load} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Refresh</button>}
      />
      {error && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><span>{error}</span><button type="button" onClick={load} className="font-semibold underline">Retry</button></div>}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Total', summary.total || 0, 'bg-slate-900 text-white'], ['High priority', summary.high || 0, 'bg-rose-50 text-rose-700'], ['Medium priority', summary.medium || 0, 'bg-amber-50 text-amber-700'], ['Low priority', summary.low || 0, 'bg-slate-50 text-slate-700']].map(([label, value, className]) => <div key={label} className={`rounded-xl border border-slate-200 p-4 ${className}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}
      </div>
      {items.length === 0 ? (
        <EmptyState title="Your inbox is clear" message="There are no setup blockers, approvals, unread notifications, pending invitations, or failed communication deliveries requiring your attention in this context." />
      ) : (
        <section className="space-y-3" aria-label="Actionable work items">
          {items.map((item) => (
            <article key={item.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{item.title || "Action required"}</h2>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${priorityClasses[item.priority] || priorityClasses.low}`}>{item.priority || "normal"}</span>
                    {Number(item.count) > 1 && <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{item.count} records</span>}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.description || "Open the linked workspace to review this item."}</p>
                </div>
                <button type="button" onClick={() => setPage?.(item.page)} className="shrink-0 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Open workspace</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </PageContainer>
  );
}
