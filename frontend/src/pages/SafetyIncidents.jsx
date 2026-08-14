import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const CATEGORIES = [
  "Injury",
  "Illness",
  "Fire or Evacuation",
  "Hazard",
  "Security",
  "Transport",
  "Facility",
  "Other",
];

const SEVERITIES = ["Low", "Moderate", "High", "Critical"];
const SUBJECT_TYPES = ["Student", "Staff", "Visitor", "Other"];

const currentDateTime = () => new Date().toISOString().slice(0, 16);

const initialForm = {
  subject_type: "Student",
  subject_id: "",
  other_subject_name: "",
  clinic_visit_id: "",
  incident_at: currentDateTime(),
  category: "Injury",
  severity: "Low",
  location: "",
  description: "",
  immediate_action: "",
  requires_medical_attention: false,
};

export default function SafetyIncidents() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState({ students: [], staff: [], visitors: [], clinicVisits: [] });
  const [subjectSearch, setSubjectSearch] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadIncidents = async () => {
    const response = await api.get("/safety-incidents", { params: { per_page: 50 } });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;

    if (!data) {
      throw new Error("The safety incident response is not a valid collection.");
    }

    setRecords(data);
  };

  const loadOptions = async (search = "", studentId = "") => {
    const response = await api.get("/safety-incidents/options", {
      params: {
        ...(search ? { search } : {}),
        ...(studentId ? { student_id: studentId } : {}),
      },
    });

    const students = Array.isArray(response?.data?.students) ? response.data.students : null;
    const staff = Array.isArray(response?.data?.staff) ? response.data.staff : null;
    const visitors = Array.isArray(response?.data?.visitors) ? response.data.visitors : null;
    const clinicVisits = Array.isArray(response?.data?.clinic_visits) ? response.data.clinic_visits : null;

    if (!students || !staff || !visitors || !clinicVisits) {
      throw new Error("The safety incident options response is not a valid collection.");
    }

    setSubjects({ students, staff, visitors, clinicVisits });
    setCanManage(Boolean(response?.data?.can_manage));
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadIncidents(), loadOptions()]);
    } catch (requestError) {
      setRecords([]);
      setSubjects({ students: [], staff: [], visitors: [], clinicVisits: [] });
      setError(requestError.message || "Unable to load safety incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const searchSubjects = async () => {
    try {
      setError("");
      await loadOptions(subjectSearch.trim(), form.subject_type === "Student" ? form.subject_id : "");
    } catch (requestError) {
      setError(requestError.message || "Unable to search safety incident subjects.");
    }
  };

  const setSubjectType = async (subjectType) => {
    const nextForm = {
      ...form,
      subject_type: subjectType,
      subject_id: "",
      other_subject_name: "",
      clinic_visit_id: "",
    };
    setForm(nextForm);

    try {
      await loadOptions(subjectSearch.trim());
    } catch (requestError) {
      setError(requestError.message || "Unable to refresh safety incident subjects.");
    }
  };

  const setSubject = async (subjectId) => {
    const nextForm = {
      ...form,
      subject_id: subjectId,
      clinic_visit_id: "",
    };
    setForm(nextForm);

    if (form.subject_type === "Student" && subjectId) {
      try {
        await loadOptions(subjectSearch.trim(), subjectId);
      } catch (requestError) {
        setError(requestError.message || "Unable to load clinic visits for this student.");
      }
    }
  };

  const submitIncident = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = {
        subject_type: form.subject_type,
        incident_at: form.incident_at,
        category: form.category,
        severity: form.severity,
        location: form.location,
        description: form.description,
        immediate_action: form.immediate_action || undefined,
        requires_medical_attention: form.requires_medical_attention,
      };

      if (form.subject_type === "Student") {
        payload.student_id = Number(form.subject_id);
        payload.clinic_visit_id = form.clinic_visit_id ? Number(form.clinic_visit_id) : undefined;
      } else if (form.subject_type === "Staff") {
        payload.staff_id = Number(form.subject_id);
      } else if (form.subject_type === "Visitor") {
        payload.visitor_id = Number(form.subject_id);
      } else {
        payload.other_subject_name = form.other_subject_name;
      }

      await api.post("/safety-incidents", payload);
      setForm({ ...initialForm, incident_at: currentDateTime() });
      setMessage("Safety incident reported successfully.");
      await loadIncidents();
    } catch (requestError) {
      setError(requestError.message || "Unable to report the safety incident.");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewIncident = async (record, status) => {
    const action = status === "Resolved"
      ? window.prompt("Immediate action taken (required to resolve this incident):", record.immediate_action || "")
      : window.prompt(`Optional action or note for ${status.toLowerCase()}:`, record.immediate_action || "");

    if (action === null || (status === "Resolved" && !action.trim())) {
      return;
    }

    const notes = status === "Resolved"
      ? window.prompt("Resolution notes (required to resolve this incident):", record.resolution_notes || "")
      : window.prompt("Optional resolution note:", record.resolution_notes || "");

    if (notes === null || (status === "Resolved" && !notes.trim())) {
      return;
    }

    const guardianContacted = record.subject_type === "Student"
      ? (record.guardian_contacted || window.confirm("Has the parent or guardian been contacted?"))
      : undefined;
    const emergencyServicesContacted = record.emergency_services_contacted
      || window.confirm("Were emergency services contacted?");

    try {
      setError("");
      setMessage("");
      await api.post(`/safety-incidents/${record.id}/review`, {
        status,
        immediate_action: action,
        resolution_notes: notes,
        ...(guardianContacted !== undefined ? { guardian_contacted: guardianContacted } : {}),
        emergency_services_contacted: emergencyServicesContacted,
      });
      setMessage(`Safety incident marked ${status.toLowerCase()}.`);
      await loadIncidents();
    } catch (requestError) {
      setError(requestError.message || "Unable to review the safety incident.");
    }
  };

  const selectableSubjects = useMemo(() => {
    if (form.subject_type === "Student") return subjects.students;
    if (form.subject_type === "Staff") return subjects.staff;
    if (form.subject_type === "Visitor") return subjects.visitors;
    return [];
  }, [form.subject_type, subjects]);

  const summary = useMemo(() => records.reduce((totals, record) => {
    totals[record.status] = (totals[record.status] || 0) + 1;
    return totals;
  }, { Reported: 0, "Under Review": 0, Resolved: 0, Closed: 0 }), [records]);

  const columns = [
    { key: "incident_number", label: "Incident" },
    { key: "subject_label", label: "Subject" },
    { key: "category", label: "Category" },
    { key: "severity", label: "Severity" },
    { key: "location", label: "Location" },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const canReview = canManage && row.reported_by !== user?.id && row.status !== "Closed";

        if (!canReview) {
          return "—";
        }

        if (row.status === "Resolved") {
          return <button type="button" onClick={() => reviewIncident(row, "Closed")}>Close</button>;
        }

        return (
          <div className="safety-incident-actions">
            <button type="button" onClick={() => reviewIncident(row, "Under Review")}>Review</button>
            <button type="button" onClick={() => reviewIncident(row, "Resolved")}>Resolve</button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Safety Incidents"
        subtitle={canManage ? "Review and resolve school safety incidents." : "Report and track the safety incidents you submitted."}
      />

      <form onSubmit={submitIncident} className="safety-incident-form">
        <label>
          Subject type
          <select value={form.subject_type} onChange={(event) => setSubjectType(event.target.value)}>
            {SUBJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        {form.subject_type === "Other" ? (
          <label>
            Hazard or other subject
            <input
              value={form.other_subject_name}
              onChange={(event) => setForm((current) => ({ ...current, other_subject_name: event.target.value }))}
              maxLength={255}
              required
            />
          </label>
        ) : (
          <>
            <label>
              Search subject
              <div className="safety-subject-search">
                <input
                  type="search"
                  value={subjectSearch}
                  onChange={(event) => setSubjectSearch(event.target.value)}
                  placeholder="Name, number, or phone"
                />
                <button type="button" onClick={searchSubjects}>Search</button>
              </div>
            </label>
            <label>
              {form.subject_type}
              <select value={form.subject_id} onChange={(event) => setSubject(event.target.value)} required>
                <option value="">Select {form.subject_type.toLowerCase()}</option>
                {Array.isArray(selectableSubjects) && selectableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.label}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {form.subject_type === "Student" && (
          <label>
            Related clinic visit (optional)
            <select
              value={form.clinic_visit_id}
              onChange={(event) => setForm((current) => ({ ...current, clinic_visit_id: event.target.value }))}
              disabled={!form.subject_id}
            >
              <option value="">No linked clinic visit</option>
              {Array.isArray(subjects.clinicVisits) && subjects.clinicVisits.map((visit) => (
                <option key={visit.id} value={visit.id}>{visit.label}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Incident date and time
          <input
            type="datetime-local"
            value={form.incident_at}
            onChange={(event) => setForm((current) => ({ ...current, incident_at: event.target.value }))}
            required
          />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Severity
          <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}>
            {SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
        </label>
        <label>
          Location
          <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} maxLength={255} required />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={4000} required />
        </label>
        <label>
          Immediate action taken (optional)
          <textarea value={form.immediate_action} onChange={(event) => setForm((current) => ({ ...current, immediate_action: event.target.value }))} maxLength={4000} />
        </label>
        <label>
          <input type="checkbox" checked={form.requires_medical_attention} onChange={(event) => setForm((current) => ({ ...current, requires_medical_attention: event.target.checked }))} />
          Requires medical attention
        </label>
        <button type="submit" disabled={submitting || (form.subject_type !== "Other" && !form.subject_id) || (form.subject_type === "Other" && !form.other_subject_name.trim())}>
          {submitting ? "Reporting..." : "Report safety incident"}
        </button>
      </form>

      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}

      <div className="safety-incident-summary">
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} className="safety-incident-summary-card">
            <span>{status}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading safety incidents..." />
      ) : records.length === 0 ? (
        <EmptyState title="No safety incidents found" message="Report a student, staff, visitor, or hazard safety incident when a documented record is required." />
      ) : (
        <DataTable columns={columns} data={Array.isArray(records) ? records : []} emptyMessage="No safety incidents found." />
      )}
    </div>
  );
}
