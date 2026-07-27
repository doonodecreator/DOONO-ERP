import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Results({
  setPage,
}) {
  const [loading, setLoading] =
    useState(true);

  const [examinations, setExaminations] =
    useState([]);

  const [schools, setSchools] =
    useState([]);

  const [sessions, setSessions] =
    useState([]);

  const [terms, setTerms] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [selectedExam, setSelectedExam] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

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

  async function loadData() {
    setLoading(true);

    try {
      const [
        examRes,
        schoolRes,
        sessionRes,
        termRes,
      ] = await Promise.all([
        fetch(`${API}/examinations`),
        fetch(`${API}/schools`),
        fetch(`${API}/academic-sessions`),
        fetch(`${API}/terms`),
      ]);

      const exams =
        await examRes.json();

      const schoolData =
        await schoolRes.json();

      const sessionData =
        await sessionRes.json();

      const termData =
        await termRes.json();

      setExaminations(
        exams.data || []
      );

      setSchools(
        schoolData.data || []
      );

      setSessions(
        sessionData.data || []
      );

      setTerms(
        termData.data || []
      );
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load examinations."
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
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
  async function saveExam(e) {
    e.preventDefault();

    try {
      let url = `${API}/examinations`;
      let method = "POST";

      if (editingId) {
        url = `${API}/examinations/${editingId}`;
        method = "PUT";
      }

      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      resetForm();
      setShowForm(false);
      loadData();

    } catch (error) {
      console.error(error);
      alert("Unable to save examination.");
    }
  }

  async function deleteExam(id) {
    if (
      !window.confirm(
        "Delete this examination?"
      )
    ) {
      return;
    }

    await fetch(
      `${API}/examinations/${id}`,
      {
        method: "DELETE",
      }
    );

    loadData();
  }

  function editExam(exam) {
    setEditingId(exam.id);

    setShowForm(true);

    setForm({
      school_id: exam.school_id,
      academic_session_id:
        exam.academic_session_id,
      term_id: exam.term_id,
      name: exam.name,
      exam_type: exam.exam_type,
      total_marks: exam.total_marks,
      start_date: exam.start_date,
      end_date: exam.end_date,
      status: exam.status,
    });
  }

  const filtered =
    examinations.filter((exam) =>
      exam.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: "700",
            }}
          >
            Results & Examinations
          </h1>

          <p
            style={{
              marginTop: "6px",
              color: "#6b7280",
            }}
          >
            Create examinations, enter results and generate report cards.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          + New Examination
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "16px",
          marginBottom: "25px",
        }}
      >
        <div className="card">
          <h3>Total Exams</h3>
          <h2>{examinations.length}</h2>
        </div>

        <div className="card">
          <h3>Scheduled</h3>
          <h2>
            {
              examinations.filter(
                (e) => e.status === "Scheduled"
              ).length
            }
          </h2>
        </div>

        <div className="card">
          <h3>Ongoing</h3>
          <h2>
            {
              examinations.filter(
                (e) => e.status === "Ongoing"
              ).length
            }
          </h2>
        </div>

        <div className="card">
          <h3>Completed</h3>
          <h2>
            {
              examinations.filter(
                (e) => e.status === "Completed"
              ).length
            }
          </h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "25px",
        }}
      >
        <input
          type="text"
          placeholder="Search examination..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            flex: 1,
            padding: "12px",
            border:
              "1px solid #d1d5db",
            borderRadius: "8px",
          }}
        />

        <button
          onClick={loadData}
          style={{
            background: "#0f766e",
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={saveExam}
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "30px",
            boxShadow:
              "0 2px 6px rgba(0,0,0,.08)",
          }}
        >
          <h2>
            {editingId
              ? "Edit Examination"
              : "Create Examination"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(240px,1fr))",
              gap: "15px",
            }}
          >
            <select
              name="school_id"
              value={form.school_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select School
              </option>

              {schools.map((school) => (
                <option
                  key={school.id}
                  value={school.id}
                >
                  {school.name}
                </option>
              ))}
            </select>

            <select
              name="academic_session_id"
              value={form.academic_session_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Academic Session
              </option>

              {sessions.map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  {session.name}
                </option>
              ))}
            </select>

            <select
              name="term_id"
              value={form.term_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Term
              </option>

              {terms.map((term) => (
                <option
                  key={term.id}
                  value={term.id}
                >
                  {term.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="name"
              placeholder="Examination Name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <select
              name="exam_type"
              value={form.exam_type}
              onChange={handleChange}
            >
              <option value="CA1">CA1</option>
              <option value="CA2">CA2</option>
              <option value="Mid-Term">
                Mid-Term
              </option>
              <option value="Examination">
                Examination
              </option>
              <option value="Mock">
                Mock
              </option>
              <option value="Promotion">
                Promotion
              </option>
              <option value="Other">
                Other
              </option>
            </select>

            <input
              type="number"
              name="total_marks"
              value={form.total_marks}
              onChange={handleChange}
              min="1"
              required
            />

            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
            />

            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              required
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="Draft">
                Draft
              </option>
              <option value="Scheduled">
                Scheduled
              </option>
              <option value="Ongoing">
                Ongoing
              </option>
              <option value="Completed">
                Completed
              </option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button type="submit">
              {editingId
                ? "Update Examination"
                : "Save Examination"}
            </button>

            <button
              type="button"
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
      {loading ? (
        <div
          style={{
            background: "#fff",
            padding: "40px",
            borderRadius: "10px",
            textAlign: "center",
            boxShadow:
              "0 2px 6px rgba(0,0,0,.08)",
          }}
        >
          Loading examinations...
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            overflowX: "auto",
            boxShadow:
              "0 2px 6px rgba(0,0,0,.08)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#2563eb",
                  color: "#fff",
                }}
              >
                <th style={{ padding: "12px" }}>
                  Examination
                </th>

                <th style={{ padding: "12px" }}>
                  Type
                </th>

                <th style={{ padding: "12px" }}>
                  Session
                </th>

                <th style={{ padding: "12px" }}>
                  Term
                </th>

                <th style={{ padding: "12px" }}>
                  Marks
                </th>

                <th style={{ padding: "12px" }}>
                  Status
                </th>

                <th style={{ padding: "12px" }}>
                  Start
                </th>

                <th style={{ padding: "12px" }}>
                  End
                </th>

                <th style={{ padding: "12px" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                    }}
                  >
                    No examinations found.
                  </td>
                </tr>
              ) : (
                filtered.map((exam) => (
                  <tr
                    key={exam.id}
                    style={{
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <td style={{ padding: "12px" }}>
                      {exam.name}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {exam.exam_type}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {exam.academic_session?.name || "-"}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {exam.term?.name || "-"}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {exam.total_marks}
                    </td>

                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: "20px",
                          background:
                            exam.status === "Completed"
                              ? "#16a34a"
                              : exam.status === "Ongoing"
                              ? "#ea580c"
                              : exam.status === "Scheduled"
                              ? "#2563eb"
                              : "#6b7280",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {exam.status}
                      </span>
                    </td>

                    <td style={{ padding: "12px" }}>
                      {exam.start_date}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {exam.end_date}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => editExam(exam)}
                        style={{
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteExam(exam.id)}
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>

                      <button
  onClick={() => setPage("result-entry")}
  style={{
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  Enter Results
</button>

<button
  onClick={() => setPage("report-cards")}
  style={{
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  Report Cards
</button>
 
                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>

      )}
        </div>
  );
}
