import React from 'react';
const AddStaff = ({ setPage }) => (
    <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Use Secure Role Invitations</h1>
            <p className="text-sm text-slate-500 mt-3">
                Direct staff creation with a proprietor-supplied password has been disabled. Invite the person by email so they create their own password and activate the school-scoped role themselves.
            </p>
            <div className="flex justify-center gap-3 mt-6">
                <button type="button" onClick={() => setPage('role-invitations')} className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm">
                    Open Role Invitations
                </button>
                <button type="button" onClick={() => setPage('staff')} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold text-sm">
                    Back to Staff
                </button>
            </div>
        </div>
    </div>
);

export default AddStaff;
