import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

export default function InvitationProfileSetup() {
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [form, setForm] = useState({
        phone: "",
        address: "",
        date_of_birth: "",
        qualification: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const loadStaff = async () => {
            try {
                const response = await api.get("/me/staff-profile");
                const record = response?.data?.data || response?.data || null;
                setStaff(record);
                setForm({
                    phone: record?.phone || "",
                    address: record?.address || "",
                    date_of_birth: record?.date_of_birth || "",
                    qualification: record?.qualification || "",
                });
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Unable to load your staff profile.");
            } finally {
                setLoading(false);
            }
        };

        loadStaff();
    }, [staffId]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            await api.put("/me/staff-profile", form);
            setMessage("Your staff profile has been updated successfully.");
        } catch (err) {
            const validationMessage = err.errors ? Object.values(err.errors).flat().join(" ") : "";
            setError(err.response?.data?.message || validationMessage || err.message || "Unable to save your profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner text="Loading your school profile..." />;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Invitation accepted</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Complete your school profile</h1>
                <p className="mt-2 text-sm text-slate-600">Your email, role, school, and employment details are tied to the invitation. Complete the optional personal details below, then enter your dashboard.</p>

                {error && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                {message && <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

                {staff && (
                    <div className="mt-6 space-y-5">
                        <div className="rounded-xl bg-slate-50 p-4 text-sm">
                            <p><strong>Name:</strong> {staff.first_name} {staff.middle_name || ""} {staff.last_name}</p>
                            <p className="mt-1"><strong>Email:</strong> {staff.email}</p>
                            <p className="mt-1"><strong>Role:</strong> {staff.designation}</p>
                        </div>

                        <form onSubmit={saveProfile} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Phone</label>
                                <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Address</label>
                                <textarea name="address" value={form.address} onChange={handleChange} rows="3" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Date of birth</label>
                                    <input type="date" name="date_of_birth" value={form.date_of_birth || ""} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Qualification</label>
                                    <input name="qualification" value={form.qualification} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => navigate("/")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Skip for now</button>
                                <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save and Open Dashboard"}</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
