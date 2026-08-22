import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import { arrayFromResponse } from "../utils/response";

export default function Teachers({
  setPage,
  setSelectedTeacher,
}) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canCreateStaff = isPlatformAdmin || role === "proprietor";
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await api.get("/staff");
      setTeachers(arrayFromResponse(response));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const text = `${teacher.full_name || ""} ${teacher.department || ""} ${teacher.designation || ""} ${teacher.staff_number || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          color: "#1e293b",
          marginBottom: "10px",
        }}
      >
        Teachers & Staff
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "30px",
        }}
      >
        Manage staff members, roles, and designations.
      </p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            minWidth: "250px",
          }}
        >
          <h3>Total Staff</h3>

          <h1
            style={{
              color: "#2563eb",
            }}
          >
            {teachers.length}
          </h1>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "12px",
              width: "300px",
              border: "1px solid #cbd5e1",
              borderRadius: "12px",
            }}
          />

          {canCreateStaff && (
            <button type="button"
              onClick={() => setPage("add-teacher")}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              + Add Staff
            </button>
          )}
        </div>

        {loading ? (
          <p>Loading staff...</p>
        ) : filteredTeachers.length === 0 ? (
          <p>No staff members found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>Staff No.</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Phone</th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  onClick={() => {
                    setSelectedTeacher(teacher);
                    setPage("teacher-profile");
                  }}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <td style={tdStyle}>{teacher.staff_number || "-"}</td>
                  <td style={tdStyle}>{teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}</td>
                  <td style={tdStyle}>{teacher.department || "-"}</td>
                  <td style={tdStyle}>{teacher.designation || "-"}</td>
                  <td style={tdStyle}>{teacher.phone || "-"}</td>
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

