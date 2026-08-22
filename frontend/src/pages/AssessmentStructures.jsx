import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";

const initialForm = {
  name: "",
  maximum_marks: "",
  percentage: "",
  display_order: "1",
  is_active: true,
};

export default function AssessmentStructures({ setPage }) {
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totalPercentage = useMemo(
    () => structures.filter((item) => item.is_active !== false).reduce((sum, item) => sum + Number(item.percentage || 0), 0),
    [structures],
  );

  async function loadStructures() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/assessment-structures");
      setStructures(arrayFromResponse(response));
    } catch (requestError) {
      setStructures([]);
      setError(requestError?.response?.data?.message || "Unable to load assessment structures.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStructures();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function startEdit(structure) {
    setEditingId(structure.id);
    setForm({
      name: structure.name || "",
      maximum_marks: String(structure.maximum_marks ?? ""),
      percentage: String(structure.percentage ?? ""),
      display_order: String(structure.display_order ?? "1"),
      is_active: structure.is_active !== false,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function saveStructure(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      name: form.name.trim(),
      maximum_marks: Number(form.maximum_marks),
      percentage: Number(form.percentage),
      display_order: Number(form.display_order),
      is_active: Boolean(form.is_active),
    };

    try {
      if (editingId) {
        await api.put(`/assessment-structures/${editingId}`, payload);
        setMessage("Assessment component updated successfully.");
      } else {
        await api.post("/assessment-structures", payload);
        setMessage("Assessment component created successfully.");
      }
      resetForm();
      await loadStructures();
    } catch (requestError) {
      const validation = requestError?.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : requestError?.response?.data?.message || "Unable to save assessment component.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStructure(id) {
    if (!window.confirm("Delete this assessment component? Existing result data may already reference it.")) return;
    setError("");
    setMessage("");
    try {
      await api.delete(`/assessment-structures/${id}`);
      setMessage("Assessment component deleted.");
      if (editingId === id) resetForm();
      await loadStructures();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to delete assessment component.");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Assessment Structure"
        subtitle="Configure the CA and examination components that teachers will enter and the official result engine will compute."
        action={<button type="button" onClick={() => setPage?.("result-entry")} className="btn-secondary">Open Result Entry</button>}
      />

      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,360px)_1fr]">
        <form onSubmit={saveStructure} className="sticky top-4 h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">{editingId ? "Edit component" : "Add component"}</h2>
            <p className="mt-1 text-xs text-slate-500">Example: CA out of 40 and Examination out of 60.</p>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Component name<input required name="name" value={form.name} onChange={handleChange} placeholder="CA or Examination" className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
            <label className="block text-sm font-semibold text-slate-700">Maximum marks<input required type="number" min="1" step="0.01" name="maximum_marks" value={form.maximum_marks} onChange={handleChange} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
            <label className="block text-sm font-semibold text-slate-700">Weighted percentage<input required type="number" min="0" max="100" step="0.01" name="percentage" value={form.percentage} onChange={handleChange} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
            <label className="block text-sm font-semibold text-slate-700">Display order<input required type="number" min="1" step="1" name="display_order" value={form.display_order} onChange={handleChange} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active for result entry</label>
          </div>
          <div className="sticky bottom-0 mt-5 flex gap-2 border-t border-slate-100 bg-white pt-4">
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update" : "Add Component"}</button>
            {editingId && <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>}
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold text-slate-900">Configured components</h2><p className="text-xs text-slate-500">Active total: {totalPercentage}% {totalPercentage === 100 ? "· Ready for computation" : "· Aim for 100%"}</p></div>
            <button type="button" onClick={loadStructures} className="btn-secondary">Refresh</button>
          </div>
          {loading ? <LoadingSpinner text="Loading assessment components..." /> : structures.length === 0 ? <EmptyState title="No assessment components" message="Add CA and Examination components to open teacher score entry." /> : <div className="divide-y divide-slate-100">{structures.map((structure) => <div key={structure.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{structure.name}</p><p className="text-xs text-slate-500">Enter up to {structure.maximum_marks} marks · contributes {structure.percentage}% · order {structure.display_order}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${structure.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{structure.is_active !== false ? "Active" : "Inactive"}</span><button type="button" onClick={() => startEdit(structure)} className="btn-secondary">Edit</button><button type="button" onClick={() => deleteStructure(structure.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700">Delete</button></div></div>)}</div>}
        </section>
      </div>
    </PageContainer>
  );
}
