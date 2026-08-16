import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import PageContainer from "../components/layout/PageContainer";

export default function Organizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => { loadOrganizations(); }, []);

    async function loadOrganizations() {
        try {
            setLoading(true);
            const res = await api.get("/organizations");
            const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
            setOrganizations(Array.isArray(data) ? data : []);
        } catch (err) {
            setError("Failed to load organizations.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader title="Organizations" subtitle="Every organization registered on the platform." />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <DataTable 
                    columns={[
                        { key: "name", label: "Organization" },
                        { key: "owner", label: "Owner", render: (row) => row.owner?.name || "—" },
                        { key: "status", label: "Status" }
                    ]} 
                    data={organizations} 
                    emptyMessage="No organizations found." 
                />
            </div>
        </PageContainer>
    );
}
