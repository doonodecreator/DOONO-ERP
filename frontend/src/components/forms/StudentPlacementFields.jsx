const fieldClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100';

function FieldError({ errors, name }) {
  const message = errors?.[name]?.[0];

  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export default function StudentPlacementFields({
  form,
  onChange,
  divisions = [],
  classes = [],
  streams = [],
  sessions = [],
  terms = [],
  errors = {},
  includeEnrollmentDate = true,
}) {
  const selectedDivisionId = String(form.division_id || '');
  const selectedClassId = String(form.class_id || '');
  const selectedSessionId = String(form.academic_session_id || '');

  const availableClasses = Array.isArray(classes)
    ? classes.filter((item) => String(item?.division_id || '') === selectedDivisionId)
    : [];
  const availableStreams = Array.isArray(streams)
    ? streams.filter((item) => String(item?.class_id || '') === selectedClassId)
    : [];
  const availableTerms = Array.isArray(terms)
    ? terms.filter(
        (item) =>
          String(item?.academic_session_id || '') === selectedSessionId
      )
    : [];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Academic Placement</h2>
        <p className="mt-1 text-sm text-slate-600">
          Select a school-scoped academic session, term, and class placement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          Division
          <select
            name="division_id"
            value={form.division_id || ''}
            onChange={onChange}
            required
            className={`${fieldClassName} mt-1`}
          >
            <option value="">Select division</option>
            {Array.isArray(divisions) &&
              divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
          </select>
          <FieldError errors={errors} name="division_id" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Class
          <select
            name="class_id"
            value={form.class_id || ''}
            onChange={onChange}
            required
            disabled={!selectedDivisionId}
            className={`${fieldClassName} mt-1`}
          >
            <option value="">Select class</option>
            {availableClasses.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors} name="class_id" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Stream <span className="font-normal text-slate-500">(optional)</span>
          <select
            name="stream_id"
            value={form.stream_id || ''}
            onChange={onChange}
            disabled={!selectedClassId}
            className={`${fieldClassName} mt-1`}
          >
            <option value="">No stream</option>
            {availableStreams.map((stream) => (
              <option key={stream.id} value={stream.id}>
                {stream.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors} name="stream_id" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Academic Session
          <select
            name="academic_session_id"
            value={form.academic_session_id || ''}
            onChange={onChange}
            required
            className={`${fieldClassName} mt-1`}
          >
            <option value="">Select academic session</option>
            {Array.isArray(sessions) &&
              sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
          </select>
          <FieldError errors={errors} name="academic_session_id" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Term
          <select
            name="term_id"
            value={form.term_id || ''}
            onChange={onChange}
            required
            disabled={!selectedSessionId}
            className={`${fieldClassName} mt-1`}
          >
            <option value="">Select term</option>
            {availableTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors} name="term_id" />
        </label>

        {includeEnrollmentDate && (
          <label className="block text-sm font-medium text-slate-700">
            Enrollment Date
            <input
              type="date"
              name="enrollment_date"
              value={form.enrollment_date || ''}
              onChange={onChange}
              required
              className={`${fieldClassName} mt-1`}
            />
            <FieldError errors={errors} name="enrollment_date" />
          </label>
        )}
      </div>
    </section>
  );
}
