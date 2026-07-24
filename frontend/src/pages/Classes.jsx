import { useEffect, useState } from "react";
import api from "../services/api";

export default function Classes() {
const [classes, setClasses] = useState([]);
const [divisions, setDivisions] = useState([]);

const [form, setForm] = useState({
division_id: "",
name: "",
code: "",
display_order: 1,
is_active: true,
});

useEffect(() => {
loadClasses();
loadDivisions();
}, []);

const loadClasses = async () => {
try {
const res = await api.get("/classes");
setClasses(res.data.data || []);
} catch (err) {
console.log(err);
}
};

const loadDivisions = async () => {
try {
const res = await api.get("/divisions");
setDivisions(res.data.data || []);
} catch (err) {
console.log(err);
}
};

const handleChange = (e) => {
const {
name,
value,
checked,
type,
} = e.target;

setForm({
  ...form,
  [name]:
    type === "checkbox"
      ? checked
      : value,
});

};

const saveClass = async (e) => {
e.preventDefault();

try {
  await api.post("/classes", form);

  alert("Class added successfully.");

  setForm({
    division_id: "",
    name: "",
    code: "",
    display_order: 1,
    is_active: true,
  });

  loadClasses();
} catch (err) {
  console.log(err);

  if (err.response?.data?.message) {
    alert(err.response.data.message);
  } else if (err.response?.data?.errors) {
    alert(
      JSON.stringify(
        err.response.data.errors,
        null,
        2
      )
    );
  } else {
    alert("Unable to save class.");
  }
}

};

return (
<div>
<h1>Classes & Streams</h1>

  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "20px",
      marginBottom: "20px",
    }}
  >
    <h3>Add Class</h3>

    <form onSubmit={saveClass}>
      <select
        name="division_id"
        value={form.division_id}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="">
          Select Division
        </option>

        {divisions.map((division) => (
          <option
            key={division.id}
            value={division.id}
          >
            {division.name}
          </option>
        ))}
      </select>

      <input
        name="name"
        placeholder="Class Name"
        value={form.name}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="code"
        placeholder="Code"
        value={form.code}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        type="number"
        name="display_order"
        value={form.display_order}
        onChange={handleChange}
        style={inputStyle}
      />

      <label>
        <input
          type="checkbox"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
        />
        Active
      </label>

      <br />
      <br />

      <button
        type="submit"
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          padding: "12px 20px",
          borderRadius: "10px",
        }}
      >
        Save Class
      </button>
    </form>
  </div>

  <div
    style={{
      background: "#fff",
      padding: "20px",
      borderRadius: "20px",
    }}
  >
    <table width="100%">
      <thead>
        <tr>
          <th>Name</th>
          <th>Division</th>
          <th>Streams</th>
        </tr>
      </thead>

      <tbody>
        {classes.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>

            <td>
              {item.division?.name || "-"}
            </td>

            <td>
              {item.streams?.length || 0}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
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
