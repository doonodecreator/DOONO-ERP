import { useEffect, useState } from "react";
import api from "../services/api";

export default function Parents({
  setPage,
  setSelectedParent,
}) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    try {
      const response =
        await api.get("/parents");

      setParents(
        response.data.data || []
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParents =
    parents.filter((parent) => {
      const text =
        `${parent.father_name}
         ${parent.mother_name}
         ${parent.guardian_name}`
          .toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          color: "#1e293b",
          marginBottom: "10px",
        }}
      >
        Parents
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "30px",
        }}
      >
        Manage all parents and guardians.
      </p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "20px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
            minWidth: "250px",
          }}
        >
          <h3>Total Parents</h3>

          <h1
            style={{
              color: "#2563eb",
            }}
          >
            {parents.length}
          </h1>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "20px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="Search parent..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            style={{
              padding: "12px",
              width: "300px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "12px",
            }}
          />

          <button
            onClick={() =>
              setPage(
                "add-parent"
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
                "12px",
              cursor:
                "pointer",
            }}
          >
            + Add Parent
          </button>
        </div>

        {loading ? (
          <p>
            Loading parents...
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse:
                "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>
                  Father
                </th>

                <th style={thStyle}>
                  Phone
                </th>

                <th style={thStyle}>
                  Mother
                </th>

                <th style={thStyle}>
                  Guardian
                </th>

                <th style={thStyle}>
                  Address
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredParents.map(
                (parent) => (
                  <tr
                    key={
                      parent.id
                    }
                    onClick={() => {
                      setSelectedParent(
                        parent
                      );

                      setPage(
                        "parent-profile"
                      );
                    }}
                    style={{
                      cursor:
                        "pointer",
                    }}
                  >
                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        parent.father_name
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        parent.father_phone
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        parent.mother_name
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        parent.guardian_name
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        parent.address
                      }
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "15px",
  textAlign: "left",
  borderBottom:
    "1px solid #e2e8f0",
};

const tdStyle = {
  padding: "15px",
  borderBottom:
    "1px solid #e2e8f0",
};
