import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function SchoolSetup({ setPage }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [setup, setSetup] = useState(null);

    const loadProgress = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/school-setup/progress");
            const payload = response?.data || {};
            setSetup(payload);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load school setup progress.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProgress();
    }, []);

    const steps = Array.isArray(setup?.steps) ? setup.steps : [];

    const acknowledgeStep = async (step) => {
        try {
            setError("");
            await api.patch(`/school-setup/progress/${step.key}`, { acknowledged: true });
            setSetup((current) => current ? { ...current, steps: (Array.isArray(current.steps) ? current.steps : []).map((item) => item.key === step.key ? { ...item, acknowledged: true, last_viewed_at: new Date().toISOString(), acknowledged_at: new Date().toISOString() } : item), acknowledged_steps: Number(current.acknowledged_steps || 0) + (step.acknowledged ? 0 : 1) } : current);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save checklist progress.");
        }
    };

    const dependencyLabels = Object.fromEntries(steps.map((step) => [step.key, step.label]));
    const percentage = useMemo(() => {
        if (!setup?.total_steps) return 0;
        return Math.round((Number(setup.completed_steps || 0) / Number(setup.total_steps)) * 100);
    }, [setup]);

    if (loading) {
        return <PageContainer><LoadingSpinner text="Loading school setup..." /></PageContainer>;
    }

    if (error) {
        return (
            <PageContainer>
                <PageHeader title="School Setup" subtitle="Complete the school structure in the correct order." />
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                    <p>{error}</p>
                    <button type="button" onClick={loadProgress} className="mt-3 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Retry</button>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Initial School Setup"
                subtitle={`${setup?.school?.name || "Your school"} · Complete these steps before daily operations begin.`}
                action={<button type="button" onClick={loadProgress} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh Progress</button>}
            />

            <section className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Setup progress</p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">{setup?.completed_steps || 0} of {setup?.total_steps || 0} steps completed</h2>
                    </div>
                    <span className="text-3xl font-extrabold text-indigo-700">{percentage}%</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percentage}%` }} />
                </div>
            </section>

            {steps.length === 0 ? (
                <EmptyState title="No setup steps available" message="The school setup configuration has not been returned by the server." />
            ) : (
                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div key={step.key || index} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step.complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                    {step.complete ? "✓" : index + 1}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{step.label}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{step.complete ? "Completed from the school records" : step.blocked ? "Waiting for prerequisites" : "Not completed yet"}</p>
                                    {step.blocked && Array.isArray(step.blocked_by) && <p className="mt-1 text-xs font-medium text-amber-700">Complete first: {step.blocked_by.map((key) => dependencyLabels[key] || key).join(", ")}</p>}
                                    {step.acknowledged && !step.complete && <p className="mt-1 text-xs text-indigo-600">You have acknowledged this step; the record is still incomplete.</p>}
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                {!step.acknowledged && <button type="button" onClick={() => acknowledgeStep(step)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Mark understood</button>}
                                <button type="button" disabled={Boolean(step.blocked)} onClick={() => setPage?.(step.page)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${step.complete ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                                    {step.blocked ? "Complete prerequisites" : step.complete ? "Review" : "Open Step"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}
