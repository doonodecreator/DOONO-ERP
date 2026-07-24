import { useState } from "react";
import api from "../services/api";

export default function EditStudent({
  student,
  setPage,
  setSelectedStudent,
}) {
  const [form, setForm] =
    useState({
      ...student,
    });

  const [loading,
    setLoading] =
    useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response =
        await api.put(
          `/students/${student.id}`,
          form
        );

      alert(
        "Student updated successfully."
      );

      setSelectedStudent(
        response.data.data
      );

      setPage(
        "student-profile"
      );
    } catch (error) {
      console.log(error);

      alert(
        "Unable to update student."
      );
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Edit Student</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          display: "grid",
          gap: "15px",
        }}
      >
        <input
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
        />

        <input
          name="middle_name"
          value={
            form.middle_name || ""
          }
          onChange={handleChange}
        />

        <input
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option>
            Male
          </option>
          <option>
            Female
          </option>
        </select>

        <input
          type="date"
          name="date_of_birth"
          value={
            form.date_of_birth
          }
          onChange={handleChange}
        />

        <textarea
          name="address"
          value={
            form.address || ""
          }
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background:
              "#2563eb",
            color: "#fff",
            border: "none",
            padding: "15px",
            borderRadius:
              "12px",
          }}
        >
          {loading
            ? "Updating..."
            : "Update Student"}
        </button>
      </form>
    </div>
  );
}
