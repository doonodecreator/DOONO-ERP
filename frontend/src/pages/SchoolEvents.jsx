import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const EVENT_TYPES = ["Academic", "Sports", "Meeting", "Cultural", "Examination", "Holiday", "Other"];
const EVENT_STATUSES = ["Planned", "Ongoing", "Completed", "Cancelled"];

const initialForm = {
  title: "",
  event_type: "Other",
  description: "",
  start_at: "",
  end_at: "",
  venue: "",
  organizer_staff_id: "",
  audience: "",
  status: "Planned",
  notes: "",
};

export default function SchoolEvents() {
  const [events, setEvents] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingEvent, setEditingEvent] = useState(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEvents = async () => {
    const response = await api.get("/school-events", { params: { per_page: 100 } });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;
    if (!data) throw new Error("The school events response is not a valid collection.");
    setEvents(data);
  };

  const loadStaff = async (search = "") => {
    const response = await api.get("/school-events/options", { params: search ? { search } : undefined });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;
    if (!data) throw new Error("The event organizer response is not a valid collection.");
    setStaffOptions(data);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadEvents(), loadStaff()]);
    } catch (requestError) {
      setEvents([]);
      setStaffOptions([]);
      setError(requestError.message || "Unable to load school events.");
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
    setEditingEvent(null);
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title || "",
      event_type: event.event_type || "Other",
      description: event.description || "",
      start_at: event.start_at ? String(event.start_at).slice(0, 16) : "",
      end_at: event.end_at ? String(event.end_at).slice(0, 16) : "",
      venue: event.venue || "",
      organizer_staff_id: event.organizer_staff_id ? String(event.organizer_staff_id) : "",
      audience: event.audience || "",
      status: event.status || "Planned",
      notes: event.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitEvent = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const payload = {
        ...form,
        end_at: form.end_at || null,
        organizer_staff_id: form.organizer_staff_id ? Number(form.organizer_staff_id) : null,
        description: form.description || null,
        venue: form.venue || null,
        audience: form.audience || null,
        notes: form.notes || null,
      };
      if (editingEvent) {
        await api.put(`/school-events/${editingEvent.id}`, payload);
        setMessage("School event updated successfully.");
      } else {
        const { status, ...createPayload } = payload;
        await api.post("/school-events", createPayload);
        setMessage("School event scheduled successfully.");
      }
      resetForm();
      await loadEvents();
    } catch (requestError) {
      setError(requestError.message || "Unable to save the school event.");
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
      setError(requestError.message || "Unable to search staff organizers.");
    }
  };

  const columns = [
    { key: "title", label: "Event" },
    { key: "event_type", label: "Type" },
    { key: "start_at", label: "Starts", render: (row) => row.start_at ? new Date(row.start_at).toLocaleString() : "—" },
    { key: "venue", label: "Venue" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", render: (row) => <button type="button" onClick={() => editEvent(row)}>Edit</button> },
  ];

  return (
    <div className="page-container">
      <PageHeader title="School Events" subtitle="Schedule and maintain school-wide events within the current school." />
      <form onSubmit={submitEvent} className="asset-register-form">
        <h2>{editingEvent ? "Edit school event" : "Schedule an event"}</h2>
        <label>Title<input value={form.title} onChange={(event) => setField("title", event.target.value)} maxLength={255} required /></label>
        <label>Type<select value={form.event_type} onChange={(event) => setField("event_type", event.target.value)}>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label>Start<input type="datetime-local" value={form.start_at} onChange={(event) => setField("start_at", event.target.value)} required /></label>
        <label>End (optional)<input type="datetime-local" value={form.end_at} onChange={(event) => setField("end_at", event.target.value)} /></label>
        <label>Venue<input value={form.venue} onChange={(event) => setField("venue", event.target.value)} maxLength={255} /></label>
        <label>Audience<input value={form.audience} onChange={(event) => setField("audience", event.target.value)} maxLength={100} placeholder="All students, staff, parents..." /></label>
        <label>Search organizers<input value={staffSearch} onChange={(event) => setStaffSearch(event.target.value)} maxLength={100} /><button type="button" onClick={searchStaff}>Search staff</button></label>
        <label>Organizer<select value={form.organizer_staff_id} onChange={(event) => setField("organizer_staff_id", event.target.value)}><option value="">Unassigned</option>{Array.isArray(staffOptions) && staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.label}</option>)}</select></label>
        {editingEvent && <label>Status<select value={form.status} onChange={(event) => setField("status", event.target.value)}>{EVENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>}
        <label>Description<textarea value={form.description} onChange={(event) => setField("description", event.target.value)} maxLength={5000} /></label>
        <label>Notes<textarea value={form.notes} onChange={(event) => setField("notes", event.target.value)} maxLength={5000} /></label>
        <div className="asset-register-actions"><button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingEvent ? "Save event changes" : "Schedule event"}</button>{editingEvent && <button type="button" onClick={resetForm}>Cancel edit</button>}</div>
      </form>
      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}
      {loading ? <LoadingSpinner text="Loading school events..." /> : events.length === 0 ? <EmptyState title="No school events" message="Schedule an event to begin building the school calendar." /> : <DataTable columns={columns} data={Array.isArray(events) ? events : []} emptyMessage="No school events." />}
    </div>
  );
}
