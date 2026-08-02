import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Results({ setPage }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [examinations, setExaminations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    school_id: "",
    academic_session_id: "",
    term_id: "",
    name: "",
    exam_type: "Examination",
    total_marks: 100,
    start_date: "",
    end_date: "",
    status: "Draft",
  });

  // Role Detection
  const userRole = (
    user?.role ||
    user?.roles?.[0]?.slug ||
    user?.roles?.[0]?.name ||
    "guest"
  ).toLowerCase();

  const isSuperAdmin = userRole === "super_admin";
  const isSchoolAdmin = userRole === "school_admin" || userRole === "admin" || userRole === "principal";
  const isTeacher = userRole === "teacher";
  const isStudent = userRole === "student";
  const isParent = userRole === "parent";

  // Action Permissions
  const canManageExams = isSuperAdmin || isSchoolAdmin;
  const canEnterResults = isSuperAdmin || isSchoolAdmin || isTeacher;
  const canPublishResults = isSuperAdmin || isSchoolAdmin; // Principal/Admin approval required
  const isViewOnlyUser = isStudent || isParent;

  useEffect(() => {
    loadData();
  }, []);

  /* ============================================================
     DATA LOADING
  ============================================================ */
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [examRes, schoolRes, sessionRes, termRes] = await Promise.allSettled([
        api.get("/examinations"),
        api.get("/schools"),
        api.get("/academic-sessions"),
        api.get("/terms"),
      ]);

      if (examRes.status === "fulfilled") {
        const data = examRes.value?.data?.data ?? examRes.value?.data ?? [];
        setExaminations(Array.isArray(data) ? data : []);
      }

      if (schoolRes.status === "fulfilled") {
        const data = schoolRes.value?.data?.data ?? schoolRes.value?.data ?? [];
        setSchools(Array.isArray(data) ? data : []);
      }

      if (sessionRes.status === "fulfilled") {
        const data = sessionRes.value?.data?.data ?? sessionRes.value?.data ?? [];
        setSessions(Array.isArray(data) ? data : []);
      }

      if (termRes.status === "fulfilled") {
        const data = termRes.value?.data?.data ?? termRes.value?.data ?? [];
        setTerms(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Results data loading error:", err);
      setError("Unable to load examinations data.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      school_id: "",
      academic_session_id: "",
      term_id: "",
      name: "",
      exam_type: "Examination",
      total_marks: 100,
      start_date: "",
      end_date: "",
      status: "Draft",
    });
  }

 /* ============================================================
     SAVE / UPDATE EXAM DEFINITION
  ============================================================ */
  async function saveExam(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.put(`/examinations/${editingId}`, form);
        setMessage("Examination updated successfully.");
      } else {
        await api.post("/examinations", form);
        setMessage("Examination created successfully.");
      }

      resetForm();
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError(err?.message || err?.data?.message || "Unable to save examination.");
    }
  }

  /* ============================================================
     PUBLISH RESULTS (Principal / Admin Only)
  ============================================================ */
  async function publishExamResults(examId) {
    if (!window.confirm("Are you sure you want to PUBLISH these results? Once published, students and parents will be able to view report cards.")) {
      return;
    }

    try {
      await api.post(`/examinations/${examId}/publish`);
      setMessage("Results published successfully! Report cards are now accessible to parents and students.");
      loadData();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to publish results. Ensure all subject scores are entered.");
    }
  }

  /* ============================================================
     DELETE EXAM
  ============================================================ */
  async function deleteExam(id) {
    if (!window.confirm("Are you sure you want to delete this examination?")) {
      return;
    }

    try {
      await api.delete(`/examinations/${id}`);
      setMessage("Examination deleted successfully.");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Unable to delete examination.");
    }
  }

  function editExam(exam) {
    setEditingId(exam.id);
    setShowForm(true);
    setForm({
      school_id: exam.school_id || "",
      academic_session_id: exam.academic_session_id || "",
      term_id: exam.term_id || "",
      name: exam.name || "",
      exam_type: exam.exam_type || "Examination",
      total_marks: exam.total_marks || 100,
      start_date: exam.start_date || "",
      end_date: exam.end_date || "",
      status: exam.status || "Draft",
    });
  }

  // Filter exams by search query
  // Students and parents should ONLY see Published or Completed exams
  const filtered = examinations.filter((exam) => {
    const matchesSearch = exam.name?.toLowerCase().includes(search.toLowerCase());
    if (isViewOnlyUser) {
      return matchesSearch && (exam.status === "Published" || exam.status === "Completed");
    }
    return matchesSearch;
  });

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="mb-1" style={{ fontSize: "26px", fontWeight: "700", color: "#1e3a8a" }}>
            {isViewOnlyUser ? "My Academic Results" : "Results & Examinations"}
          </h1>
          <p className="text-muted mb-0">
            {isStudent && "View your official published examination report cards."}
            {isParent && "View official published report cards for your child."}
            {isTeacher && "Enter subject scores for students. Saved entries await Principal approval."}
            {canManageExams && "Manage examinations, review teacher score entries, and publish official report cards."}
          </p>
        </div>

        {canManageExams && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary"
            style={{ background: "#2563eb", border: "none", fontWeight: "600" }}
          >
            + New Examination
          </button>
        )}
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* Metrics Row (Hidden for Students/Parents) */}
      {!isViewOnlyUser && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 p-3">
              <span className="text-muted small">Total Exams</span>
              <h3 className="mb-0 mt-1" style={{ fontWeight: "700" }}>{examinations.length}</h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 p-3">
              <span className="text-muted small">Draft / Ongoing</span>
              <h3 className="mb-0 mt-1 text-warning" style={{ fontWeight: "700" }}>
                {examinations.filter((e) => e.status === "Draft" || e.status === "Ongoing").length}
              </h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 p-3">
              <span className="text-muted small">Pending Approval</span>
              <h3 className="mb-0 mt-1 text-info" style={{ fontWeight: "700" }}>
                {examinations.filter((e) => e.status === "Submitted").length}
              </h3>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-0 p-3">
              <span className="text-muted small">Published</span>
              <h3 className="mb-0 mt-1 text-success" style={{ fontWeight: "700" }}>
                {examinations.filter((e) => e.status === "Published" || e.status === "Completed").length}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="d-flex gap-2 mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search examination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-outline-secondary" onClick={loadData}>
          Refresh
        </button>
      </div>

      {/* Exam Configuration Form (Admin Only) */}
      {showForm && canManageExams && (
        <form onSubmit={saveExam} className="card shadow-sm p-4 mb-4 border-0">
          <h4 className="mb-3">{editingId ? "Edit Examination" : "Create Examination"}</h4>

          <div className="row g-3">
            {isSuperAdmin && (
              <div className="col-md-6">
                <label className="form-label font-weight-bold">School</label>
                <select
                  name="school_id"
                  className="form-select"
                  value={form.school_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select School</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-6">
              <label className="form-label font-weight-bold">Academic Session</label>
              <select
                name="academic_session_id"
                className="form-select"
                value={form.academic_session_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold">Term</label>
              <select
                name="term_id"
                className="form-select"
                value={form.term_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold">Examination Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. First Term Final Exam"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label font-weight-bold">Exam Type</label>
              <select
                name="exam_type"
                className="form-select"
                value={form.exam_type}
                onChange={handleChange}
              >
                <option value="CA1">CA1</option>
                <option value="CA2">CA2</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="Examination">Examination</option>
                <option value="Mock">Mock</option>
                <option value="Promotion">Promotion</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label font-weight-bold">Total Marks</label>
              <input
                type="number"
                name="total_marks"
                className="form-control"
                value={form.total_marks}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label font-weight-bold">Initial Status</label>
              <select
                name="status"
                className="form-select"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold">Start Date</label>
              <input
                type="date"
                name="start_date"
                className="form-control"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label font-weight-bold">End Date</label>
              <input
                type="date"
                name="end_date"
                className="form-control"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" style={{ background: "#2563eb", border: "none" }}>
              {editingId ? "Update Examination" : "Save Examination"}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Examinations Data Table */}
      {loading ? (
        <div className="card shadow-sm p-5 text-center text-muted">Loading examinations...</div>
      ) : (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Examination</th>
                  <th>Type</th>
                  <th>Session</th>
                  <th>Term</th>
                  <th>Total Marks</th>
                  <th>Status</th>
                  <th style={{ minWidth: "240px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      {isViewOnlyUser
                        ? "No published results are available at this time."
                        : "No examinations found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((exam) => (
                    <tr key={exam.id}>
                      <td className="fw-semibold">{exam.name}</td>
                      <td>{exam.exam_type}</td>
                      <td>{exam.academic_session?.name || "-"}</td>
                      <td>{exam.term?.name || "-"}</td>
                      <td>{exam.total_marks}</td>
                      <td>
                        <span
                          className={`badge ${
                            exam.status === "Published" || exam.status === "Completed"
                              ? "bg-success"
                              : exam.status === "Submitted"
                              ? "bg-info text-dark"
                              : exam.status === "Ongoing"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                          }`}
                        >
                          {exam.status === "Published" ? "Published (Live)" : exam.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {/* Admin Edit/Delete */}
                          {canManageExams && exam.status !== "Published" && (
                            <>
                              <button
                                onClick={() => editExam(exam)}
                                className="btn btn-sm btn-outline-primary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteExam(exam.id)}
                                className="btn btn-sm btn-outline-danger"
                              >
                                Delete
                              </button>
                            </>
                          )}

                          {/* Teacher / Admin Score Entry */}
                          {canEnterResults && exam.status !== "Published" && setPage && (
                            <button
                              onClick={() => setPage("result-entry")}
                              className="btn btn-sm btn-success"
                            >
                              Enter/Edit Scores
                            </button>
                          )}

                          {/* Principal / Admin Publish Button */}
                          {canPublishResults && exam.status !== "Published" && (
                            <button
                              onClick={() => publishExamResults(exam.id)}
                              className="btn btn-sm btn-warning text-dark font-weight-bold"
                            >
                              Publish Results
                            </button>
                          )}

                          {/* View Report Card Button (Available to all when published, or to Admin anytime) */}
                          {setPage && (exam.status === "Published" || exam.status === "Completed" || canManageExams) && (
                            <button
                              onClick={() => setPage("report-cards")}
                              className="btn btn-sm"
                              style={{ background: "#7c3aed", color: "#fff" }}
                            >
                              {isStudent || isParent ? "View My Report Card" : "View Report Cards"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
