import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const CATEGORIES = ["Classroom", "Office", "Laboratory", "Sports", "Sanitation", "Security", "Other"];
const CONDITIONS = ["New", "Good", "Fair", "Poor", "Critical"];
const STATUSES = ["Operational", "Under Maintenance", "Unavailable", "Decommissioned"];

const initialForm = {
  name: "",
  category: "Other",
  location: "",
  condition: "Good",
  status: "Operational",
  description: "",
  last_inspected_at: "",
  next_inspection_at: "",
  responsible_staff_id: "",
  notes: "",
};

export default function SchoolFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingFacility, setEditingFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFacilities = async () => {
    const response = await api.get("/school-facilities", { params: { per_page: 100 } });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;
    if (!data) throw new Error("The facilities response is not a valid collection.");
    setFacilities(data);
  };

  const loadStaff = async (search = "") => {
    const response = await api.get("/school-facilities/options", { params: search ? { search } : undefined });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;
    if (!data) throw new Error("The responsible staff response is not a valid collection.");
    setStaffOptions(data);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadFacilities(), loadStaff()]);
    } catch (requestError) {
      setFacilities([]);
      setStaffOptions([]);
      setError(requestError.message || "Unable to load facilities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(initialForm);
    setEditingFacility(null);
  };

  const editFacility = (facility) => {
    setEditingFacility(facility);
    setForm({
      name: facility.name || "",
      category: facility.category || "Other",
      location: facility.location || "",
      condition: facility.condition || "Good",
      status: facility.status || "Operational",
      description: facility.description || "",
      last_inspected_at: facility.last_inspected_at || "",
      next_inspection_at: facility.next_inspection_at || "",
      responsible_staff_id: facility.responsible_staff_id ? String(facility.responsible_staff_id) : "",
      notes: facility.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitFacility = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const payload = {
        ...form,
        responsible_staff_id: form.responsible_staff_id ? Number(form.responsible_staff_id) : null,
        last_inspected_at: form.last_inspected_at || null,
        next_inspection_at: form.next_inspection_at || null,
        description: form.description || null,
        notes: form.notes || null,
      };
      if (editingFacility) {
        await api.put(`/school-facilities/${editingFacility.id}`, payload);
        setMessage("Facility updated successfully.");
      } else {
        const { status, ...createPayload } = payload;
        await api.post("/school-facilities", createPayload);
        setMessage("Facility registered successfully.");
      }
      resetForm();
      await loadFacilities();
    } catch (requestError) {
      setError(requestError.message || "Unable to save the facility.");
    } finally {
      setSubmitting(false);
    }
  };

  const searchStaff = async () => {
    try {
      setError("");
      await loadStaff(staffSearch.trim());
    } catch (requestError) {
      setStaffOptions([]);
      setError(requestError.message || "Unable to search responsible staff.");
    }
  };

  const summary = useMemo(() => facilities.reduce((totals, facility) => {
    totals[facility.status] = (totals[facility.status] || 0) + 1;
    return totals;
  }, { Operational: 0, "Under Maintenance": 0, Unavailable: 0, Decommissioned: 0 }), [facilities]);

  const columns = [
    { key: "name", label: "Facility" },
    { key: "category", label: "Category" },
    { key: "location", label: "Location" },
    { key: "condition", label: "Condition" },
    { key: "status", label: "Status" },
    { key: "next_inspected", label: "Next inspection", render: (row) => row.next_inspection_at || "—" },
    { key: "actions", label: "Actions", render: (row) => <button type="button" onClick={() => editFacility(row)}>Edit</button> },
  ];

  return (
    <div className="page-container">
      <PageHeader title="Facilities Management" subtitle="Register, inspect, and maintain school facilities within the current school." />
      <form onSubmit={submitFacility} className="asset-register-form">
        <h2>{editingFacility ? "Edit facility" : "Register facility"}</h2>
        <label>Name<input value={form.name} onChange={(event) => setField("name", event.target.value)} maxLength={255} required /></label>
        <label>Category<select value={form.category} onChange={(event) => setField("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>Location<input value={form.location} onChange={(event) => setField("location", event.target.value)} maxLength={255} /></label>
        <label>Condition<select value={form.condition} onChange={(event) => setField("condition", event.target.value)}>{CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select></label>
        <label>Last inspected<input type="date" value={form.last_inspected_at} onChange={(event) => setField("last_inspected_at", event.target.value)} /></label>
        <label>Next inspection<input type="date" value={form.next_inspection_at} onChange={(event) => setField("next_inspection_at", event.target.value)} /></label>
        <label>Search responsible staff<input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} maxLength={100} /><button type="button" onClick={searchStaff}>Search staff</button></label>
        <label>Responsible staff<select value={form.responsible_staff_id} onChange={(event) => setField("responsible_staff_id", event.target.value)}><option value="">Unassigned</option>{Array.isArray(staffOptions) && staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.label}</option>)}</select></label>
        {editingFacility && <label>Status<select value={form.status} onChange={(event) => setField("status", event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>}
        <label>Description<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} maxLength={5000} /></label>
        <label>Notes<textarea value={form.notes} onChange={(event) => setField("notes", event.target.value)} maxLength={5000} /></label>
        <div className="asset-register-actions"><button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingFacility ? "Save facility changes" : "Register facility"}</button>{editingFacility && <button type="button" onClick={resetForm}>Cancel edit</button>}</div>
      </form>
      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}
      <div className="asset-register-summary">{Object.entries(summary).map(([status, count]) => <div key={status} className="asset-register-summary-card"><span>{status}</span><strong>{count}</strong></div>)}</div>
      {loading ? <LoadingSpinner text="Loading facilities..." /> : facilities.length === 0 ? <EmptyState title="No facilities registered" message="Register school facilities to begin tracking condition and maintenance status." /> : <DataTable columns={columns} data={Array.isArray(facilities) ? facilities : []} emptyMessage="No facilities registered." />}
    </div>
  );
}
