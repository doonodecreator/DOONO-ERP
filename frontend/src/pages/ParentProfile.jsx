import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function ParentProfile({
  parent,
  setPage,
}) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const roleSlug = getPrimaryRoleSlug({
    roles,
    isPlatformAdmin,
    isOrganizationOwner,
    school,
  });
  const canManageLinks = [
    "super_admin",
    "proprietor",
    "principal",
    "vice_principal_admin",
  ].includes(roleSlug);
  if (!parent) {
    return (
      <div>
        <h2>No parent selected.</h2>
      </div>
    );
  }

  const deleteParent = async () => {
    const confirmDelete = window.confirm(
      "Delete this parent?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(
        `/parents/${parent.id}`
      );

      alert("Parent deleted.");

      setPage("parents");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <button type="button"
        onClick={() =>
          setPage("parents")
        }
        style={buttonStyle}
      >
        ← Back
      </button>

      <button type="button"
        onClick={() =>
          setPage("edit-parent")
        }
        style={{
          ...buttonStyle,
          background: "#16a34a",
          marginLeft: "10px",
        }}
      >
        Edit Parent
      </button>

      {canManageLinks && (
        <button type="button"
          onClick={() =>
            setPage(
              "link-student-parent"
            )
          }
          style={{
            ...buttonStyle,
            background: "#2563eb",
            marginLeft: "10px",
          }}
        >
          Link Student
        </button>
      )}

      <button type="button"
        onClick={deleteParent}
        style={{
          ...buttonStyle,
          background: "#dc2626",
          marginLeft: "10px",
        }}
      >
        Delete
      </button>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          marginTop: "20px",
        }}
      >
        <h1>
          {parent.father_name}
        </h1>

        <hr />

        <h3>
          Father's Details
        </h3>

        <p>
          Phone:{" "}
          {parent.father_phone}
        </p>

        <p>
          Email:{" "}
          {parent.father_email}
        </p>

        <p>
          Occupation:{" "}
          {
            parent.father_occupation
          }
        </p>

        <hr />

        <h3>
          Mother's Details
        </h3>

        <p>
          Name:{" "}
          {parent.mother_name}
        </p>

        <p>
          Phone:{" "}
          {parent.mother_phone}
        </p>

        <p>
          Email:{" "}
          {parent.mother_email}
        </p>

        <p>
          Occupation:{" "}
          {
            parent.mother_occupation
          }
        </p>

        <hr />

        <h3>Guardian</h3>

        <p>
          Name:{" "}
          {parent.guardian_name}
        </p>

        <p>
          Phone:{" "}
          {parent.guardian_phone}
        </p>

        <p>
          Email:{" "}
          {parent.guardian_email}
        </p>

        <p>
          Occupation:{" "}
          {
            parent.guardian_occupation
          }
        </p>

        <p>
          Relationship:{" "}
          {
            parent.guardian_relationship
          }
        </p>

        <hr />

        <h3>Address</h3>

        <p>
          {parent.address}
        </p>

        <hr />

        <h3>
          Parent's Children
        </h3>

        {Array.isArray(parent.students) &&
        parent.students.length >
          0 ? (
          <div>
            {parent.students.map(
              (student) => (
                <div
                  key={student.id}
                  style={{
                    padding:
                      "15px",
                    marginTop:
                      "10px",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "10px",
                  }}
                >
                  <strong>
                    {student.first_name}{" "}
                    {
                      student.last_name
                    }
                  </strong>

                  <p>
                    Admission
                    No:{" "}
                    {
                      student.admission_number
                    }
                  </p>

                  <p>
                    Class:{" "}
                    {student.class
                      ?.name ||
                      "Not Assigned"}
                  </p>

                  <p>
                    Relationship:{" "}
                    {student.relationship_type || "Not recorded"}
                    {student.is_primary_contact ? " (Primary Contact)" : ""}
                  </p>
                </div>
              )
            )}
          </div>
        ) : (
          <p>
            No students
            linked to this
            parent.
          </p>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "10px",
  cursor: "pointer",
};
