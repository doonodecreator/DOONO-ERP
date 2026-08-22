import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/forms/Button";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";
import "./Schools.css";

export default function Schools() {
  const { roles, isPlatformAdmin, isOrganizationOwner, school, refreshContext } = useAuth();
  const roleSlug = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [switchingId, setSwitchingId] = useState(null);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/schools");
      const data = res.data?.data?.data ?? res.data?.data ?? res.data ?? [];
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "We could not load your schools. Please try again.");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(schoolId, action) {
    try {
      setActionId(schoolId);
      setActionMessage("");
      await api.post(`/schools/${schoolId}/${action}`);
      setActionMessage("Free-access status updated successfully.");
      await loadSchools();
    } catch (err) {
      const responseData = err?.response?.data;
      const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()?.[0]
        : null;
      setError(validationMessage || responseData?.message || "The action could not be completed.");
    } finally {
      setActionId(null);
    }
  }

  async function manageSchool(schoolId) {
    try {
      setSwitchingId(schoolId);
      setError("");
      await api.post("/me/switch-school", { school_id: schoolId });
      await refreshContext();
      window.location.href = "/";
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to switch to the selected school.");
      setSwitchingId(null);
    }
  }

  if (loading) {
    return <PageContainer><LoadingSpinner text="Loading schools..." /></PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Schools"
        subtitle={isPlatformAdmin ? "Manage school access and exemptions." : "Your registered school branches."}
      />

      {error && <div className="schools-feedback schools-feedback-error" role="alert">{error}</div>}
      {actionMessage && <div className="schools-feedback schools-feedback-success" role="status">{actionMessage}</div>}

      {schools.length === 0 ? (
        <EmptyState title="No schools yet" message="Schools added to this organization will appear here." />
      ) : (
        <div className="schools-grid">
          {schools.map((item) => (
            <article key={item.id} className="school-card">
              <div className="school-card-main">
                <div className="school-card-heading">
                  <div>
                    <p className="school-card-eyebrow">{item.school_type || "School"}</p>
                    <h2 className="school-card-title">{item.name}</h2>
                  </div>
                  <span className={`school-status school-status-${item.status === "inactive" ? "inactive" : "active"}`}>
                    {item.status || "active"}
                  </span>
                </div>
                <p className="school-card-owner">Owner: <strong>{item.owner?.name || "Current user"}</strong></p>
              </div>

              <div className="school-card-actions">
                {isPlatformAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={actionId === item.id}
                    onClick={() => handleAction(item.id, "toggle-exemption")}
                  >
                    Toggle free access
                  </Button>
                )}
                {(isOrganizationOwner || roleSlug === "proprietor") && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={switchingId === item.id}
                    onClick={() => manageSchool(item.id)}
                  >
                    Manage school
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
