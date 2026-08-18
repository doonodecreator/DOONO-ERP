import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const emptyForm = {
    name: "",
    code: "",
    category: "Core",
    division_id: "",
    pass_mark: 40,
    maximum_mark: 100,
    is_active: true,
    description: "",
};

const listFromResponse = (response) => {
    const value = response?.data?.data?.data ?? response?.data?.data ?? response?.data;
    return Array.isArray(value) ? value : [];
};

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [subjectsResponse, divisionsResponse] = await Promise.all([
                api.get("/subjects"),
                api.get("/divisions"),
            ]);
            setSubjects(listFromResponse(subjectsResponse));
            setDivisions(listFromResponse(divisionsResponse));
        } catch (err) {
            setError(err.response?.data?.message || "Unable to load subjects and divisions.");
            setSubjects([]);
            setDivisions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openModal = (subject = null) => {
        setFormError("");
        setEditingId(subject?.id || null);
        setForm(subject ? {
            name: subject.name || "",
            code: subject.code || "",
            category: subject.category || "Core",
            division_id: subject.division_id || subject.division?.id || "",
            pass_mark: subject.pass_mark ?? 40,
            maximum_mark: subject.maximum_mark ?? 100,
            is_active: subject.is_active ?? true,
            description: subject.description || "",
        } : { ...emptyForm, division_id: divisions[0]?.id || "" });
        setShowModal(true);
    };

    const handleChange = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    };

    const saveSubject = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFormError("");
        try {
            if (editingId) {
                await api.put(`/subjects/${editingId}`, form);
            } else {
                await api.post("/subjects", form);
            }
            setShowModal(false);
            setForm(emptyForm);
            await loadData();
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            setFormError(validationErrors ? Object.values(validationErrors).flat().join(" ") : (err.response?.data?.message || "Unable to save subject."));
        } finally {
            setSubmitting(false);
        }
    };

    const deleteSubject = async (subject) => {
        if (!window.confirm(`Delete ${subject.name}?`)) return;
        try {
            await api.delete(`/subjects/${subject.id}`);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Unable to delete subject.");
        }
    };

    return (
        <div className="p-6">
            <PageHeader
                title="Subjects"
                subtitle="Define the curriculum subjects after divisions, classes, and streams are ready."
                action={<button type="button" onClick={() => openModal()} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Add Subject</button>}
            />

            {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700"><span>{error}</span><button type="button" onClick={loadData} className="ml-4 font-semibold underline">Retry</button></div>}
            {loading ? <LoadingSpinner text="Loading subjects..." /> : subjects.length === 0 ? <EmptyState title="No subjects yet" message="Create the first subject for this school." /> : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Division</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Pass / Max</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {subjects.map((subject) => <tr key={subject.id}>
                                <td className="px-5 py-4 font-semibold text-slate-900">{subject.name}</td>
                                <td className="px-5 py-4">{subject.division?.name || divisions.find((division) => String(division.id) === String(subject.division_id))?.name || "—"}</td>
                                <td className="px-5 py-4">{subject.code || "—"}</td>
                                <td className="px-5 py-4">{subject.pass_mark ?? 40} / {subject.maximum_mark ?? 100}</td>
                                <td className="px-5 py-4">{subject.is_active ? "Active" : "Inactive"}</td>
                                <td className="px-5 py-4 text-right"><button type="button" onClick={() => openModal(subject)} className="mr-3 font-semibold text-indigo-600">Edit</button><button type="button" onClick={() => deleteSubject(subject)} className="font-semibold text-rose-600">Delete</button></td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                    <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{editingId ? "Edit Subject" : "Add Subject"}</h2><button type="button" onClick={() => setShowModal(false)} className="text-slate-500">×</button></div>
                    {formError && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</div>}
                    <form onSubmit={saveSubject} className="space-y-4">
                        <input required name="name" value={form.name} onChange={handleChange} placeholder="Subject name" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                        <div className="grid gap-4 sm:grid-cols-2"><input name="code" value={form.code} onChange={handleChange} placeholder="Code" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><select name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option>Core</option><option>Elective</option><option>Vocational</option><option>Trade</option></select></div>
                        <select required name="division_id" value={form.division_id} onChange={handleChange} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select division</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}</select>
                        <div className="grid gap-4 sm:grid-cols-2"><input type="number" min="0" name="pass_mark" value={form.pass_mark} onChange={handleChange} placeholder="Pass mark" className="w-full rounded-lg border border-slate-300 px-3 py-2" /><input type="number" min="1" name="maximum_mark" value={form.maximum_mark} onChange={handleChange} placeholder="Maximum mark" className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
                        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description (optional)" className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" />
                        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active subject</label>
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button disabled={submitting} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Saving..." : "Save Subject"}</button></div>
                    </form>
                </div>
            </div>}
        </div>
    );
}
