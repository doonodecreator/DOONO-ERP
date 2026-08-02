import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ResultEntry({ setPage }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Filters & Dropdowns
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [structures, setStructures] = useState([]); // Assessment Components (CA1, CA2, Exam...)

  // Selection state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  // Student Score Matrix
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({}); // { [enrollment_id]: { [structure_id]: score } }
  const [isLocked, setIsLocked] = useState(false);

  // User role checking
  const userRole = (
    user?.role ||
    user?.roles?.[0]?.slug ||
    user?.roles?.[0]?.name ||
    "guest"
  ).toLowerCase();

  const isPrincipalOrAdmin =
    userRole === "super_admin" ||
    userRole === "school_admin" ||
    userRole === "admin" ||
    userRole === "principal";

  const isTeacher = userRole === "teacher";

  /* ============================================================
     INITIAL LOAD: Classes, Sessions, Terms
  ============================================================ */
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [classRes, sessionRes, termRes] = await Promise.allSettled([
          api.get("/classes"),
          api.get("/academic-sessions"),
          api.get("/terms"),
        ]);

        if (classRes.status === "fulfilled") {
          setClasses(classRes.value?.data?.data ?? classRes.value?.data ?? []);
        }
        if (sessionRes.status === "fulfilled") {
          setSessions(sessionRes.value?.data?.data ?? sessionRes.value?.data ?? []);
        }
        if (termRes.status === "fulfilled") {
          setTerms(termRes.value?.data?.data ?? termRes.value?.data ?? []);
        }
      } catch (err) {
        console.error("Initial load error:", err);
      }
    }

    fetchInitialData();
  }, []);

  /* ============================================================
     LOAD STUDENTS & ASSESSMENT STRUCTURES WHEN CLASS CHANGED
  ============================================================ */
  async function loadStudentSheet() {
    if (!selectedClass) {
      setError("Please select a class first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.get(`/result-entry/students?class_id=${selectedClass}`);
      const data = res?.data ?? {};

      const loadedStudents = data.students || [];
      const loadedSubjects = data.subjects || [];
      const loadedStructures = data.structures || [];

      setStudents(loadedStudents);
      setSubjects(loadedSubjects);
      setStructures(loadedStructures);

      if (data.sessions?.length) setSessions(data.sessions);
      if (data.terms?.length) setTerms(data.terms);

      // Reset score state mapping
      const initialScores = {};
      loadedStudents.forEach((enrollment) => {
        initialScores[enrollment.id] = {};
        loadedStructures.forEach((struct) => {
          initialScores[enrollment.id][struct.id] = "";
        });
      });

      setScores(initialScores);
      setIsLocked(false);
    } catch (err) {
      console.error(err);
      setError("Unable to load student list or assessment structures.");
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     HANDLE SCORE INPUT CHANGE
  ============================================================ */
  function handleScoreChange(enrollmentId, structureId, val, maxScore) {
    if (isLocked) return;

    const numVal = parseFloat(val);
    if (maxScore && numVal > maxScore) {
      alert(`Maximum score allowed for this component is ${maxScore}`);
      return;
    }

    setScores((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [structureId]: val,
      },
    }));
  }

  /* ============================================================
     CALCULATE TOTAL SCORE PER STUDENT
  ============================================================ */
  function getStudentTotal(enrollmentId) {
    const studentScores = scores[enrollmentId] || {};
    return Object.values(studentScores).reduce((acc, curr) => {
      const val = parseFloat(curr);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }

  /* ============================================================
     SAVE & COMPUTE SCORES (Teacher & Admin)
  ============================================================ */
  async function saveResults(lockAfterSave = false) {
    if (!selectedSubject || !selectedSession || !selectedTerm) {
      setError("Please select Subject, Academic Session, and Term before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    // Build payload matching ResultEntryController@save expectations
    const payload = {
      school_id: user?.school_id || 1,
      subject_id: parseInt(selectedSubject),
      academic_session_id: parseInt(selectedSession),
      term_id: parseInt(selectedTerm),
      students: students.map((enrollment) => {
        const studentScores = scores[enrollment.id] || {};
        const components = Object.keys(studentScores).map((structId) => ({
          assessment_structure_id: parseInt(structId),
          score: parseFloat(studentScores[structId]) || 0,
        }));

        return {
          student_enrollment_id: enrollment.id,
          components,
        };
      }),
    };

    try {
      await api.post("/result-entry/save", payload);

      if (lockAfterSave) {
        setIsLocked(true);
        setMessage("Scores calculated and saved successfully! Scores are now locked.");
      } else {
        setMessage("Scores saved successfully as draft.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.data?.message || err?.message || "Failed to save student scores.");
    } finally {
      setSaving(false);
    }
  }

/* ============================================================
     PRINCIPAL UNLOCK ACTION
  ============================================================ */
  function unlockForReentry() {
    if (!isPrincipalOrAdmin) return;
    setIsLocked(false);
    setMessage("Results unlocked for editing by Principal.");
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="mb-1" style={{ fontSize: "26px", fontWeight: "700", color: "#1e3a8a" }}>
            Student Result Entry
          </h1>
          <p className="text-muted mb-0">
            Enter component scores (CA, Tests, Assignments, Exams). The backend will auto-compute totals, grades, and remarks.
          </p>
        </div>

        {setPage && (
          <button className="btn btn-outline-secondary" onClick={() => setPage("results")}>
            &larr; Back to Examinations
          </button>
        )}
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* Filter Selection Card */}
      <div className="card shadow-sm border-0 p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label font-weight-bold">Class *</label>
            <select
              className="form-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label font-weight-bold">Subject *</label>
            <select
              className="form-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label font-weight-bold">Academic Session *</label>
            <select
              className="form-select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label font-weight-bold">Term *</label>
            <select
              className="form-select"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="">Select Term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 text-end">
          <button
            className="btn btn-primary"
            onClick={loadStudentSheet}
            disabled={loading || !selectedClass}
          >
            {loading ? "Loading Sheet..." : "Load Result Sheet"}
          </button>
        </div>
      </div>

      {/* Result Entry Sheet */}
      {students.length > 0 && (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="p-3 bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold">Status:</span>
              <span className={`badge ${isLocked ? "bg-danger" : "bg-success"}`}>
                {isLocked ? "Locked (Calculated)" : "Open for Score Entry"}
              </span>
            </div>

            <div className="d-flex gap-2">
              {/* Unlock button for Principal */}
              {isLocked && isPrincipalOrAdmin && (
                <button
                  className="btn btn-sm btn-outline-warning text-dark fw-bold"
                  onClick={unlockForReentry}
                >
                  Unlock for Re-entry
                </button>
              )}

              {/* Save Draft */}
              {!isLocked && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => saveResults(false)}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Draft"}
                </button>
              )}

              {/* Calculate and Lock */}
              {!isLocked && (
                <button
                  className="btn btn-sm btn-success fw-bold"
                  onClick={() => saveResults(true)}
                  disabled={saving}
                >
                  {saving ? "Processing..." : "Calculate & Lock Results"}
                </button>
              )}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Reg / Admission No</th>

                  {/* Dynamic Assessment Structure Headers */}
                  {structures.map((struct) => (
                    <th key={struct.id} style={{ minWidth: "110px" }}>
                      {struct.name} ({struct.max_score || 100})
                    </th>
                  ))}

                  <th className="text-center" style={{ minWidth: "100px", background: "#1e3a8a" }}>
                    Total Score
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map((enrollment, idx) => {
                  const student = enrollment.student || {};
                  const total = getStudentTotal(enrollment.id);

                  return (
                    <tr key={enrollment.id}>
                      <td>{idx + 1}</td>
                      <td className="fw-bold">
                        {student.first_name || ""} {student.last_name || enrollment.id}
                      </td>
                      <td className="text-muted">{student.admission_number || enrollment.student_id || "-"}</td>

                      {/* Dynamic Component Score Inputs */}
                      {structures.map((struct) => (
                        <td key={struct.id}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            min="0"
                            max={struct.max_score || 100}
                            disabled={isLocked}
                            value={scores[enrollment.id]?.[struct.id] ?? ""}
                            onChange={(e) =>
                              handleScoreChange(
                                enrollment.id,
                                struct.id,
                                e.target.value,
                                struct.max_score
                              )
                            }
                            placeholder="0"
                          />
                        </td>
                      ))}

                      {/* Live Calculated Total */}
                      <td className="text-center fw-bold text-primary fs-6 bg-light">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
