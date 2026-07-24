import { useEffect, useState } from "react";
import api from "../services/api";

export default function Teachers({
  setPage,
  setSelectedTeacher,
}) {
  const [teachers,
    setTeachers] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers =
    async () => {
      try {
        const response =
          await api.get(
            "/staff"
          );

        setTeachers(
          response.data.data ||
          []
        );
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div>
      <h1>
        Teachers
      </h1>

      <button
        onClick={() =>
          setPage(
            "add-teacher"
          )
        }
        style={{
          background:
            "#2563eb",
          color: "#fff",
          border: "none",
          padding:
            "12px 20px",
          borderRadius:
            "10px",
          cursor:
            "pointer",
          marginBottom:
            "20px",
        }}
      >
        + Add Teacher
      </button>

      {loading ? (
        <p>
          Loading...
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            background:
              "white",
          }}
        >
          <thead>
            <tr>
              <th
                style={
                  thStyle
                }
              >
                Name
              </th>

              <th
                style={
                  thStyle
                }
              >
                Department
              </th>

              <th
                style={
                  thStyle
                }
              >
                Designation
              </th>

              <th
                style={
                  thStyle
                }
              >
                Phone
              </th>
            </tr>
          </thead>

          <tbody>
            {teachers.map(
              (
                teacher
              ) => (
                <tr
                  key={
                    teacher.id
                  }
                  onClick={() => {
                    setSelectedTeacher(
                      teacher
                    );

                    setPage(
                      "teacher-profile"
                    );
                  }}
                  style={{
                    cursor:
                      "pointer",
                  }}
                >
                  <td
                    style={
                      tdStyle
                    }
                  >
                    {
                      teacher.first_name
                    }{" "}
                    {
                      teacher.last_name
                    }
                  </td>

                  <td
                    style={
                      tdStyle
                    }
                  >
                    {
                      teacher.department
                    }
                  </td>

                  <td
                    style={
                      tdStyle
                    }
                  >
                    {
                      teacher.designation
                    }
                  </td>

                  <td
                    style={
                      tdStyle
                    }
                  >
                    {
                      teacher.phone
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = {
  padding: "15px",
  textAlign: "left",
  borderBottom:
    "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "15px",
  borderBottom:
    "1px solid #e2e8f0",
};
