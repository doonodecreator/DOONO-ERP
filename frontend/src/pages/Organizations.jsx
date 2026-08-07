import { useState, useEffect } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function Organizations() {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        loadOrganizations();
    }, []);

    async function loadOrganizations() {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/organizations");
            const data = res.data?.data;
            setOrganizations(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load organizations.");
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    }

    async function viewOrganization(org) {
        setSelected(org);
        setSelectedDetail(null);
        setDetailLoading(true);
        try {
            const res = await api.get(`/organizations/${org.id}`);
            setSelectedDetail(res.data?.data || null);
        } catch (err) {
            setError(err.message || "Failed to load organization details.");
        } finally {
            setDetailLoading(false);
        }
    }

    const columns = [
        { key: "name", label: "Organization" },
        {
            key: "owner",
            label: "Owner",
            render: (row) => row.owner?.name || "—",
        },
        { key: "status", label: "Status" },
    ];

    const rows = organizations.map((org) => ({
        ...org,
        onClick: () => viewOrganization(org),
    }));

    if (selected) {
        return (
            <div style={{ padding: 20 }}>
                <PageHeader
                    title={selectedDetail?.name || "Loading..."}
                    subtitle="Organization details"
                    action={
                        <button onClick={() => { setSelected(null); setSelectedDetail(null); }}>
                            ← Back to Organizations
                        </button>
                    }
                />

                {detailLoading && <LoadingSpinner text="Loading organization details..." />}

                {selectedDetail && (
                    <>
                        <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div><strong>Owner:</strong> {selectedDetail.owner?.name || "—"}</div>
                                <div><strong>Email:</strong> {selectedDetail.email || "—"}</div>
                                <div><strong>Phone:</strong> {selectedDetail.phone || "—"}</div>
                                <div><strong>Registration No:</strong> {selectedDetail.registration_number || "—"}</div>
                                <div><strong>Location:</strong> {[selectedDetail.lga, selectedDetail.state, selectedDetail.country].filter(Boolean).join(", ") || "—"}</div>
                                <div><strong>Address:</strong> {selectedDetail.address || "—"}</div>
                            </div>
                        </div>

                        <PageHeader title="Schools" subtitle={`${selectedDetail.schools?.length || 0} school(s) under this organization`} />

                        {(!Array.isArray(selectedDetail.schools) || selectedDetail.schools.length === 0) ? (
                            <EmptyState title="No Schools" message="This organization has no schools yet." />
                        ) : (
                            <DataTable
                                columns={[
                                    { key: "name", label: "School" },
                                    { key: "school_type", label: "Type" },
                                    { key: "status", label: "Status" },
                                ]}
                                data={selectedDetail.schools}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <PageHeader title="Organizations" subtitle="Every organization registered on the platform." />

            {error && (
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 16, borderRadius: 12, marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingSpinner text="Loading organizations..." />
            ) : organizations.length === 0 ? (
                <EmptyState title="No Organizations" message="No organizations have registered yet, or the request failed above." />
            ) : (
                <DataTable columns={columns} data={rows} emptyMessage="No organizations found." />
            )}
        </div>
    );
}
