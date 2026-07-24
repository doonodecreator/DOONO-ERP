import { useEffect, useState } from "react";
import api from "../services/api";

export default function ResultEntry() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [structures, setStructures] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const [scores, setScores] = useState({});

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const res = await api.get("/classes");
      setClasses(res.data.data || res.data || []);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadStudents(classId) {
    try {
      const res = await api.get(
        `/result-entry/students?class_id=${classId}`
      );

      setStudents(res.data.students || []);
      setSubjects(res.data.subjects || []);
      setSessions(res.data.sessions || []);
      setTerms(res.data.terms || []);
      setStructures(res.data.structures || []);
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Unable to load result entry data."
      );
    }
  }

  function changeClass(id) {
    setSelectedClass(id);
    loadStudents(id);
  }

  function updateScore(studentId, structureId, value) {
    setScores((old) => ({
      ...old,
      [studentId]: {
        ...(old[studentId] || {}),
        [structureId]: value,
      },
    }));
  }

  function total(studentId) {
    let totalScore = 0;

    structures.forEach((structure) => {
      totalScore += Number(
        scores?.[studentId]?.[structure.id] || 0
      );
    });

    return totalScore;
  }

  async function saveResults() {
    if (
      !selectedSubject ||
      !selectedSession ||
      !selectedTerm
    ) {
      alert(
        "Please select Subject, Session and Term."
      );
      return;
    }

    try {
      await api.post("/result-entry/save", {
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
      });

      alert("Results saved successfully.");
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
        "Unable to save results."
      );
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Result Entry</h2>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <select
          value={selectedClass}
          onChange={(e) =>
            changeClass(e.target.value)
          }
        >
          <option value="">
            Select Class
          </option>

          {classes.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) =>
            setSelectedSubject(e.target.value)
          }
        >
          <option value="">
            Select Subject
          </option>

          {subjects.map((s) => (
            <option
              key={s.id}
              value={s.id}
            >
              {s.name}
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
            Select Session
          </option>

          {sessions.map((s) => (
            <option
              key={s.id}
              value={s.id}
            >
              {s.name}
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

          {terms.map((t) => (
            <option
              key={t.id}
              value={t.id}
            >
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <table
        border="1"
        cellPadding="6"
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
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
                {student.student.first_name}{" "}
                {student.student.last_name}
              </td>

              {structures.map((structure) => (
                <td key={structure.id}>
                  <input
                    type="number"
                    min="0"
                    max={
                      structure.maximum_marks
                    }
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

              <td>{total(student.id)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <button onClick={saveResults}>
        Save Results
      </button>
    </div>
  );
}
