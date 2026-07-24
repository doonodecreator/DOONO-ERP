import { useEffect, useState } from "react";
import api from "../services/api";

export default function ResultEntry() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [structures, setStructures] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const [scores, setScores] = useState({});

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      const [
        studentRes,
        subjectRes,
        sessionRes,
        termRes,
        structureRes,
      ] = await Promise.all([
        api.get("/students"),
        api.get("/subjects"),
        api.get("/academic-sessions"),
        api.get("/terms"),
        api.get("/assessment-structures"),
      ]);

      setStudents(studentRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
      setSessions(sessionRes.data.data || []);
      setTerms(termRes.data.data || []);
      setStructures(structureRes.data.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  function updateScore(studentId, structureId, value) {
    setScores((previous) => ({
      ...previous,
      [studentId]: {
        ...(previous[studentId] || {}),
        [structureId]: value,
      },
    }));
  }

  function total(studentId) {
    const row = scores[studentId] || {};

    let total = 0;

    structures.forEach((structure) => {
      total += Number(row[structure.id] || 0);
    });

    return total;
  }
  async function saveResults() {
    try {
      const payload = {
        school_id: 1,
        subject_id: selectedSubject,
        academic_session_id: selectedSession,
        term_id: selectedTerm,
        students: students.map((student) => ({
          student_enrollment_id: student.id,
          components: structures.map((structure) => ({
            assessment_structure_id: structure.id,
            score: Number(
              scores?.[student.id]?.[structure.id] || 0
            ),
          })),
        })),
      };

      await api.post("/result-entry/save", payload);

      alert("Results saved successfully.");
    } catch (err) {
      console.log(err);
      alert("Unable to save results.");
    }
  }

  return (
    <div>

      <h1>Enter Student Results</h1>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >

        <select
          value={selectedSubject}
          onChange={(e) =>
            setSelectedSubject(e.target.value)
          }
        >
          <option value="">
            Select Subject
          </option>

          {subjects.map((subject) => (
            <option
              key={subject.id}
              value={subject.id}
            >
              {subject.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSession}
          onChange={(e) =>
            setSelectedSession(e.target.value)
          }
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
          value={selectedTerm}
          onChange={(e) =>
            setSelectedTerm(e.target.value)
          }
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

      </div>

            <div
        style={{
          overflowX: "auto",
          background: "#fff",
          borderRadius: "15px",
          padding: "20px",
        }}
      >
        <table width="100%">
          <thead>
            <tr>
              <th>Student</th>

              {structures.map((structure) => (
                <th key={structure.id}>
                  {structure.name}
                </th>
              ))}

              <th>Total</th>
            </tr>
          </thead>

          <tbody>

            {students.map((student) => (

              <tr key={student.id}>

                <td>
                  {student.first_name}{" "}
                  {student.last_name}
                </td>

                {structures.map((structure) => (

                  <td key={structure.id}>

                    <input
                      type="number"
                      min="0"
                      max={structure.maximum_marks}
                      value={
                        scores?.[student.id]?.[
                          structure.id
                        ] || ""
                      }
                      onChange={(e) =>
                        updateScore(
                          student.id,
                          structure.id,
                          e.target.value
                        )
                      }
                      style={{
                        width: "70px",
                      }}
                    />

                  </td>

                ))}

                <td>
                  <strong>
                    {total(student.id)}
                  </strong>
                </td>

              </tr>

            ))}

          </tbody>
        </table>

        <div
          style={{
            marginTop: "25px",
          }}
        >
          <button
            onClick={saveResults}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "14px 25px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Save Results
          </button>
        </div>

      </div>

    </div>
  );
}

