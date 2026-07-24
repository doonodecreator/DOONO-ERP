import { useEffect, useState } from "react";
import api from "../services/api";

export default function Students({
  setPage,
  setSelectedStudent,
}) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          color: "#1e293b",
          marginBottom: "10px",
        }}
      >
        Students
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "30px",
        }}
      >
        Manage all students in your school.
      </p>

      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "30px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2>Student List</h2>

          <button
            onClick={() => setPage("add-student")}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            + Add Student
          </button>
        </div>

        {loading ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                }}
              >
                <th style={thStyle}>Admission No.</th>
                <th style={thStyle}>Full Name</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Class</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr
  key={student.id}
  onClick={() => {
    setSelectedStudent(student);
    setPage(
      "student-profile"
    );
  }}
  style={{
    cursor: "pointer",
  }}
>
                  <td style={tdStyle}>
                    {student.admission_number}
                  </td>

                  <td style={tdStyle}>
                    {student.full_name}
                  </td>

                  <td style={tdStyle}>
                    {student.gender}
                  </td>

                  <td style={tdStyle}>
                    {student.class?.name}{" "}
                    {student.stream?.name}
                  </td>

                  <td style={tdStyle}>
                    {student.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "15px",
  textAlign: "left",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "15px",
  borderBottom: "1px solid #e2e8f0",
};
