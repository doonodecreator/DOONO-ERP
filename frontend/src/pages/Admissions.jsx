import { useEffect, useState } from 'react';
import api from '../services/api';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import EmptyState from '../components/feedback/EmptyState';
import StudentPlacementFields from '../components/forms/StudentPlacementFields';

const inputClassName =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = () => ({
  admission_number: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  date_of_birth: '',
  admission_date: today(),
  division_id: '',
  class_id: '',
  stream_id: '',
  academic_session_id: '',
  term_id: '',
  enrollment_date: today(),
  religion: '',
  nationality: 'Nigeria',
  state_of_origin: '',
  local_government: '',
  address: '',
  blood_group: '',
  genotype: '',
  medical_notes: '',
});

function collectionFrom(response, label) {
  const payload = response?.data;
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : null;

  if (!collection) {
    throw new Error(`The ${label} response is not a valid collection.`);
  }

  return collection;
}

function FieldError({ errors, name }) {
  const message = errors?.[name]?.[0];

  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export default function Admissions({ setPage }) {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({
    divisions: [],
    classes: [],
    streams: [],
    sessions: [],
    terms: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const [divisionResponse, classResponse, streamResponse, sessionResponse, termResponse] =
          await Promise.all([
            api.get('/divisions'),
            api.get('/classes'),
            api.get('/streams'),
            api.get('/academic-sessions'),
            api.get('/terms'),
          ]);

        if (!active) return;

        setOptions({
          divisions: collectionFrom(divisionResponse, 'divisions'),
          classes: collectionFrom(classResponse, 'classes'),
          streams: collectionFrom(streamResponse, 'streams'),
          sessions: collectionFrom(sessionResponse, 'academic sessions'),
          terms: collectionFrom(termResponse, 'terms'),
        });
      } catch (error) {
        if (active) {
          setLoadError(
            error.message || 'Unable to load the admission configuration.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === 'division_id') {
        next.class_id = '';
        next.stream_id = '';
      }

      if (name === 'class_id') {
        next.stream_id = '';
      }

      if (name === 'academic_session_id') {
        next.term_id = '';
      }

      return next;
    });

    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setErrors({});

    try {
      await api.post('/admissions', form);
      setPage('students');
    } catch (error) {
      setErrors(error.errors || error.responseData?.errors || {});
      setSubmitError(error.message || 'Unable to complete the admission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admission configuration..." />;
  }

  if (loadError) {
    return (
      <PageContainer>
        <PageHeader
          title="New Admission"
          subtitle="Create a student profile and initial academic enrollment together."
        />
        <EmptyState
          title="Admission configuration is unavailable"
          message={loadError}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="New Admission"
        subtitle="Create the student record and first enrollment as one school-scoped action."
        action={
          <button
            type="button"
            onClick={() => setPage('students')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Students
          </button>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Student Details</h2>
            <p className="mt-1 text-sm text-slate-600">
              The admission number is unique within the selected school.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">
              First Name
              <input name="first_name" value={form.first_name} onChange={handleChange} required className={inputClassName} />
              <FieldError errors={errors} name="first_name" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Middle Name <span className="font-normal text-slate-500">(optional)</span>
              <input name="middle_name" value={form.middle_name} onChange={handleChange} className={inputClassName} />
              <FieldError errors={errors} name="middle_name" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Last Name
              <input name="last_name" value={form.last_name} onChange={handleChange} required className={inputClassName} />
              <FieldError errors={errors} name="last_name" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Admission Number
              <input name="admission_number" value={form.admission_number} onChange={handleChange} required className={inputClassName} />
              <FieldError errors={errors} name="admission_number" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Gender
              <select name="gender" value={form.gender} onChange={handleChange} required className={inputClassName}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <FieldError errors={errors} name="gender" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Date of Birth
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required className={inputClassName} />
              <FieldError errors={errors} name="date_of_birth" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Admission Date
              <input type="date" name="admission_date" value={form.admission_date} onChange={handleChange} required className={inputClassName} />
              <FieldError errors={errors} name="admission_date" />
            </label>
          </div>
        </section>

        <StudentPlacementFields
          form={form}
          onChange={handleChange}
          divisions={options.divisions}
          classes={options.classes}
          streams={options.streams}
          sessions={options.sessions}
          terms={options.terms}
          errors={errors}
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Additional Information</h2>
            <p className="mt-1 text-sm text-slate-600">Optional demographic and health information.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700">Religion<input name="religion" value={form.religion} onChange={handleChange} className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700">Nationality<input name="nationality" value={form.nationality} onChange={handleChange} className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700">State of Origin<input name="state_of_origin" value={form.state_of_origin} onChange={handleChange} className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700">Local Government<input name="local_government" value={form.local_government} onChange={handleChange} className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700">Blood Group<input name="blood_group" value={form.blood_group} onChange={handleChange} className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700">Genotype<input name="genotype" value={form.genotype} onChange={handleChange} className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2 lg:col-span-3">Address<textarea name="address" value={form.address} onChange={handleChange} rows="3" className={inputClassName} /></label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2 lg:col-span-3">Medical Notes<textarea name="medical_notes" value={form.medical_notes} onChange={handleChange} rows="3" className={inputClassName} /></label>
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={() => setPage('students')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Completing Admission...' : 'Complete Admission'}
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
