import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function AddTeacher({ setPage }) {
  const { roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canInviteStaff = isPlatformAdmin || role === "proprietor";

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Teacher onboarding</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        DONO creates staff accounts through a secure, school-scoped role invitation. A direct staff form is not used because it can create an account without a verified role, school, or email-bound invitation.
      </p>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        {canInviteStaff
          ? "Open Role Invitations to invite a Principal, teacher, or other school staff member. The invitee will create or connect their DONO account using the invitation email."
          : "Only the Proprietor or Software Owner can issue school role invitations. You can view existing teachers from the Teachers page."}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setPage?.(canInviteStaff ? "role-invitations" : "teachers")}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {canInviteStaff ? "Open Role Invitations" : "Back to Teachers"}
        </button>
        <button
          type="button"
          onClick={() => setPage?.("teachers")}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Teachers
        </button>
      </div>
    </div>
  );
}
