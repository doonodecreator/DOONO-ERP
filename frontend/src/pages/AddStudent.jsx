import { useState } from "react";
import api from "../services/api";

export default function AddStudent() {
  const [form, setForm] = useState({
    school_id: 1,
    division_id: 1,
    class_id: 2,
    stream_id: 2,
    academic_session_id: 1,
    admission_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "Male",
    date_of_birth: "",
    admission_date: "",
    religion: "",
    nationality: "Nigerian",
    state_of_origin: "",
    local_government: "",
    address: "",
    blood_group: "",
    genotype: "",
    medical_notes: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post(
        "/students",
        form
      );

      alert(
        "Student created successfully."
      );

      setForm({
        ...form,
        admission_number: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        date_of_birth: "",
        admission_date: "",
        religion: "",
        state_of_origin: "",
        local_government: "",
        address: "",
        blood_group: "",
        genotype: "",
        medical_notes: "",
      });
    } catch (error) {
      console.log(error);

      alert(
        "Unable to save student."
      );
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Add Student</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          display: "grid",
          gap: "15px",
        }}
      >
        <input
          name="admission_number"
          placeholder="Admission Number"
          value={form.admission_number}
          onChange={handleChange}
        />

        <input
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
        />

        <input
          name="middle_name"
          placeholder="Middle Name"
          value={form.middle_name}
          onChange={handleChange}
        />

        <input
          name="last_name"
          placeholder="Last Name"
          value={form.last_name}
          onChange={handleChange}
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option>Male</option>
          <option>Female</option>
        </select>

        <label>
          Date of Birth
        </label>

        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth}
          onChange={handleChange}
        />

        <label>
          Admission Date
        </label>

        <input
          type="date"
          name="admission_date"
          value={form.admission_date}
          onChange={handleChange}
        />

        <input
          name="religion"
          placeholder="Religion"
          value={form.religion}
          onChange={handleChange}
        />

        <input
          name="state_of_origin"
          placeholder="State of Origin"
          value={
            form.state_of_origin
          }
          onChange={handleChange}
        />

        <input
          name="local_government"
          placeholder="Local Government"
          value={
            form.local_government
          }
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "15px",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Saving..."
            : "Create Student"}
        </button>
      </form>
    </div>
  );
}
