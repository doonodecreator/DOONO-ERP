import { useState } from "react";
import api from "../services/api";

export default function EditTeacher({
  teacher,
  setPage,
  setSelectedTeacher,
}) {
  const [form, setForm] =
    useState({
      staff_number:
        teacher?.staff_number || "",
      first_name:
        teacher?.first_name || "",
      middle_name:
        teacher?.middle_name || "",
      last_name:
        teacher?.last_name || "",
      gender:
        teacher?.gender || "",
      phone:
        teacher?.phone || "",
      email:
        teacher?.email || "",
      address:
        teacher?.address || "",
      designation:
        teacher?.designation || "",
      department:
        teacher?.department || "",
      employment_date:
        teacher?.employment_date || "",
      qualification:
        teacher?.qualification || "",
      basic_salary:
        teacher?.basic_salary || "",
      employment_status:
        teacher?.employment_status ||
        "Active",
    });

  const handleChange = (
    e
  ) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        const response =
          await api.put(
            `/staff/${teacher.id}`,
            form
          );

        setSelectedTeacher(
          response.data.data
        );

        alert(
          "Teacher updated successfully."
        );

        setPage(
          "teacher-profile"
        );
      } catch (error) {
        console.log(error);

        alert(
          "Unable to update teacher."
        );
      }
    };

  return (
    <div>
      <h1>
        Edit Teacher
      </h1>

      <form
        onSubmit={
          handleSubmit
        }
        style={{
          background:
            "#fff",
          padding: "30px",
          borderRadius:
            "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          marginTop:
            "20px",
        }}
      >
        <input
          name="staff_number"
          value={
            form.staff_number
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="first_name"
          value={
            form.first_name
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="middle_name"
          value={
            form.middle_name
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="last_name"
          value={
            form.last_name
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="phone"
          value={
            form.phone
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="email"
          value={
            form.email
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="address"
          value={
            form.address
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="designation"
          value={
            form.designation
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="department"
          value={
            form.department
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          name="qualification"
          value={
            form.qualification
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <input
          type="number"
          name="basic_salary"
          value={
            form.basic_salary
          }
          onChange={
            handleChange
          }
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            background:
              "#16a34a",
            color: "#fff",
            border: "none",
            padding:
              "12px 20px",
            borderRadius:
              "10px",
            cursor:
              "pointer",
          }}
        >
          Update Teacher
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  border:
    "1px solid #cbd5e1",
  borderRadius: "10px",
};
