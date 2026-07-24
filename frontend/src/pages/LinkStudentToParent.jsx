import { useEffect, useState } from "react";
import api from "../services/api";

export default function LinkStudentToParent({
parent,
setPage,
}) {
const [students,
setStudents] =
useState([]);

const [form,
setForm] =
useState({
student_id: "",
relationship: "Father",
is_primary: true,
});

useEffect(() => {
loadStudents();
}, []);

const loadStudents =
async () => {
try {
const response =
await api.get(
"/students"
);

    setStudents(
      response.data.data ||
        []
    );
  } catch (error) {
  console.log(error.response?.data);

  alert(
    JSON.stringify(
      error.response?.data,
      null,
      2
    )
  );
}
  };

const submit =
async (e) => {
e.preventDefault();

  try {
    await api.post(
      "/parent-students",
      {
        parent_id:
          parent.id,
        student_id:
          form.student_id,
        relationship:
          form.relationship,
        is_primary:
          form.is_primary,
      }
    );

    alert(
      "Student linked successfully."
    );

    setPage(
      "parent-profile"
    );
  } catch (error) {
    console.log(error);
    alert(
      "Failed to link student."
    );
  }
};

return (
<div>
<h1
style={{
marginBottom:
"30px",
}}
>
Link Student To Parent
</h1>

  <form
    onSubmit={submit}
    style={{
      background:
        "white",
      padding: "30px",
      borderRadius:
        "20px",
      boxShadow:
        "0 10px 30px rgba(0,0,0,0.08)",
    }}
  >
    <select
      value={
        form.student_id
      }
      onChange={(e) =>
        setForm({
          ...form,
          student_id:
            e.target
              .value,
        })
      }
      style={input}
      required
    >
      <option value="">
        Select Student
      </option>

      {students.map(
        (student) => (
          <option
            key={
              student.id
            }
            value={
              student.id
            }
          >
            {
              student.full_name
            }
          </option>
        )
      )}
    </select>

    <select
      value={
        form.relationship
      }
      onChange={(e) =>
        setForm({
          ...form,
          relationship:
            e.target
              .value,
        })
      }
      style={input}
    >
      <option>
        Father
      </option>

      <option>
        Mother
      </option>

      <option>
        Guardian
      </option>

      <option>
        Uncle
      </option>

      <option>
        Aunt
      </option>
    </select>

    <button
      style={{
        background:
          "#2563eb",
        color: "#fff",
        border: "none",
        padding:
          "15px 25px",
        borderRadius:
          "12px",
        cursor:
          "pointer",
      }}
    >
      Link Student
    </button>
  </form>
</div>

);
}

const input = {
width: "100%",
padding: "15px",
marginBottom:
"20px",
border:
"1px solid #cbd5e1",
borderRadius:
"10px",
};
