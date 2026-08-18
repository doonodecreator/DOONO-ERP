import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import PageContainer from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function Schools() {
    const { roles, isPlatformAdmin, isOrganizationOwner, refreshContext } = useAuth();
    const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner });
    
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [switchingId, setSwitchingId] = useState(null);

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

    async function manageSchool(schoolId) {
        setSwitchingId(schoolId);
        try {
            await api.post("/me/switch-school", { school_id: schoolId });
            await refreshContext();
            window.location.href = "/"; // Navigate to dashboard
        } catch (err) {
            alert(err.response?.data?.message || "Failed to switch to school context.");
        } finally {
            setSwitchingId(null);
        }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader title="Schools" subtitle={isPlatformAdmin ? "Manage school access and exemptions." : "Your registered school branches."} />
            <div className="grid grid-cols-1 gap-4">
                {schools.length === 0 ? <EmptyState title="No Schools" message="No schools registered yet." /> : schools.map(school => (
                    <div key={school.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{school.name}</h3>
                                <p className="text-slate-500 text-sm">{school.school_type} · Owner: {school.owner?.name || "Current user"}</p>
                            </div>
                            <div className="flex gap-2">
                                {isPlatformAdmin && (
                                    <button onClick={() => handleAction(school.id, 'toggle-exemption')} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200">
                                        Toggle Free Access
                                    </button>
                                )}
                                
                                {(isOrganizationOwner || roleSlug === 'proprietor') && (
                                    <button 
                                        disabled={switchingId === school.id}
                                        onClick={() => manageSchool(school.id)} 
                                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {switchingId === school.id ? "Entering..." : "Manage School"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
