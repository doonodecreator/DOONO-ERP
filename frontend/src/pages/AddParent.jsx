import { useState } from "react";
import api from "../services/api";

export default function AddParent({ setPage }) {
  const [form, setForm] = useState({
    school_id: 1,
    father_name: "",
    father_phone: "",
    father_email: "",
    father_occupation: "",

    mother_name: "",
    mother_phone: "",
    mother_email: "",
    mother_occupation: "",

    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_occupation: "",
    guardian_relationship: "",

    address: "",
  });

  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post(
        "/parents",
        form
      );

      alert(
        "Parent added successfully."
      );

      setPage("parents");
    } catch (error) {
      console.log(error);

      alert(
        "Could not create parent."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        style={{
          marginBottom: "20px",
        }}
      >
        Add Parent
      </h1>

      <form
        onSubmit={submit}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h3>
          Father Information
        </h3>

        <input
          name="father_name"
          placeholder="Father Name"
          value={
            form.father_name
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="father_phone"
          placeholder="Father Phone"
          value={
            form.father_phone
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="father_email"
          placeholder="Father Email"
          value={
            form.father_email
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="father_occupation"
          placeholder="Occupation"
          value={
            form.father_occupation
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <h3>
          Mother Information
        </h3>

        <input
          name="mother_name"
          placeholder="Mother Name"
          value={
            form.mother_name
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="mother_phone"
          placeholder="Mother Phone"
          value={
            form.mother_phone
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="mother_email"
          placeholder="Mother Email"
          value={
            form.mother_email
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="mother_occupation"
          placeholder="Occupation"
          value={
            form.mother_occupation
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <h3>
          Guardian Information
        </h3>

        <input
          name="guardian_name"
          placeholder="Guardian Name"
          value={
            form.guardian_name
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="guardian_phone"
          placeholder="Guardian Phone"
          value={
            form.guardian_phone
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="guardian_email"
          placeholder="Guardian Email"
          value={
            form.guardian_email
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="guardian_occupation"
          placeholder="Occupation"
          value={
            form.guardian_occupation
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <input
          name="guardian_relationship"
          placeholder="Relationship"
          value={
            form.guardian_relationship
          }
          onChange={
            handleChange
          }
          style={input}
        />

        <textarea
          name="address"
          placeholder="Address"
          value={
            form.address
          }
          onChange={
            handleChange
          }
          style={{
            ...input,
            height: "100px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background:
              "#2563eb",
            color: "#fff",
            border: "none",
            padding:
              "15px 30px",
            borderRadius:
              "12px",
            cursor:
              "pointer",
          }}
        >
          {loading
            ? "Saving..."
            : "Save Parent"}
        </button>
      </form>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "15px",
  marginBottom: "15px",
  border:
    "1px solid #cbd5e1",
  borderRadius: "10px",
};
