import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRoleSlug } from '../utils/role';

export default function StudentProfile({
  student,
  setPage,
}) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const roleSlug = getPrimaryRoleSlug({
    roles,
    isPlatformAdmin,
    isOrganizationOwner,
    school,
  });
  const canManageAdmissions = [
    'super_admin',
    'proprietor',
    'principal',
    'vice_principal_admin',
  ].includes(roleSlug);
  if (!student) {
    return (
      <div>
        <h1>No student selected.</h1>

        <button
          onClick={() =>
            setPage("students")
          }
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() =>
          setPage("students")
        }
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          border: "none",
          background: "#2563eb",
          color: "#fff",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginBottom: "20px",
          }}
        >
          {student.full_name}
        </h1>

        {canManageAdmissions && (
          <div
            style={{
              marginBottom: "30px",
            }}
          >
            <button
              onClick={() =>
                setPage("edit-student")
              }
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                marginRight: "15px",
              }}
            >
              Edit Student
            </button>

            <button
              onClick={async () => {
                if (!window.confirm("Are you sure you want to delete this student?")) {
                  return;
                }

                try {
                  await api.delete(`/students/${student.id}`);
                  alert("Student deleted successfully.");
                  setPage("students");
                } catch (error) {
                  alert(error.message || "Unable to delete student.");
                }
              }}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Delete Student
            </button>
          </div>
        )}

        <p>
          <strong>
            Admission Number:
          </strong>{" "}
          {student.admission_number}
        </p>

        <p>
          <strong>Gender:</strong>{" "}
          {student.gender}
        </p>

        <p>
          <strong>
            Date of Birth:
          </strong>{" "}
          {student.date_of_birth}
        </p>

        <p>
          <strong>Class:</strong>{" "}
          {student.class?.name}{" "}
          {student.stream?.name}
        </p>

        <p>
          <strong>Religion:</strong>{" "}
          {student.religion}
        </p>

        <p>
          <strong>
            Nationality:
          </strong>{" "}
          {student.nationality}
        </p>

        <p>
          <strong>
            State of Origin:
          </strong>{" "}
          {student.state_of_origin}
        </p>

        <p>
          <strong>
            Local Government:
          </strong>{" "}
          {student.local_government}
        </p>

        <p>
          <strong>Address:</strong>{" "}
          {student.address}
        </p>

        <p>
          <strong>
            Blood Group:
          </strong>{" "}
          {student.blood_group}
        </p>

        <p>
          <strong>Genotype:</strong>{" "}
          {student.genotype}
        </p>

        <p>
          <strong>
            Medical Notes:
          </strong>{" "}
          {student.medical_notes}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {student.status}
        </p>
      </div>
    </div>
  );
}
