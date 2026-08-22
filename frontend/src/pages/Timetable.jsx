import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { arrayFromResponse } from '../utils/response';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import EmptyState from '../components/feedback/EmptyState';
import DataTable from '../components/tables/DataTable';

const ENTRY_TYPES = [
  { value: 'lesson', label: 'Lesson' },
  { value: 'break', label: 'Break' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'event', label: 'School Event' },
  { value: 'holiday', label: 'Holiday / Mid-term Break' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  entry_type: 'lesson',
  schedule_mode: 'weekly',
  target_type: 'class',
  title: '',
  description: '',
  academic_session_id: '',
  term_id: '',
  division_id: '',
  class_id: '',
  stream_id: '',
  subject_id: '',
  staff_id: '',
  day_of_week: 'Monday',
  start_time: '08:00',
  end_time: '08:45',
  event_date: '',
  effective_from: '',
  effective_until: '',
  room: '',
  is_active: true,
};

function apiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()?.[0];
    if (first) return first;
  }
  return data?.message || error?.message || fallback;
}

function labelForEntryType(type) {
  return ENTRY_TYPES.find((item) => item.value === type)?.label || type || 'Lesson';
}

function scheduleDateLabel(item) {
  if (item.schedule_mode === 'date_range') return `${item.effective_from || 'Start'} – ${item.effective_until || 'End'}`;
  if (item.schedule_mode === 'single_date') return item.event_date || 'Specific date';
  return item.day_of_week || 'Weekly';
}

export default function Timetable() {
  const { permissions } = useAuth();
  const canManageTimetable = Array.isArray(permissions) && permissions.includes('manage_timetable');
  const [timetables, setTimetables] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedEntryType, setSelectedEntryType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError('');
    const requests = await Promise.allSettled([
      api.get('/timetables', { params: { per_page: 500 } }),
      api.get('/academic-sessions'),
      api.get('/terms'),
      api.get('/divisions'),
      api.get('/classes'),
      api.get('/streams'),
      api.get('/subjects'),
      canManageTimetable ? api.get('/staff') : Promise.resolve({ status: 'skipped' }),
    ]);

    const [tRes, sessionRes, termRes, divisionRes, classRes, streamRes, subjectRes, staffRes] = requests;
    if (tRes.status === 'fulfilled') setTimetables(arrayFromResponse(tRes.value));
    if (sessionRes.status === 'fulfilled') setSessions(arrayFromResponse(sessionRes.value));
    if (termRes.status === 'fulfilled') setTerms(arrayFromResponse(termRes.value));
    if (divisionRes.status === 'fulfilled') setDivisions(arrayFromResponse(divisionRes.value));
    if (classRes.status === 'fulfilled') setClasses(arrayFromResponse(classRes.value));
    if (streamRes.status === 'fulfilled') setStreams(arrayFromResponse(streamRes.value));
    if (subjectRes.status === 'fulfilled') setSubjects(arrayFromResponse(subjectRes.value));
    if (staffRes.status === 'fulfilled') setStaff(arrayFromResponse(staffRes.value));

    const failed = requests.slice(0, 7).find((result) => result.status === 'rejected');
    if (failed) setError(apiErrorMessage(failed.reason, 'Timetable data could not be loaded.'));
    setLoading(false);
  }

  const selectedTerms = useMemo(
    () => terms.filter((term) => !form.academic_session_id || String(term.academic_session_id) === String(form.academic_session_id)),
    [terms, form.academic_session_id],
  );
  const selectedClasses = useMemo(
    () => classes.filter((item) => !form.division_id || String(item.division_id) === String(form.division_id)),
    [classes, form.division_id],
  );
  const selectedStreams = useMemo(
    () => streams.filter((item) => !form.class_id || String(item.class_id) === String(form.class_id)),
    [streams, form.class_id],
  );
  const filteredTerms = useMemo(
    () => terms.filter((term) => !selectedSession || String(term.academic_session_id) === String(selectedSession)),
    [terms, selectedSession],
  );
  const filteredTimetable = timetables.filter((item) => (
    (!selectedSession || String(item.academic_session_id) === String(selectedSession))
    && (!selectedTerm || String(item.term_id) === String(selectedTerm))
    && (!selectedClass || String(item.class_id) === String(selectedClass))
    && (!selectedEntryType || (item.entry_type || 'lesson') === selectedEntryType)
  ));

  function openCreateModal() {
    setError('');
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function updateForm(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === 'academic_session_id') next.term_id = '';
      if (name === 'division_id') {
        next.class_id = '';
        next.stream_id = '';
      }
      if (name === 'class_id') next.stream_id = '';
      if (name === 'target_type' && value === 'school') {
        next.division_id = '';
        next.class_id = '';
        next.stream_id = '';
      }
      if (name === 'target_type' && value === 'division') {
        next.class_id = '';
        next.stream_id = '';
      }
      if (name === 'entry_type' && value === 'lesson') {
        next.title = '';
        next.target_type = 'class';
      }
      if (name === 'entry_type' && value !== 'lesson') {
        next.subject_id = '';
        next.staff_id = '';
      }
      return next;
    });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      academic_session_id: Number(form.academic_session_id),
      term_id: Number(form.term_id),
      division_id: form.division_id ? Number(form.division_id) : null,
      class_id: form.class_id ? Number(form.class_id) : null,
      stream_id: form.stream_id ? Number(form.stream_id) : null,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      staff_id: form.staff_id ? Number(form.staff_id) : null,
      is_active: true,
    };

    if (payload.schedule_mode === 'weekly') {
      payload.event_date = null;
      payload.effective_from = null;
      payload.effective_until = null;
    } else if (payload.schedule_mode === 'single_date') {
      payload.day_of_week = null;
      payload.effective_from = null;
      payload.effective_until = null;
    } else {
      payload.day_of_week = null;
      payload.start_time = null;
      payload.end_time = null;
      payload.event_date = null;
    }

    try {
      await api.post('/timetables', payload);
      setShowModal(false);
      setForm({ ...emptyForm });
      await loadInitialData();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save timetable entry.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(id) {
    if (!window.confirm('Delete this timetable entry?')) return;
    setError('');
    try {
      await api.delete(`/timetables/${id}`);
      await loadInitialData();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete timetable entry.'));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Term Timetable & Schedules"
        subtitle={canManageTimetable ? 'Build the school’s complete term schedule: lessons, breaks, assemblies, holidays, meetings, and custom events.' : 'View the timetable entries relevant to your class or teaching assignment for the active school term.'}
      />

      {canManageTimetable && <div className="mb-6 flex justify-start"><button type="button" onClick={openCreateModal} className="min-h-11 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700">Add Schedule Entry</button></div>}

      {error && <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={loadInitialData} className="font-semibold underline">Retry</button></div>}

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-4">
        <SelectField label="Academic Session" value={selectedSession} onChange={(value) => { setSelectedSession(value); setSelectedTerm(''); }} options={sessions} placeholder="All sessions" />
        <SelectField label="Term" value={selectedTerm} onChange={setSelectedTerm} options={filteredTerms} placeholder="All terms" />
        <SelectField label="Class" value={selectedClass} onChange={setSelectedClass} options={classes} placeholder="All classes" />
        <label className="text-xs font-semibold text-gray-600">Entry Type<select value={selectedEntryType} onChange={(event) => setSelectedEntryType(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">All entries</option>{ENTRY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>

      {loading ? <LoadingSpinner text="Loading term timetable..." /> : filteredTimetable.length === 0 ? <EmptyState title="No schedule entries" message={canManageTimetable ? 'Add lesson periods, breaks, term events, or holidays for this school.' : 'Your relevant school timetable will appear here once it is configured.'} /> : (
        <DataTable
          columns={[
            { key: 'date', label: 'Day / Date', render: (item) => scheduleDateLabel(item) },
            { key: 'time', label: 'Time', render: (item) => item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : 'All day' },
            { key: 'entry', label: 'Schedule Entry', render: (item) => <div><p className="font-semibold">{item.title || item.subject?.name || labelForEntryType(item.entry_type)}</p><p className="text-xs text-slate-500">{labelForEntryType(item.entry_type)}{item.description ? ` · ${item.description}` : ''}</p></div> },
            { key: 'class', label: 'Class / Stream', render: (item) => item.target_type === 'school' ? 'Whole School' : item.target_type === 'division' ? (item.division?.name || 'Division') : `${item.class?.name || 'Class'}${item.stream?.name ? ` · ${item.stream.name}` : ''}` },
            { key: 'subject', label: 'Subject / Teacher', render: (item) => item.entry_type === 'lesson' ? <div><p>{item.subject?.name || 'Subject'}</p><p className="text-xs text-slate-500">{item.staff?.full_name || 'Teacher not assigned'}</p></div> : (item.room || '—') },
            ...(canManageTimetable ? [{ key: 'actions', label: 'Actions', render: (item) => <button type="button" onClick={() => deleteEntry(item.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button> }] : []),
          ]}
          data={Array.isArray(filteredTimetable) ? filteredTimetable : []}
          emptyMessage="No timetable entries recorded."
        />
      )}

      {showModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="add-schedule-title" style={{ position: 'fixed', inset: 0, zIndex: 9999 }} className="flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="add-schedule-title" className="mb-1 text-lg font-bold text-gray-900">Add Schedule Entry</h3>
            <p className="mb-4 text-xs text-slate-500">A lesson belongs to a class and subject. A break, assembly, holiday, or event may target a class, division, or the whole school.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField label="Entry Type" value={form.entry_type} onChange={(value) => updateForm('entry_type', value)} options={ENTRY_TYPES} placeholder="Select entry type" required labelKey="label" valueKey="value" />
                <SelectField label="Schedule Mode" value={form.schedule_mode} onChange={(value) => updateForm('schedule_mode', value)} options={[{ value: 'weekly', label: 'Weekly throughout the term' }, { value: 'single_date', label: 'One date' }, { value: 'date_range', label: 'Date range / term event' }]} placeholder="Select schedule mode" required labelKey="label" valueKey="value" />
                <SelectField label="Academic Session" value={form.academic_session_id} onChange={(value) => updateForm('academic_session_id', value)} options={sessions} placeholder="Select session" required />
                <SelectField label="Term" value={form.term_id} onChange={(value) => updateForm('term_id', value)} options={selectedTerms} placeholder="Select term" required />
              </div>

              {form.entry_type !== 'lesson' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-gray-600 sm:col-span-2">Title<input required value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Mid-term break, Assembly, Staff meeting..." className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" /></label><label className="text-xs font-semibold text-gray-600 sm:col-span-2">Description / Note<textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Optional details" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows="3" /></label></div>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField label="Applies To" value={form.target_type} onChange={(value) => updateForm('target_type', value)} options={form.entry_type === 'lesson' ? [{ value: 'class', label: 'Class / Stream' }] : [{ value: 'class', label: 'Class / Stream' }, { value: 'division', label: 'Division' }, { value: 'school', label: 'Whole School' }]} placeholder="Select audience" required labelKey="label" valueKey="value" />
                {(form.target_type === 'division' || form.target_type === 'class') && <SelectField label="Division" value={form.division_id} onChange={(value) => updateForm('division_id', value)} options={divisions} placeholder="Select division" required />}
                {form.target_type === 'class' && <SelectField label="Class" value={form.class_id} onChange={(value) => updateForm('class_id', value)} options={selectedClasses} placeholder="Select class" required />}
                {form.target_type === 'class' && <SelectField label="Stream (optional)" value={form.stream_id} onChange={(value) => updateForm('stream_id', value)} options={selectedStreams} placeholder="All streams" />}
                {form.entry_type === 'lesson' && <SelectField label="Subject" value={form.subject_id} onChange={(value) => updateForm('subject_id', value)} options={subjects} placeholder="Select subject" required />}
                {form.entry_type === 'lesson' && <SelectField label="Teacher" value={form.staff_id} onChange={(value) => updateForm('staff_id', value)} options={staff} placeholder="Unassigned" labelKey="full_name" />}
              </div>

              {form.schedule_mode === 'weekly' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><SelectField label="Day" value={form.day_of_week} onChange={(value) => updateForm('day_of_week', value)} options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((value) => ({ id: value, name: value }))} placeholder="Day" required /><TimeField label="Start time" value={form.start_time} onChange={(value) => updateForm('start_time', value)} /><TimeField label="End time" value={form.end_time} onChange={(value) => updateForm('end_time', value)} /></div>}
              {form.schedule_mode === 'single_date' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><DateField label="Date" value={form.event_date} onChange={(value) => updateForm('event_date', value)} /><TimeField label="Start time" value={form.start_time} onChange={(value) => updateForm('start_time', value)} /><TimeField label="End time" value={form.end_time} onChange={(value) => updateForm('end_time', value)} /></div>}
              {form.schedule_mode === 'date_range' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><DateField label="Effective from" value={form.effective_from} onChange={(value) => updateForm('effective_from', value)} /><DateField label="Effective until" value={form.effective_until} onChange={(value) => updateForm('effective_until', value)} /></div>}
              <label className="text-xs font-semibold text-gray-600">Room / Location (optional)<input value={form.room} onChange={(event) => updateForm('room', event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 text-sm" /></label>
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white pt-3"><button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Schedule Entry'}</button></div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required = false, labelKey = 'name', valueKey = 'id' }) {
  return <label className="text-xs font-semibold text-gray-600">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"><option value="">{placeholder}</option>{(Array.isArray(options) ? options : []).map((item) => <option key={item[valueKey]} value={item[valueKey]}>{item[labelKey] || item.name || item.title || `#${item.id}`}</option>)}</select></label>;
}

function TimeField({ label, value, onChange }) {
  return <label className="text-xs font-semibold text-gray-600">{label}<input required type="time" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>;
}

function DateField({ label, value, onChange }) {
  return <label className="text-xs font-semibold text-gray-600">{label}<input required type="date" value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>;
}
