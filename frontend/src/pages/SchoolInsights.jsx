import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatCard from "../components/dashboard/StatCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { arrayFromResponse } from "../utils/response";

const displayNumber = (value, suffix = "") => value === null || value === undefined ? "—" : `${value}${suffix}`;

export default function SchoolInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, historyResponse] = await Promise.all([
        api.get("/school-insights", { params: { days: 30 } }),
        api.get("/school-insights/history", { params: { period_days: 30, per_page: 30 } }),
      ]);
      setData(response?.data?.data || null);
      setHistory(arrayFromResponse(historyResponse));
    } catch (reason) {
      setError(reason?.message || "School insights could not be loaded.");
      setData(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const facts = data?.facts || {};
  const warnings = Array.isArray(data?.warnings) ? data.warnings : [];
  const subjectAverages = arrayFromResponse(data?.subject_averages);
  const alerts = arrayFromResponse(data?.alerts);

  async function updateAlertStatus(alertId, status) {
    try {
      await api.patch(`/school-insight-alerts/${alertId}/status`, { status });
      await load();
    } catch (reason) {
      setError(reason?.message || "The insight alert could not be updated.");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="School Insights"
        subtitle="Explainable summaries of attendance and published academic records for the active school."
        action={<Button variant="secondary" onClick={load} loading={loading}>Refresh</Button>}
      />
      {error && <Alert variant="error" action={<Button variant="secondary" size="sm" onClick={load}>Retry</Button>}>{error}</Alert>}
      {loading ? <LoadingSpinner text="Preparing school insights..." /> : !data ? <EmptyState title="No insights available" message="Select a school with the correct leadership permission, then try again." /> : <>
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-900">
          <strong>What this page means:</strong> These are summaries of records already stored in {data.school?.name || "the active school"}. They are not predictions, accusations, or replacements for professional academic, pastoral, medical, or financial judgement.
        </div>
        <DashboardGrid>
          <StatCard title="Active students" value={displayNumber(facts.active_students)} color="primary" />
          <StatCard title="Attendance, selected period" value={displayNumber(facts.attendance_percentage, "%")} color="info" />
          <StatCard title="Published results" value={displayNumber(facts.published_result_count)} color="success" />
          <StatCard title="Average published score" value={displayNumber(facts.average_published_score, "%")} color="warning" />
        </DashboardGrid>
        {data.comparison && <SectionCard title="Compared with the previous period" subtitle={`Previous period: ${data.comparison.previous_period?.from || "—"} to ${data.comparison.previous_period?.to || "—"}. Deltas describe stored records only.`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Attendance change</p><p className={`mt-1 text-xl font-bold ${Number(data.comparison.attendance_percentage_delta || 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{displayNumber(data.comparison.attendance_percentage_delta, "%")}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Average score change</p><p className={`mt-1 text-xl font-bold ${Number(data.comparison.average_published_score_delta || 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{displayNumber(data.comparison.average_published_score_delta, "%")}</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Active student change</p><p className={`mt-1 text-xl font-bold ${Number(data.comparison.active_students_delta || 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{data.comparison.active_students_delta > 0 ? "+" : ""}{displayNumber(data.comparison.active_students_delta)}</p></div>
          </div>
        </SectionCard>}
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <SectionCard title="Items requiring human review" subtitle="A warning explains a pattern in available data; it does not decide what the school should do.">
            {warnings.length === 0 ? <EmptyState title="No warnings for this period" message="The available attendance and published-result records did not meet the current review thresholds." /> : <div className="space-y-3">{warnings.map((warning, index) => <article key={`${warning.type || "warning"}-${index}`} className={`rounded-xl border p-4 ${warning.severity === "high" ? "border-rose-200 bg-rose-50" : warning.severity === "medium" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">{warning.title || "Review notice"}</h3><span className="rounded-full bg-white px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">{warning.severity || "info"}</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{warning.message}</p></article>)}</div>}
          </SectionCard>
          <SectionCard title="Saved review alerts" subtitle="Alerts preserve the evidence that triggered human review. They never make disciplinary, medical, or financial decisions automatically.">
            {alerts.length === 0 ? <EmptyState title="No saved alerts" message="New explainable warnings will appear here when the selected records meet a review threshold." /> : <div className="space-y-3">{alerts.map((alert) => <article key={alert.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">{alert.title || "Review alert"}</h3><p className="mt-1 text-sm text-slate-600">{alert.message}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase text-slate-600">{alert.status || "open"}</span></div><div className="mt-3 flex flex-wrap gap-2">{alert.status !== "acknowledged" && alert.status !== "resolved" && <Button size="sm" variant="secondary" onClick={() => updateAlertStatus(alert.id, "acknowledged")}>Acknowledge</Button>}{alert.status !== "resolved" && <Button size="sm" variant="secondary" onClick={() => updateAlertStatus(alert.id, "resolved")}>Resolve</Button>}{alert.status === "resolved" && <Button size="sm" variant="secondary" onClick={() => updateAlertStatus(alert.id, "open")}>Reopen</Button>}</div></article>)}</div>}
          </SectionCard>
          <SectionCard title="Subject performance" subtitle="Only published results are included. The list is ordered from weakest to strongest average.">
            {subjectAverages.length === 0 ? <EmptyState title="No published subject results" message="Complete and publish the official result workflow before interpreting subject performance." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Subject</th><th className="p-3">Average</th><th className="p-3">Records</th></tr></thead><tbody className="divide-y divide-slate-100">{subjectAverages.map((item, index) => <tr key={`${item.subject || "subject"}-${index}`}><td className="p-3 font-semibold text-slate-800">{item.subject || "Unknown subject"}</td><td className="p-3 text-slate-700">{displayNumber(item.average_score, "%")}</td><td className="p-3 text-slate-600">{displayNumber(item.result_count)}</td></tr>)}</tbody></table></div>}
          </SectionCard>
          <SectionCard title="Historical snapshots" subtitle="Daily, explainable snapshots are retained for the active school and selected 30-day window. A missing snapshot means the scheduled capture has not run yet.">
            {history.length === 0 ? <EmptyState title="No historical snapshots yet" message="The daily analytics snapshot job will create the first record after it runs." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Attendance</th><th className="p-3">Published results</th><th className="p-3">Average score</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map((item) => <tr key={item.id}><td className="p-3 font-semibold text-slate-800">{item.snapshot_date || "—"}</td><td className="p-3">{displayNumber(item.attendance_percentage, "%")}</td><td className="p-3">{displayNumber(item.published_result_count)}</td><td className="p-3">{displayNumber(item.average_published_score, "%")}</td></tr>)}</tbody></table></div>}
          </SectionCard>
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">Period: {data.period?.from || "—"} to {data.period?.to || "—"}. {data.disclaimer}</p>
      </>}
    </PageContainer>
  );
}
