import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import PageContainer from "../components/layout/PageContainer";

export default function Schools() {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => { loadSchools(); }, []);

    async function loadSchools() {
        try {
            setLoading(true);
            const res = await api.get("/schools");
            const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
            setSchools(Array.isArray(data) ? data : []);
        } catch (err) {
            setError("Failed to load schools.");
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(schoolId, action) {
        try {
            await api.post(`/schools/${schoolId}/${action}`);
            alert("Action successful.");
            loadSchools();
        } catch (err) {
            alert("Action failed.");
        }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader title="Schools" subtitle="Manage school access and exemptions." />
            <div className="grid grid-cols-1 gap-4">
                {schools.length === 0 ? <EmptyState title="No Schools" message="No schools registered yet." /> : schools.map(school => (
                    <div key={school.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{school.name}</h3>
                                <p className="text-slate-500 text-sm">{school.school_type} · Owner: {school.owner?.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleAction(school.id, 'toggle-exemption')} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">Toggle Free Access</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
