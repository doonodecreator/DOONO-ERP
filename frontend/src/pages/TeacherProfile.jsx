import api from "../services/api";

export default function TeacherProfile({
  teacher,
  setPage,
}) {
  if (!teacher) {
    return (
      <div>
        <h2>No teacher selected.</h2>
      </div>
    );
  }

  const deleteTeacher =
    async () => {
      const confirmDelete =
        window.confirm(
          "Delete this teacher?"
        );

      if (!confirmDelete)
        return;

      try {
        await api.delete(
          `/staff/${teacher.id}`
        );

        alert(
          "Teacher deleted."
        );

        setPage(
          "teachers"
        );
      } catch (error) {
        console.log(error);
      }
    };

  return (
    <div>
      <button type="button"
        onClick={() =>
          setPage("teachers")
        }
        style={buttonStyle}
      >
        ← Back
      </button>

      <button type="button"
        onClick={() =>
          setPage(
            "edit-teacher"
          )
        }
        style={{
          ...buttonStyle,
          background:
            "#16a34a",
          marginLeft:
            "10px",
        }}
      >
        Edit Teacher
      </button>

      <button type="button"
        onClick={
          deleteTeacher
        }
        style={{
          ...buttonStyle,
          background:
            "#dc2626",
          marginLeft:
            "10px",
        }}
      >
        Delete
      </button>

      <div
        style={{
          background:
            "white",
          padding: "30px",
          borderRadius:
            "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          marginTop:
            "20px",
        }}
      >
        <h1>
          {teacher.first_name}
          {" "}
          {teacher.middle_name}
          {" "}
          {teacher.last_name}
        </h1>

        <hr />

        <p>
          <strong>
            Staff Number:
          </strong>
          {" "}
          {
            teacher.staff_number
          }
        </p>

        <p>
          <strong>
            Department:
          </strong>
          {" "}
          {
            teacher.department
          }
        </p>

        <p>
          <strong>
            Designation:
          </strong>
          {" "}
          {
            teacher.designation
          }
        </p>

        <p>
          <strong>
            Phone:
          </strong>
          {" "}
          {teacher.phone}
        </p>

        <p>
          <strong>
            Email:
          </strong>
          {" "}
          {teacher.email}
        </p>

        <p>
          <strong>
            Gender:
          </strong>
          {" "}
          {teacher.gender}
        </p>

        <p>
          <strong>
            Qualification:
          </strong>
          {" "}
          {
            teacher.qualification
          }
        </p>

        <p>
          <strong>
            Address:
          </strong>
          {" "}
          {teacher.address}
        </p>

        <p>
          <strong>
            Employment Date:
          </strong>
          {" "}
          {
            teacher.employment_date
          }
        </p>

        <p>
          <strong>
            Status:
          </strong>
          {" "}
          {
            teacher.employment_status
          }
        </p>

        <p>
          <strong>
            Salary:
          </strong>
          {" "}
          ₦
          {
            teacher.basic_salary
          }
        </p>
      </div>
    </div>
  );
}

const buttonStyle = {
  background:
    "#2563eb",
  color: "#fff",
  border: "none",
  padding:
    "12px 20px",
  borderRadius:
    "10px",
  cursor: "pointer",
};
