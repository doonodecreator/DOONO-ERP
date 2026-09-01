import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const initialForm = { key: "", name: "", description: "", scope_type: "platform", scope_id: "", is_enabled: true, rollout_percentage: 100 };

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/feature-flags", { params: { per_page: 100 } });
      const records = response?.data?.data;
      setFlags(Array.isArray(records) ? records : []);
    } catch (reason) {
      setFlags([]);
      setError(reason?.response?.data?.message || "Feature flags could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.post("/feature-flags", { ...form, scope_id: form.scope_type === "platform" ? null : Number(form.scope_id), rollout_percentage: Number(form.rollout_percentage) });
      setForm(initialForm);
      setMessage("Feature flag created.");
      await load();
    } catch (reason) {
      setError(reason?.response?.data?.message || "Feature flag could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(flag) {
    setError("");
    setMessage("");
    try {
      await api.put(`/feature-flags/${flag.id}`, { ...flag, is_enabled: !flag.is_enabled, scope_id: flag.scope_id || null });
      setMessage(`${flag.name} is now ${flag.is_enabled ? "disabled" : "enabled"}.`);
      await load();
    } catch (reason) {
      setError(reason?.response?.data?.message || "Feature flag could not be updated.");
    }
  }

  async function remove(flag) {
    if (!window.confirm(`Delete the feature flag “${flag.name}”?`)) return;
    try {
      await api.delete(`/feature-flags/${flag.id}`);
      setMessage("Feature flag deleted.");
      await load();
    } catch (reason) {
      setError(reason?.response?.data?.message || "Feature flag could not be deleted.");
    }
  }

  return <PageContainer><PageHeader title="Feature Flags" subtitle="Control staged platform, organization, and school rollouts without changing subscription entitlements." action={<button type="button" onClick={load} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Refresh</button>} />{error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}{message && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}<form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2"><div className="md:col-span-2"><h2 className="text-lg font-bold text-slate-900">Create a controlled rollout</h2><p className="mt-1 text-sm text-slate-500">Use lowercase keys. A school override takes precedence over an organization override, which takes precedence over the platform default.</p></div><input required pattern="[a-z0-9][a-z0-9_.-]*" name="key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="e.g. new_reports_workspace" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input required name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Display name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select name="scope_type" value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value, scope_id: "" })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="platform">Platform default</option><option value="organization">Organization override</option><option value="school">School override</option></select><input type="number" min="1" name="scope_id" disabled={form.scope_type === "platform"} value={form.scope_id} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} placeholder={form.scope_type === "platform" ? "No scope ID required" : "Organization or school ID"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" /><input type="number" min="0" max="100" required name="rollout_percentage" value={form.rollout_percentage} onChange={(e) => setForm({ ...form, rollout_percentage: e.target.value })} placeholder="Rollout percentage" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} /> Enabled immediately</label><textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this flag control?" className="min-h-20 rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" /><button disabled={saving} type="submit" className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">{saving ? "Saving..." : "Create feature flag"}</button></form>{loading ? <LoadingSpinner text="Loading feature flags..." /> : flags.length === 0 ? <EmptyState title="No feature flags" message="Create a staged rollout above when a real product feature is ready." /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Flag</th><th className="p-4">Scope</th><th className="p-4">Rollout</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{flags.map((flag) => <tr key={flag.id}><td className="p-4"><p className="font-semibold text-slate-900">{flag.name}</p><p className="font-mono text-xs text-slate-500">{flag.key}</p></td><td className="p-4 text-slate-600">{flag.scope_type}{flag.scope_id ? ` #${flag.scope_id}` : ""}</td><td className="p-4 text-slate-600">{flag.rollout_percentage}%</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${flag.is_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{flag.is_enabled ? "Enabled" : "Disabled"}</span></td><td className="p-4 text-right"><button type="button" onClick={() => toggle(flag)} className="mr-2 rounded border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700">{flag.is_enabled ? "Disable" : "Enable"}</button><button type="button" onClick={() => remove(flag)} className="rounded border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button></td></tr>)}</tbody></table></div>}</PageContainer>;
}
