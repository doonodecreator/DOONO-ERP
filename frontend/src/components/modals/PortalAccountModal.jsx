import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function PortalAccountModal({
  open,
  entity,
  entityType,
  onClose,
  onSuccess,
}) {
  const isParent = entityType === 'parent';
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    relationship: 'Parent',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdAccount, setCreatedAccount] = useState(null);

  useEffect(() => {
    if (!open) return;

    setForm({
      first_name: '',
      last_name: '',
      email: isParent ? (entity?.father_email || entity?.mother_email || entity?.guardian_email || '') : '',
      password: '',
      password_confirmation: '',
      relationship: 'Parent',
    });
    setError('');
    setFieldErrors({});
    setCreatedAccount(null);
  }, [open, entity, isParent]);

  if (!open) return null;

  const title = isParent ? 'Create Parent Portal Account' : 'Create Student Portal Account';
  const subjectName = isParent
    ? entity?.display_name || 'Selected parent'
    : entity?.full_name || `${entity?.first_name || ''} ${entity?.last_name || ''}`.trim() || 'Selected student';

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});

    try {
      const path = isParent
        ? `/parents/${entity.id}/portal-account`
        : `/students/${entity.id}/portal-account`;
      const response = await api.post(path, form);
      onSuccess?.(response.data);
      setCreatedAccount({ email: form.email });
    } catch (err) {
      setError(err.message || 'Unable to create the portal account.');
      setFieldErrors(err.errors || err.responseData?.errors || {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="portal-account-title">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="portal-account-title" className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Linking portal access for {subjectName}.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {createdAccount ? <div role="status" className="space-y-4"><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-bold">Portal account created successfully.</p><p className="mt-2">Login email: <strong>{createdAccount.email}</strong></p><p className="mt-2">Give the temporary password to the user securely. On first login, the portal will force them to create a new private password before showing any dashboard.</p></div><button type="button" onClick={onClose} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Done</button></div> : <form onSubmit={submit} className="space-y-4">
          {isParent && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                First name
                <input name="first_name" value={form.first_name} onChange={update} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                {fieldErrors.first_name && <span className="text-xs text-rose-600">{fieldErrors.first_name[0]}</span>}
              </label>
              <label className="text-sm font-medium text-slate-700">
                Last name
                <input name="last_name" value={form.last_name} onChange={update} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
                {fieldErrors.last_name && <span className="text-xs text-rose-600">{fieldErrors.last_name[0]}</span>}
              </label>
            </div>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Login email
            <input type="email" name="email" value={form.email} onChange={update} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {fieldErrors.email && <span className="text-xs text-rose-600">{fieldErrors.email[0]}</span>}
          </label>

          {isParent && (
            <label className="block text-sm font-medium text-slate-700">
              Relationship
              <select name="relationship" value={form.relationship} onChange={update} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="Parent">Parent</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </label>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Temporary password
              <input type="password" name="password" value={form.password} onChange={update} required minLength={8} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              {fieldErrors.password && <span className="text-xs text-rose-600">{fieldErrors.password[0]}</span>}
            </label>
            <label className="text-sm font-medium text-slate-700">
              Confirm password
              <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={update} required minLength={8} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Portal Account'}
            </button>
          </div>
        </form>}
      </div>
    </div>
  );
}
