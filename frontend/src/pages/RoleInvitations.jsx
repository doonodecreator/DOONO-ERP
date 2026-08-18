import React, { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";

const initialForm = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "Male",
    designation: "",
    department: "",
    staff_number: "",
    employment_date: "",
    role_slug: "",
};

export default function RoleInvitations({ setPage }) {
    const [roles, setRoles] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [revokingId, setRevokingId] = useState(null);
    const [error, setError] = useState("");
    const [createdLink, setCreatedLink] = useState("");
    const [delegations, setDelegations] = useState([]);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [delegationUserId, setDelegationUserId] = useState("");
    const [selectedPermissionSlugs, setSelectedPermissionSlugs] = useState([]);
    const [delegationSaving, setDelegationSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [rolesResponse, invitationsResponse, delegationResponse] = await Promise.allSettled([
                api.get("/roles"),
                api.get("/role-invitations"),
                api.get("/school-setup/delegations"),
            ]);

            const availableRoles = rolesResponse.status === "fulfilled" && Array.isArray(rolesResponse.value?.data?.data) ? rolesResponse.value.data.data : [];
            const currentInvitations = invitationsResponse.status === "fulfilled" && Array.isArray(invitationsResponse.value?.data?.data) ? invitationsResponse.value.data.data : [];
            const delegationPayload = delegationResponse.status === "fulfilled" ? delegationResponse.value?.data || {} : {};
            const currentDelegations = Array.isArray(delegationPayload.data) ? delegationPayload.data : [];
            const permissions = Array.isArray(delegationPayload.available_permissions) ? delegationPayload.available_permissions : [];

            setRoles(availableRoles);
            setInvitations(currentInvitations);
            setDelegations(currentDelegations);
            setAvailablePermissions(permissions);

            const failedResponse = [rolesResponse, invitationsResponse, delegationResponse].find((response) => response.status === "rejected");
            if (failedResponse) {
                throw new Error(failedResponse.reason?.response?.data?.message || failedResponse.reason?.message || "Some leadership data could not be loaded.");
            }
            setForm((current) => ({
                ...current,
                role_slug: current.role_slug || availableRoles[0]?.slug || "",
            }));
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to load role invitations.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const createInvitation = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        setCreatedLink("");

        try {
            const response = await api.post("/role-invitations", form);
            const acceptPath = response?.data?.accept_path;
            setCreatedLink(acceptPath ? `${window.location.origin}${acceptPath}` : "");
            setForm(initialForm);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to create the role invitation.");
        } finally {
            setSubmitting(false);
        }
    };

    const revokeInvitation = async (id) => {
        setRevokingId(id);
        setError("");

        try {
            await api.post(`/role-invitations/${id}/revoke`);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to revoke the invitation.");
        } finally {
            setRevokingId(null);
        }
    };

    const copyLink = async () => {
        if (!createdLink) return;
        await navigator.clipboard?.writeText(createdLink);
    };

    const acceptedLeaders = invitations.filter((invitation) =>
        invitation.status === "accepted"
        && invitation.accepted_user_id
        && ["principal", "vice_principal_academic"].includes(invitation.role_slug)
    );

    const saveDelegation = async (event) => {
        event.preventDefault();
        if (!delegationUserId || selectedPermissionSlugs.length === 0) {
            setError("Select an accepted Principal or Vice Principal Academic and at least one setup permission.");
            return;
        }
        setDelegationSaving(true);
        setError("");
        try {
            await api.put(`/school-setup/delegations/${delegationUserId}`, { permission_slugs: selectedPermissionSlugs });
            setDelegationUserId("");
            setSelectedPermissionSlugs([]);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to update setup delegation.");
        } finally {
            setDelegationSaving(false);
        }
    };

    const revokeDelegation = async (userId) => {
        setDelegationSaving(true);
        setError("");
        try {
            await api.delete(`/school-setup/delegations/${userId}`);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Unable to revoke setup delegation.");
        } finally {
            setDelegationSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading role invitations..." />;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 text-slate-800">
            {error && <div role="alert" className="error-message mb-4">{error}</div>}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leadership & Role Invitations</h1>
                    <p className="text-sm text-slate-500">Invite a verified person to accept a school-scoped role. The role is inactive until acceptance.</p>
                </div>
                <button type="button" onClick={() => setPage?.("dashboard")} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white text-sm">
                    Back to Dashboard
                </button>
            </div>

            {createdLink && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                    <p className="font-semibold text-emerald-800 text-sm">Invitation created.</p>
                    <p className="text-xs text-emerald-700 mt-1">Send this one-time link to the invitee. It expires after seven days and is not shown again after leaving this page.</p>
                    <div className="flex gap-2 mt-3">
                        <input readOnly value={createdLink} className="flex-1 min-w-0 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs" />
                        <button type="button" onClick={copyLink} className="px-3 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold">Copy Link</button>
                    </div>
                </div>
            )}

            <section className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 mb-6">
                <div className="mb-4">
                    <h2 className="font-bold text-slate-900">Delegate School Setup</h2>
                    <p className="mt-1 text-xs text-slate-500">Only an accepted Principal or Vice Principal Academic can receive these permissions. Delegation never creates an account or bypasses invitation acceptance.</p>
                </div>
                <form onSubmit={saveDelegation} className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
                    <select value={delegationUserId} onChange={(event) => setDelegationUserId(event.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
                        <option value="">Select accepted role holder</option>
                        {acceptedLeaders.map((leader) => <option key={leader.accepted_user_id} value={leader.accepted_user_id}>{leader.name} — {leader.role || leader.role_slug}</option>)}
                    </select>
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availablePermissions.map((permission) => <label key={permission.slug} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"><input type="checkbox" checked={selectedPermissionSlugs.includes(permission.slug)} onChange={(event) => setSelectedPermissionSlugs((current) => event.target.checked ? [...new Set([...current, permission.slug])] : current.filter((slug) => slug !== permission.slug))} />{permission.name}</label>)}
                    </div>
                    <button disabled={delegationSaving || acceptedLeaders.length === 0} type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 lg:col-span-3">{delegationSaving ? "Saving delegation..." : "Save Delegation"}</button>
                </form>
                {delegations.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">{delegations.map((delegation) => <div key={delegation.user?.id} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-800">{delegation.user?.name || delegation.user?.email}</p><p className="text-xs text-slate-500">{Array.isArray(delegation.permissions) ? delegation.permissions.map((permission) => permission.name).join(", ") : "Delegated setup access"}</p></div><button type="button" disabled={delegationSaving} onClick={() => revokeDelegation(delegation.user?.id)} className="self-start rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">Revoke</button></div>)}</div>}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <form onSubmit={createInvitation} className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div>
                        <h2 className="font-bold text-slate-900">Invite a role holder</h2>
                        <p className="text-xs text-slate-500 mt-1">Do not create or share a password for another person.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input required name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" className="px-3 py-2 border rounded-lg text-sm" />
                        <input required name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" className="px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="Invitee email" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <input required name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select name="gender" value={form.gender} onChange={handleChange} className="px-3 py-2 border rounded-lg text-sm bg-white">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <select required name="role_slug" value={form.role_slug} onChange={handleChange} className="px-3 py-2 border rounded-lg text-sm bg-white">
                            <option value="">Select role</option>
                            {roles.map((role) => <option key={role.slug} value={role.slug}>{role.name}</option>)}
                        </select>
                    </div>
                    <input required name="designation" value={form.designation} onChange={handleChange} placeholder="Designation, e.g. Principal" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <input name="department" value={form.department} onChange={handleChange} placeholder="Department (optional)" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <input name="staff_number" value={form.staff_number} onChange={handleChange} placeholder="Staff number (optional)" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <input type="date" name="employment_date" value={form.employment_date} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <button type="submit" disabled={submitting || roles.length === 0} className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50">
                        {submitting ? "Creating Invitation..." : "Create Secure Invitation"}
                    </button>
                </form>

                <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-slate-900">Invitation History</h2>
                            <p className="text-xs text-slate-500 mt-1">Pending invitations do not grant access until accepted.</p>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{invitations.length} records</span>
                    </div>
                    {invitations.length === 0 ? (
                        <EmptyState title="No role invitations" message="Create an invitation when a school role needs to be assigned." />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {invitations.map((invitation) => (
                                <div key={invitation.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{invitation.name} • {invitation.role || invitation.role_slug}</p>
                                        <p className="text-xs text-slate-500 mt-1">{invitation.email} • {invitation.designation}</p>
                                        <p className="text-xs text-slate-400 mt-1">{invitation.status} {invitation.expires_at ? `• Expires ${new Date(invitation.expires_at).toLocaleDateString()}` : ""}</p>
                                    </div>
                                    {invitation.status === "pending" && (
                                        <button type="button" disabled={revokingId === invitation.id} onClick={() => revokeInvitation(invitation.id)} className="px-3 py-1.5 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold disabled:opacity-50">
                                            {revokingId === invitation.id ? "Revoking..." : "Revoke"}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
