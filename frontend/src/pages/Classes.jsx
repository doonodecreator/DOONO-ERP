import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modal";
import Button from "../components/forms/Button";
import { FormField, FormActions } from "../components/forms/FormField";
import Alert from "../components/feedback/Alert";
import { useAuth } from "../context/AuthContext";

export default function Classes({ teacherOnly = false }) {
  const { permissions = [] } = useAuth();
  const canManageClasses = !teacherOnly && permissions.includes("manage_classes");
  const [classes, setClasses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ division_id: "", name: "", code: "", display_order: 1, is_active: true });

  const loadClassesAndDivisions = async () => {
    try {
      setLoading(true);
      setError(null);
      if (teacherOnly) {
        const response = await api.get("/teacher/dashboard");
        const payload = response?.data;
        setClasses(Array.isArray(payload?.my_classes) ? payload.my_classes : []);
        setDivisions([]);
        return;
      }
      const [classRes, divRes] = await Promise.all([api.get("/classes"), api.get("/divisions")]);
      const classData = classRes.data?.data?.data ?? classRes.data?.data ?? classRes.data ?? [];
      const divisionData = divRes.data?.data?.data ?? divRes.data?.data ?? divRes.data ?? [];
      setClasses(Array.isArray(classData) ? classData : []);
      setDivisions(Array.isArray(divisionData) ? divisionData : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load class configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClassesAndDivisions(); }, []);

  const handleOpenModal = (classRecord = null) => {
    if (!canManageClasses) return;
    setErrors({});
    if (!classRecord && divisions.length === 0) {
      setError("Create at least one division before creating a class.");
      return;
    }
    setEditingId(classRecord?.id || null);
    setForm(classRecord ? { division_id: classRecord.division_id || "", name: classRecord.name || "", code: classRecord.code || "", display_order: classRecord.display_order || 1, is_active: classRecord.is_active ?? true } : { division_id: divisions[0]?.id || "", name: "", code: "", display_order: classes.length + 1, is_active: true });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (editingId) await api.put(`/classes/${editingId}`, form);
      else await api.post("/classes", form);
      setShowModal(false);
      await loadClassesAndDivisions();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else setError(err.response?.data?.message || "Failed to save class.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete class "${name}"?`)) return;
    try { await api.delete(`/classes/${id}`); await loadClassesAndDivisions(); } catch (err) { setError(err.response?.data?.message || "Failed to delete class."); }
  };

  const fieldError = (name) => Array.isArray(errors[name]) ? errors[name][0] : errors[name];
  const columns = teacherOnly ? [
    { key: "name", label: "Assigned class", render: (item) => <span className="font-semibold">{item.name || "Class"}</span> },
    { key: "students", label: "Students", render: (item) => item.student_count ?? 0 },
    { key: "assignment", label: "Assignment", render: () => <span className="status-badge status-badge-muted">Read-only</span> },
  ] : [
    { key: "display_order", label: "Order", render: (item) => <span className="font-mono text-xs">{item.display_order || "—"}</span> },
    { key: "name", label: "Class", render: (item) => <span className="font-semibold">{item.name}</span> },
    { key: "code", label: "Code", render: (item) => <span className="font-mono text-xs">{item.code || "—"}</span> },
    { key: "division", label: "Division", render: (item) => item.division?.name || "—" },
    { key: "streams", label: "Streams", render: (item) => <span className="status-badge status-badge-muted">{item.streams?.length || 0}</span> },
    { key: "status", label: "Status", render: (item) => <span className={`status-badge ${item.is_active ? "status-badge-success" : "status-badge-muted"}`}>{item.is_active ? "Active" : "Inactive"}</span> },
    ...(canManageClasses ? [{ key: "actions", label: "Actions", align: "right", render: (item) => <div className="table-actions"><Button size="sm" variant="ghost" onClick={() => handleOpenModal(item)}>Edit</Button><Button size="sm" variant="danger" onClick={() => handleDelete(item.id, item.name)}>Delete</Button></div> }] : []),
  ];

  return <PageContainer>
    <PageHeader title="Classes & Academic Streams" subtitle={canManageClasses ? "Define academic levels, grade sections, and stream allocations." : "View the school classes configured by authorized school administrators."} action={canManageClasses ? <Button onClick={() => handleOpenModal()}>Add class</Button> : null} />
    {error && <Alert variant="error" action={<button type="button" onClick={loadClassesAndDivisions}>Retry</button>}>{error}</Alert>}
    <DataTable columns={columns} data={classes} loading={loading} emptyTitle="No academic classes defined" emptyMessage="Create a division first, then add your school’s first class." />
    {canManageClasses && <Modal open={showModal} title={editingId ? "Edit academic class" : "Add academic class"} description="Classes belong to a division and can later receive streams." onClose={() => setShowModal(false)} footer={<FormActions sticky={false}><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" form="class-form" loading={submitting}>{editingId ? "Update class" : "Create class"}</Button></FormActions>}>
      <form id="class-form" onSubmit={handleSubmit} className="ui-form-grid">
        <FormField label="Division / level" htmlFor="class-division" required error={fieldError("division_id")}><select id="class-division" name="division_id" value={form.division_id} onChange={(event) => setForm({ ...form, division_id: event.target.value })} required className="ui-form-control" aria-invalid={!!fieldError("division_id")}><option value="">Select division</option>{divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}</select></FormField>
        <FormField label="Class name" htmlFor="class-name" required error={fieldError("name")}><input id="class-name" name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Primary 1 or JSS 2" required className="ui-form-control" aria-invalid={!!fieldError("name")} /></FormField>
        <FormField label="Class code" htmlFor="class-code"><input id="class-code" name="code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="e.g. PR1" className="ui-form-control" /></FormField>
        <FormField label="Display order" htmlFor="class-order"><input id="class-order" name="display_order" type="number" min="1" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: event.target.value })} className="ui-form-control" /></FormField>
        <label className="ui-form-field flex items-center gap-2"><input type="checkbox" name="is_active" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /><span className="ui-form-label mb-0">Active academic class</span></label>
      </form>
    </Modal>}
  </PageContainer>;
}
