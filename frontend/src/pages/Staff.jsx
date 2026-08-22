import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import Button from "../components/forms/Button";
import Alert from "../components/feedback/Alert";

export default function Staff({ setPage, setSelectedStaff }) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManageEmployment = role === "proprietor";
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get("/staff");
      setStaffList(arrayFromResponse(response));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from staff?`)) return;
    try {
      await api.delete(`/staff/${id}`);
      await fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete staff member.");
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const fullName = `${staff.first_name || ""} ${staff.last_name || ""}`.toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(term) || (staff.staff_number || "").toLowerCase().includes(term) || (staff.department || "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || String(staff.employment_status || "").toLowerCase().replaceAll(" ", "_") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "staff_number", label: "Staff ID", render: (staff) => <span className="font-mono text-xs font-semibold">{staff.staff_number || "N/A"}</span> },
    { key: "name", label: "Name", render: (staff) => <span className="font-semibold">{[staff.first_name, staff.middle_name, staff.last_name].filter(Boolean).join(" ") || "Unnamed staff"}</span> },
    { key: "designation", label: "Designation / Department", render: (staff) => <span>{staff.designation || "Unassigned"}<small className="table-secondary-text">{staff.department || "General"}</small></span> },
    { key: "contact", label: "Phone / Email", render: (staff) => <span>{staff.phone || "—"}<small className="table-secondary-text">{staff.email || "—"}</small></span> },
    { key: "employment_status", label: "Status", render: (staff) => { const value = String(staff.employment_status || "Active"); const variant = value.toLowerCase() === "active" ? "status-badge-success" : value.toLowerCase().includes("leave") ? "status-badge-warning" : "status-badge-danger"; return <span className={`status-badge ${variant}`}>{value}</span>; } },
    { key: "actions", label: "Actions", align: "right", render: (staff) => canManageEmployment ? <div className="table-actions"><Button size="sm" variant="ghost" onClick={() => { setSelectedStaff?.(staff); setPage("edit-staff"); }}>Edit employment</Button><Button size="sm" variant="danger" onClick={() => handleDelete(staff.id, `${staff.first_name || ""} ${staff.last_name || ""}`)}>Terminate</Button></div> : <span className="table-muted-text">View only</span> },
  ];

  return <PageContainer>
    <PageHeader title="Staff Directory" subtitle="Manage school teachers, administrators, and non-teaching personnel." action={canManageEmployment ? <Button onClick={() => setPage("add-staff")}>Add staff</Button> : null} />
    {error && <Alert variant="error" action={<button type="button" onClick={fetchStaff}>Retry</button>}>{error}</Alert>}
    <SectionCard title="Find staff" subtitle={`${filteredStaff.length} of ${staffList.length} records`}>
      <div className="ui-form-grid"><input type="search" aria-label="Search staff" placeholder="Search by name, staff ID, or department" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="ui-form-control" /><select aria-label="Filter staff by employment status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ui-form-control"><option value="all">All employment statuses</option><option value="active">Active</option><option value="on_leave">On leave</option><option value="suspended">Suspended</option><option value="retired">Retired</option><option value="resigned">Resigned</option><option value="terminated">Terminated</option></select></div>
    </SectionCard>
    <DataTable columns={columns} data={filteredStaff} loading={loading} emptyTitle="No staff members found" emptyMessage="Try adjusting your search or add a new staff member." />
  </PageContainer>;
}
