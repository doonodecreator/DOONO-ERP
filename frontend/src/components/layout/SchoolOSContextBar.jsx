import { useAuth } from "../../context/AuthContext";
import { getPrimaryRoleSlug, formatRoleLabel } from "../../utils/role";
import "./SchoolOSContextBar.css";

export default function SchoolOSContextBar({ onNavigate }) {
  const {
    organization,
    school,
    academicContext,
    roles,
    isPlatformAdmin,
    isOrganizationOwner,
  } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const contextName = isPlatformAdmin
    ? "Platform workspace"
    : isOrganizationOwner && !school
      ? organization?.name || "Organization workspace"
      : school?.name || "School workspace";
  const state = academicContext?.state || "organization_context";
  const isReady = state === "ready";
  const stateLabel = state === "ready"
    ? "Operational"
    : state === "needs_session"
      ? "Session setup needed"
      : state === "needs_term"
        ? "Term setup needed"
        : "Organization context";
  const nextAction = state === "needs_session"
    ? { label: "Set up session", page: "academic-sessions" }
    : state === "needs_term"
      ? { label: "Set up term", page: "terms" }
      : !school && isOrganizationOwner
        ? { label: "Manage schools", page: "schools" }
        : null;

  return (
    <section className="school-os-context-bar" aria-label="Current School OS context">
      <div className="school-os-context-main">
        <span className="school-os-context-mark" aria-hidden="true">OS</span>
        <div className="school-os-context-copy">
          <strong>{contextName}</strong>
          <span>
            {school
              ? `${academicContext?.session?.name || "No active session"} · ${academicContext?.term?.name || "No active term"}`
              : "Choose a school to work with school records"}
          </span>
        </div>
      </div>
      <div className="school-os-context-meta">
        <span className="school-os-role">{formatRoleLabel(role)}</span>
        <span className={`school-os-state${isReady ? " school-os-state-ready" : ""}`}>
          <span className="school-os-state-dot" aria-hidden="true" />
          {stateLabel}
        </span>
        {nextAction && (
          <button type="button" className="school-os-context-action" onClick={() => onNavigate?.(nextAction.page)}>
            {nextAction.label}
          </button>
        )}
      </div>
    </section>
  );
}
