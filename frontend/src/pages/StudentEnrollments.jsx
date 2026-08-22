import { useEffect, useState } from 'react';
import api from '../services/api';
import { arrayFromResponse } from '../utils/response';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import DataTable from '../components/tables/DataTable';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import EmptyState from '../components/feedback/EmptyState';
import StudentPlacementFields from '../components/forms/StudentPlacementFields';

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = () => ({
  student_id: '',
  division_id: '',
  class_id: '',
  stream_id: '',
  academic_session_id: '',
  term_id: '',
  enrollment_date: today(),
  status: 'Active',
});

function collectionFrom(response, label) {
  const collection = arrayFromResponse(response);

  if (!Array.isArray(collection)) {
    throw new Error(`The ${label} response is not a valid collection.`);
  }

  return collection;
}

function FieldError({ errors, name }) {
  const message = errors?.[name]?.[0];

  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export default function StudentEnrollments() {
  const [form, setForm] = useState(initialForm);
  const [options, setOptions] = useState({
    divisions: [],
    classes: [],
    streams: [],
    sessions: [],
    terms: [],
  });
  const [enrollments, setEnrollments] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentMatches, setStudentMatches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  const loadScreen = async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [divisionResponse, classResponse, streamResponse, sessionResponse, termResponse, enrollmentResponse] =
        await Promise.all([
          api.get('/divisions'),
          api.get('/classes'),
          api.get('/streams'),
          api.get('/academic-sessions'),
          api.get('/terms'),
          api.get('/enrollments', { params: { per_page: 100 } }),
        ]);

      setOptions({
        divisions: collectionFrom(divisionResponse, 'divisions'),
        classes: collectionFrom(classResponse, 'classes'),
        streams: collectionFrom(streamResponse, 'streams'),
        sessions: collectionFrom(sessionResponse, 'academic sessions'),
        terms: collectionFrom(termResponse, 'terms'),
      });
      setEnrollments(collectionFrom(enrollmentResponse, 'enrollments'));
    } catch (error) {
      setLoadError(error.message || 'Unable to load enrollment information.');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScreen();
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

  const searchStudents = async (event) => {
    event.preventDefault();
    const search = studentQuery.trim();

    if (search.length < 2) {
      setStudentMatches([]);
      setErrors((current) => ({
        ...current,
        student_id: ['Enter at least two characters to search for a student.'],
      }));
      return;
    }

    setSearchingStudents(true);
    setErrors((current) => ({ ...current, student_id: undefined }));

    try {
      const response = await api.get('/students', {
        params: { search, per_page: 25 },
      });
      setStudentMatches(collectionFrom(response, 'students'));
    } catch (error) {
      setStudentMatches([]);
      setErrors((current) => ({
        ...current,
        student_id: [error.message || 'Unable to search students.'],
      }));
    } finally {
      setSearchingStudents(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setForm((current) => ({ ...current, student_id: student.id }));
    setStudentMatches([]);
    setStudentQuery('');
    setErrors((current) => ({ ...current, student_id: undefined }));
  };

  const resetForm = () => {
    setForm(initialForm());
    setEditingId(null);
    setSelectedStudent(null);
    setStudentMatches([]);
    setStudentQuery('');
    setErrors({});
    setSubmitError('');
  };

  const beginEdit = (enrollment) => {
    setEditingId(enrollment.id);
    setSelectedStudent(enrollment.student || null);
    setForm({
      student_id: enrollment.student_id || '',
      division_id: enrollment.division_id || '',
      class_id: enrollment.class_id || '',
      stream_id: enrollment.stream_id || '',
      academic_session_id: enrollment.academic_session_id || '',
      term_id: enrollment.term_id || '',
      enrollment_date: enrollment.enrollment_date || today(),
      status: enrollment.status || 'Active',
    });
    setErrors({});
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSubmitError('');

    try {
      if (editingId) {
        await api.put(`/enrollments/${editingId}`, form);
      } else {
        await api.post('/enrollments', form);
      }

      resetForm();
      await loadScreen();
    } catch (error) {
      setErrors(error.errors || error.responseData?.errors || {});
      setSubmitError(error.message || 'Unable to save the enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (enrollment) =>
        enrollment.student?.full_name ||
        `${enrollment.student?.first_name || ''} ${enrollment.student?.last_name || ''}`.trim() ||
        'Unknown student',
    },
    {
      key: 'admission_number',
      label: 'Admission No.',
      render: (enrollment) => enrollment.student?.admission_number || '—',
    },
    {
      key: 'placement',
      label: 'Placement',
      render: (enrollment) => {
        const className = enrollment.class?.name || 'Unassigned class';
        const streamName = enrollment.stream?.name;
        return streamName ? `${className} — ${streamName}` : className;
      },
    },
    {
      key: 'academic_period',
      label: 'Session / Term',
      render: (enrollment) =>
        `${enrollment.academic_session?.name || '—'} / ${enrollment.term?.name || '—'}`,
    },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (enrollment) => (
        <button
          type="button"
          onClick={() => beginEdit(enrollment)}
          className="text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          Edit
        </button>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading enrollment and placement records..." />;
  }

  if (loadError) {
    return (
      <PageContainer>
        <PageHeader
          title="Enrollment & Class Placement"
          subtitle="Place existing students in an academic session, term, and class."
        />
        <EmptyState title="Enrollment information is unavailable" message={loadError} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Enrollment & Class Placement"
        subtitle="Manage school-scoped student enrollment records and current academic placement."
      />

      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {editingId ? 'Edit Enrollment' : 'Create Enrollment'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              An enrollment is unique for each student, academic session, and term.
            </p>
          </div>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm font-medium text-slate-700 hover:text-slate-950">
              Cancel edit
            </button>
          )}
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
        )}

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Student</h3>
            <p className="mt-1 text-sm text-slate-600">Search within the active school before creating a placement.</p>
          </div>

          {!editingId && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Search by admission number or student name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button type="button" onClick={searchStudents} disabled={searchingStudents} className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60">
                {searchingStudents ? 'Searching...' : 'Search'}
              </button>
            </div>
          )}

          {selectedStudent && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
              <span className="font-semibold">Selected student: </span>
              {selectedStudent.full_name || `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim()}
              {selectedStudent.admission_number ? ` (${selectedStudent.admission_number})` : ''}
            </div>
          )}

          {studentMatches.length > 0 && (
            <div className="divide-y overflow-hidden rounded-lg border border-slate-200">
              {studentMatches.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => selectStudent(student)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">
                    {student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                  </span>
                  <span className="text-slate-600">{student.admission_number || 'No admission number'}</span>
                </button>
              ))}
            </div>
          )}
          <FieldError errors={errors} name="student_id" />
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

        <label className="block max-w-sm text-sm font-medium text-slate-700">
          Enrollment Status
          <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
            <option value="Active">Active</option>
            <option value="Promoted">Promoted</option>
            <option value="Repeated">Repeated</option>
            <option value="Graduated">Graduated</option>
            <option value="Transferred">Transferred</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
          <FieldError errors={errors} name="status" />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Reset</button>
          <button type="submit" disabled={submitting || !form.student_id} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Saving...' : editingId ? 'Update Enrollment' : 'Create Enrollment'}
          </button>
        </div>
      </form>

      <DataTable
        columns={columns}
        data={Array.isArray(enrollments) ? enrollments : []}
        emptyMessage="No enrollment records are available for this school."
      />
    </PageContainer>
  );
}
