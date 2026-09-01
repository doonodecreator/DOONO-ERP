import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import Button from "../components/forms/Button";
import PortalAccountModal from "../components/modals/PortalAccountModal";
import Alert from "../components/feedback/Alert";

export default function Students({ setPage, setSelectedStudent }) {
  const { roles, permissions = [], isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManageAdmissions = ["super_admin", "proprietor", "principal", "vice_principal_admin"].includes(roleSlug);
  const canIssueStudentIdCards = isPlatformAdmin || permissions.includes("issue_student_id_cards");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [portalStudent, setPortalStudent] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/students");
      const data = response.data?.data ?? response.data;
      setStudents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch student records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, []);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const response = await api.get("/exports/students.csv", { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.response?.data?.message || "Student export could not be generated.");
    } finally {
      setExporting(false);
    }
  };

  const downloadStudentDocument = async (student, documentType) => {
    const path = documentType === "transcript" ? `/students/${student.id}/documents/transcript` : `/students/${student.id}/documents/id-card`;
    try {
      setDocumentLoading(`${documentType}:${student.id}`); setError(null);
      const response = await api.get(path, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = documentType === "id-card" ? `student-id-card-${student.admission_number || student.id}.pdf` : `${documentType}-${student.admission_number || student.id}.pdf`;
      document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err.response?.data?.message || `Unable to generate the student ${documentType}.`); }
    finally { setDocumentLoading(null); }
  };

  const handleDelete = async (event, id, name) => {
    event.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete student record for ${name}?`)) return;
    try {
      await api.delete(`/students/${id}`);
      await loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const handleEdit = (event, student) => {
    event.stopPropagation();
    setSelectedStudent?.(student);
    setPage("edit-student");
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.toLowerCase();
    const admissionNumber = (student.admission_number || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(term) || admissionNumber.includes(term);
    const matchesStatus = statusFilter === "all" || (student.status || "").toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "admission_number", label: "Admission No", render: (student) => <span className="font-mono text-xs font-semibold">{student.admission_number || "N/A"}</span> },
    { key: "name", label: "Full Name", render: (student) => <span className="font-semibold">{[student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") || "Unnamed student"}</span> },
    { key: "gender", label: "Gender", render: (student) => <span className="capitalize">{student.gender || "—"}</span> },
    { key: "class", label: "Class / Stream", render: (student) => <span>{student.class?.name || student.class_name || "Unassigned"}{student.stream?.name ? ` (${student.stream.name})` : ""}</span> },
    { key: "status", label: "Status", render: (student) => <span className={`status-badge ${(student.status || "active").toLowerCase() === "active" ? "status-badge-success" : "status-badge-muted"}`}>{student.status || "Active"}</span> },
  ];

  if (canManageAdmissions || permissions.includes("view_students")) {
    columns.push({
      key: "actions",
      label: "Actions",
      align: "right",
      render: (student) => <div className="table-actions">{canManageAdmissions && <><Button size="sm" variant="ghost" onClick={(event) => handleEdit(event, student)}>Edit</Button>{student.portal_account?.linked ? <span className="status-badge status-badge-success">Portal linked</span> : <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setPortalStudent(student); }}>Portal account</Button>}<Button size="sm" variant="danger" onClick={(event) => handleDelete(event, student.id, `${student.first_name || ""} ${student.last_name || ""}`)}>Delete</Button></>}{permissions.includes("view_results") && <Button size="sm" variant="secondary" loading={documentLoading === `transcript:${student.id}`} onClick={() => downloadStudentDocument(student, "transcript")}>Transcript</Button>}{canIssueStudentIdCards && <Button size="sm" variant="secondary" loading={documentLoading === `id-card:${student.id}`} onClick={() => downloadStudentDocument(student, "id-card")}>ID card</Button>}</div>,
    });
  }

  return <PageContainer>
    <PageHeader title="Students Directory" subtitle="Manage enrolled student profiles, class assignments, and academic status." action={<div className="flex flex-wrap gap-2">{permissions.includes("view_students") && <Button variant="secondary" onClick={handleExport} loading={exporting}>Export CSV</Button>}{canManageAdmissions && <Button onClick={() => setPage("admissions")}>New admission</Button>}</div>} />
    {error && <Alert variant="error" action={<button type="button" onClick={loadStudents}>Retry</button>}>{error}</Alert>}
    <SectionCard title="Find students" subtitle={`${filteredStudents.length} of ${students.length} records`}>
      <div className="ui-form-grid">
        <input type="search" aria-label="Search students" placeholder="Search by name or admission number" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="ui-form-control" />
        <select aria-label="Filter students by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ui-form-control"><option value="all">All academic statuses</option><option value="active">Active</option><option value="graduated">Graduated</option><option value="transferred">Transferred</option><option value="suspended">Suspended</option></select>
      </div>
    </SectionCard>
    <DataTable columns={columns} data={filteredStudents} loading={loading} emptyTitle="No students found" emptyMessage="Try adjusting your search or add a new admission." />
    <PortalAccountModal open={!!portalStudent} entity={portalStudent} entityType="student" onClose={() => setPortalStudent(null)} onSuccess={loadStudents} />
  </PageContainer>;
}
