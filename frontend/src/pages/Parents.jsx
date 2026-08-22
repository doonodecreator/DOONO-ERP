import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import StatCard from "../components/dashboard/StatCard";
import Button from "../components/forms/Button";
import Alert from "../components/feedback/Alert";
import PortalAccountModal from "../components/modals/PortalAccountModal";

export default function Parents({ setPage, setSelectedParent }) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManageLinks = ["super_admin", "proprietor", "principal", "vice_principal_admin"].includes(roleSlug);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [portalParent, setPortalParent] = useState(null);

  const loadParents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/parents");
      const data = response.data?.data ?? response.data;
      setParents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch parent records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadParents(); }, []);

  const filteredParents = parents.filter((parent) => `${parent.father_name || ""} ${parent.father_phone || ""} ${parent.mother_name || ""} ${parent.guardian_name || ""} ${parent.guardian_phone || ""}`.toLowerCase().includes(search.toLowerCase()));
  const nameFor = (parent) => parent.father_name || parent.mother_name || parent.guardian_name || "Parent record";
  const goTo = (event, parent, page) => { event.stopPropagation(); setSelectedParent?.(parent); setPage(page); };

  const columns = [
    { key: "father", label: "Father", render: (parent) => <span>{parent.father_name || "—"}<small className="table-secondary-text">{parent.father_phone || "—"}</small></span> },
    { key: "mother", label: "Mother", render: (parent) => <span>{parent.mother_name || "—"}<small className="table-secondary-text">{parent.mother_phone || "—"}</small></span> },
    { key: "guardian", label: "Guardian", render: (parent) => <span>{parent.guardian_name || "—"}<small className="table-secondary-text">{parent.guardian_relationship ? `${parent.guardian_relationship} · ` : ""}{parent.guardian_phone || "—"}</small></span> },
    { key: "address", label: "Address", render: (parent) => <span className="table-truncate">{parent.address || "—"}</span> },
    { key: "actions", label: "Actions", align: "right", render: (parent) => <div className="table-actions">{canManageLinks && (parent.portal_account?.linked ? <span className="status-badge status-badge-success">Portal linked</span> : <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setPortalParent(parent); }}>Portal account</Button>)}{canManageLinks && <Button size="sm" variant="secondary" onClick={(event) => goTo(event, parent, "link-student-parent")}>Link student</Button>}<Button size="sm" variant="ghost" onClick={(event) => goTo(event, parent, "edit-parent")}>Edit</Button><Button size="sm" variant="danger" onClick={async (event) => { event.stopPropagation(); if (!window.confirm(`Are you sure you want to delete the parent record for ${nameFor(parent)}?`)) return; try { await api.delete(`/parents/${parent.id}`); await loadParents(); } catch (err) { setError(err.response?.data?.message || "Failed to delete parent record."); } }}>Delete</Button></div> },
  ];

  return <PageContainer>
    <PageHeader title="Parents & Guardians" subtitle="Manage parent profiles, emergency contacts, and student connections." action={<Button onClick={() => setPage("add-parent")}>Add parent</Button>} />
    {error && <Alert variant="error" action={<button type="button" onClick={loadParents}>Retry</button>}>{error}</Alert>}
    <div className="dashboard-grid"><StatCard title="Registered parents" value={parents.length} subtitle="Current school directory" color="primary" /></div>
    <SectionCard title="Find parents" subtitle={`${filteredParents.length} of ${parents.length} records`}><input type="search" aria-label="Search parents" placeholder="Search by name or phone number" value={search} onChange={(event) => setSearch(event.target.value)} className="ui-form-control" /></SectionCard>
    <DataTable columns={columns} data={filteredParents} loading={loading} emptyTitle="No parent records found" emptyMessage="Try adjusting your search or register a new parent." />
    <PortalAccountModal open={!!portalParent} entity={portalParent} entityType="parent" onClose={() => setPortalParent(null)} onSuccess={loadParents} />
  </PageContainer>;
}
