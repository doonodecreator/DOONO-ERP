import {
  useEffect,
  useState,
} from "react";
import api from "../services/api";

export default function Subjects({
  setPage,
}) {
  const [
    subjects,
    setSubjects,
  ] = useState([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects =
    async () => {
      try {
        const res =
          await api.get(
            "/subjects"
          );

        setSubjects(
          res.data.data
        );
      } catch (err) {
        console.log(err);
      }
    };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <h1>Subjects</h1>

        <button
          onClick={() =>
            setPage(
              "add-subject"
            )
          }
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
          Add Subject
        </button>
      </div>

      <div
        style={{
          background:
            "#fff",
          padding: "20px",
          borderRadius:
            "20px",
          marginTop:
            "20px",
        }}
      >
        <table
          width="100%"
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>
                Category
              </th>
              <th>
                Pass Mark
              </th>
              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {subjects.map(
              (subject) => (
                <tr
                  key={
                    subject.id
                  }
                >
                  <td>
                    {
                      subject.name
                    }
                  </td>

                  <td>
                    {
                      subject.code
                    }
                  </td>

                  <td>
                    {
                      subject.category
                    }
                  </td>

                  <td>
                    {
                      subject.pass_mark
                    }
                  </td>

                  <td>
                    {subject.is_active
                      ? "Active"
                      : "Inactive"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
