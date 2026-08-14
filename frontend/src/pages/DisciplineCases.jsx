import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const CATEGORIES = [
  "Bullying",
  "Disrespect",
  "Violence",
  "Theft",
  "Harassment",
  "Academic Misconduct",
  "Property Damage",
  "Absenteeism",
  "Other",
];

const SEVERITIES = ["Minor", "Major", "Critical"];

const initialForm = {
  student_id: "",
  incident_date: new Date().toISOString().slice(0, 10),
  category: "Disrespect",
  severity: "Minor",
  description: "",
};

export default function DisciplineCases() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCases = async () => {
    const response = await api.get("/discipline-cases", {
      params: { per_page: 50 },
    });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;

    if (!data) {
      throw new Error("The discipline case response is not a valid collection.");
    }

    setRecords(data);
  };

  const loadStudents = async (search = "") => {
    const response = await api.get("/discipline-cases/options", {
      params: search ? { search } : {},
    });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;

    if (!data) {
      throw new Error("The student options response is not a valid collection.");
    }

    setStudents(data);
    setCanManage(Boolean(response?.data?.can_manage));
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadCases(), loadStudents()]);
    } catch (requestError) {
      setRecords([]);
      setStudents([]);
      setError(requestError.message || "Unable to load discipline cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const searchStudents = async () => {
    try {
      setError("");
      await loadStudents(studentSearch.trim());
    } catch (requestError) {
      setStudents([]);
      setError(requestError.message || "Unable to search students.");
    }
  };

  const submitCase = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      await api.post("/discipline-cases", {
        ...form,
        student_id: Number(form.student_id),
      });
      setForm((current) => ({
        ...initialForm,
        incident_date: current.incident_date,
      }));
      setMessage("Discipline case reported successfully.");
      await loadCases();
    } catch (requestError) {
      setError(requestError.message || "Unable to report the discipline case.");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewCase = async (record, status) => {
    const actionTaken = status === "Resolved"
      ? window.prompt("Action taken (required to resolve this case):", record.action_taken || "")
      : window.prompt(`Optional action or note for ${status.toLowerCase()}:`, record.action_taken || "");

    if (actionTaken === null || (status === "Resolved" && !actionTaken.trim())) {
      return;
    }

    const resolutionNotes = window.prompt("Optional resolution note:", record.resolution_notes || "");

    if (resolutionNotes === null) {
      return;
    }

    const parentNotified = record.parent_notified
      || window.confirm("Has the parent or guardian been notified?");

    try {
      setError("");
      setMessage("");
      await api.post(`/discipline-cases/${record.id}/review`, {
        status,
        action_taken: actionTaken,
        resolution_notes: resolutionNotes,
        parent_notified: parentNotified,
      });
      setMessage(`Discipline case marked ${status.toLowerCase()}.`);
      await loadCases();
    } catch (requestError) {
      setError(requestError.message || "Unable to review the discipline case.");
    }
  };

  const summary = useMemo(() => records.reduce((totals, record) => {
    totals[record.status] = (totals[record.status] || 0) + 1;
    return totals;
  }, { Reported: 0, "Under Review": 0, Resolved: 0, Dismissed: 0 }), [records]);

  const columns = [
    { key: "case_number", label: "Case" },
    {
      key: "student",
      label: "Student",
      render: (row) => row.student?.full_name || "—",
    },
    { key: "category", label: "Category" },
    { key: "severity", label: "Severity" },
    { key: "incident_date", label: "Incident date" },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const canReview = canManage
          && !["Resolved", "Dismissed"].includes(row.status)
          && row.reported_by !== user?.id;

        if (!canReview) {
          return "—";
        }

        return (
          <div className="discipline-case-actions">
            <button type="button" onClick={() => reviewCase(row, "Under Review")}>Review</button>
            <button type="button" onClick={() => reviewCase(row, "Resolved")}>Resolve</button>
            <button type="button" onClick={() => reviewCase(row, "Dismissed")}>Dismiss</button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Discipline Cases"
        subtitle={canManage ? "Review and resolve student discipline cases for the current school." : "Report and track the student discipline cases you submitted."}
      />

      <form onSubmit={submitCase} className="discipline-case-form">
        <label>
          Student search
          <div className="discipline-student-search">
            <input
              type="search"
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Name or admission number"
            />
            <button type="button" onClick={searchStudents}>Search</button>
          </div>
        </label>
        <label>
          Student
          <select
            value={form.student_id}
            onChange={(event) => setForm((current) => ({ ...current, student_id: event.target.value }))}
            required
          >
            <option value="">Select student</option>
            {Array.isArray(students) && students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name} ({student.admission_number})
              </option>
            ))}
          </select>
        </label>
        <label>
          Incident date
          <input
            type="date"
            value={form.incident_date}
            onChange={(event) => setForm((current) => ({ ...current, incident_date: event.target.value }))}
            required
          />
        </label>
        <label>
          Category
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          >
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Severity
          <select
            value={form.severity}
            onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
          >
            {SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
        </label>
        <label>
          Incident description
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            maxLength={4000}
            required
          />
        </label>
        <button type="submit" disabled={submitting || !form.student_id}>
          {submitting ? "Reporting..." : "Report discipline case"}
        </button>
      </form>

      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}

      <div className="discipline-case-summary">
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} className="discipline-case-summary-card">
            <span>{status}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading discipline cases..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No discipline cases found"
          message="Report a student behaviour incident when a documented case is required."
        />
      ) : (
        <DataTable
          columns={columns}
          data={Array.isArray(records) ? records : []}
          emptyMessage="No discipline cases found."
        />
      )}
    </div>
  );
}
