import { useEffect, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";

export default function AddSubject({ setPage }) {
  const [divisions, setDivisions] = useState([]);

  const [form, setForm] = useState({
    division_id: "",
    name: "",
    code: "",
    category: "General",
    pass_mark: 40,
    maximum_mark: 100,
    is_active: true,
    description: "",
  });

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      const res = await api.get("/divisions");

      setDivisions(arrayFromResponse(res));
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm({
      ...form,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post(
        "/subjects",
        form
      );

      alert(
        "Subject added successfully."
      );

      setPage("subjects");
    } catch (err) {
      console.log(err);

      alert(
        err.response?.data?.message ||
          "Unable to save subject."
      );
    }
  };

  return (
    <div>
      <h1>Add Subject</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          marginTop: "20px",
        }}
      >
        <select
          name="division_id"
          value={form.division_id}
          onChange={handleChange}
          style={inputStyle}
          required
        >
          <option value="">
            Select Division
          </option>

          {divisions.map(
            (division) => (
              <option
                key={division.id}
                value={division.id}
              >
                {division.name}
              </option>
            )
          )}
        </select>

        <input
          name="name"
          placeholder="Subject Name"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <input
          name="code"
          placeholder="Subject Code"
          value={form.code}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="General">
            General
          </option>

          <option value="Science">
            Science
          </option>

          <option value="Arts">
            Arts
          </option>

          <option value="Commercial">
            Commercial
          </option>
        </select>

        <input
          type="number"
          name="pass_mark"
          value={form.pass_mark}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="number"
          name="maximum_mark"
          value={form.maximum_mark}
          onChange={handleChange}
          style={inputStyle}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          style={{
            ...inputStyle,
            height: "120px",
          }}
        />

        <label>
          <input
            type="checkbox"
            name="is_active"
            checked={
              form.is_active
            }
            onChange={handleChange}
          />

          Active Subject
        </label>

        <br />
        <br />

        <button
          type="submit"
          style={{
            background:
              "#2563eb",
            color: "#fff",
            border: "none",
            padding:
              "12px 20px",
            borderRadius:
              "10px",
          }}
        >
          Save Subject
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
