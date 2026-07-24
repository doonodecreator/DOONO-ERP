import { useState, useEffect } from "react";
import api from "../services/api";

export default function AddTeacher({ setPage }) {
  const [schools, setSchools] = useState([]);

  const [form, setForm] = useState({
    school_id: "",
    staff_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    designation: "",
    department: "",
    employment_date: "",
    qualification: "",
    basic_salary: "",
    employment_status: "Active",
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await api.get("/schools");

      setSchools(
        res.data.data || res.data
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/staff", form);

      alert(
        "Teacher added successfully."
      );

      setPage("teachers");
    } catch (error) {
      console.log(error);

      alert(
        error?.response?.data?.message ||
          "Unable to save teacher."
      );
    }
  };

  return (
    <div>
      <h1>Add Teacher</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
          marginTop: "20px",
        }}
      >
        <select
          name="school_id"
          value={form.school_id}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">
            Select School
          </option>

          {schools.map((school) => (
            <option
              key={school.id}
              value={school.id}
            >
              {school.name}
            </option>
          ))}
        </select>

        <input
          name="staff_number"
          placeholder="Staff Number"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="first_name"
          placeholder="First Name"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="middle_name"
          placeholder="Middle Name"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="last_name"
          placeholder="Last Name"
          onChange={handleChange}
          style={inputStyle}
        />

        <select
          name="gender"
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">
            Gender
          </option>

          <option value="Male">
            Male
          </option>

          <option value="Female">
            Female
          </option>
        </select>

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="address"
          placeholder="Address"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="designation"
          placeholder="Designation"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="department"
          placeholder="Department"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="date"
          name="employment_date"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="qualification"
          placeholder="Qualification"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="number"
          name="basic_salary"
          placeholder="Salary"
          onChange={handleChange}
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Save Teacher
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
};
