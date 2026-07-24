import { useEffect, useState } from "react";
import api from "../services/api";

export default function Attendance() {
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);

  const [students, setStudents] = useState([]);

  const [filter, setFilter] = useState({
    academic_session_id: "",
    term_id: "",
    class_id: "",
    stream_id: "",
    attendance_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadSessions();
    loadTerms();
    loadClasses();
    loadStreams();
  }, []);

  const loadSessions = async () => {
    const res = await api.get("/academic-sessions");
    setSessions(res.data.data || []);
  };

  const loadTerms = async () => {
    const res = await api.get("/terms");
    setTerms(res.data.data || []);
  };

  const loadClasses = async () => {
    const res = await api.get("/classes");
    setClasses(res.data.data || []);
  };

  const loadStreams = async () => {
    const res = await api.get("/streams");
    setStreams(res.data.data || []);
  };

  const handleChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  const loadStudents = async () => {
    try {
      const res = await api.get("/attendance/class-list", {
        params: filter,
      });

      const rows = (res.data.data || []).map((item) => ({
        enrollment: item,
        status: "Present",
        remarks: "",
      }));

      setStudents(rows);
    } catch (err) {
      console.log(err);
      alert("Unable to load students.");
    }
  };

  const saveAttendance = async () => {
    try {
      for (const row of students) {
        await api.post("/attendances", {
          school_id: 1,
          student_enrollment_id: row.enrollment.id,
          academic_session_id: filter.academic_session_id,
          term_id: filter.term_id,
          attendance_date: filter.attendance_date,
          status: row.status,
          remarks: row.remarks,
        });
      }

      alert("Attendance saved successfully.");
    } catch (err) {
      console.log(err);

      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Attendance could not be saved.");
      }
    }
  };

  return (
    <div>

      <h1>Attendance</h1>

      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 20,
          marginBottom: 20,
        }}
      >

        <h3>Attendance Filter</h3>

        <select
          name="academic_session_id"
          value={filter.academic_session_id}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Academic Session</option>

          {sessions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          name="term_id"
          value={filter.term_id}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Term</option>

          {terms.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          name="class_id"
          value={filter.class_id}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Class</option>

          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          name="stream_id"
          value={filter.stream_id}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">All Streams</option>

          {streams.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="attendance_date"
          value={filter.attendance_date}
          onChange={handleChange}
          style={inputStyle}
        />

        <button
          onClick={loadStudents}
          style={buttonStyle}
        >
          Load Students
        </button>

      </div>

      {students.length > 0 && (

        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 20,
          }}
        >

          <table width="100%">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>

              {students.map((row, index) => (

                <tr key={row.enrollment.id}>

                  <td>
                    {row.enrollment.student?.surname}{" "}
                    {row.enrollment.student?.firstname}
                  </td>

                  <td>

                    <select
                      value={row.status}
                      onChange={(e) => {
                        const copy = [...students];
                        copy[index].status = e.target.value;
                        setStudents(copy);
                      }}
                    >
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Late</option>
                      <option>Excused</option>
                    </select>

                  </td>

                  <td>

                    <input
                      value={row.remarks}
                      onChange={(e) => {
                        const copy = [...students];
                        copy[index].remarks = e.target.value;
                        setStudents(copy);
                      }}
                    />

                  </td>

                </tr>

              ))}

            </tbody>
          </table>

          <br />

          <button
            onClick={saveAttendance}
            style={buttonStyle}
          >
            Save Attendance
          </button>

        </div>

      )}

    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
};

const buttonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "10px",
  cursor: "pointer",
};
