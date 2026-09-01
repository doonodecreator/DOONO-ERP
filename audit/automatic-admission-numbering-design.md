# Automatic Admission Numbering Design

## Decision

DOONO will assign admission numbers on successful student creation. Staff will not type an admission number in normal admission or direct student-registration forms. The backend is authoritative and ignores any client-supplied admission number during creation.

## Format

New numbers use the current school code followed by a six-digit, zero-padded counter: `SCHOOLCODE-000001`. The number is a permanent student identifier and does not reset with a new academic session or term. This keeps a learner's identity stable when the learner moves between sessions, terms, classes, streams, or parents.

The school code is required and globally unique in the current schools schema. It is normalized to uppercase, whitespace is converted to hyphens, and only letters, digits, and hyphens are retained. If normalization were ever to produce an empty prefix, the allocator uses `SCH-{school_id}` as a deterministic fallback.

## Collision and tenant rules

A separate `school_admission_sequences` row is locked with `lockForUpdate()` inside the same database transaction that creates the student. The counter is incremented only after a candidate has been checked against the students table. Existing manually entered or legacy numbers are never rewritten by the migration. Because the current students table has a global unique admission-number index, candidates are checked globally as well as being generated from a unique school prefix.

The current school is always resolved through `CurrentContextService`. A caller cannot select another school by posting a `school_id`. Both `/admissions` and `/students` use the same allocator.

## Editing and imports

Admission numbers are immutable through the normal student update endpoint. Ordinary profile edits do not accept or submit `admission_number`. Existing legacy records may retain their current values. A future import or correction tool, if required, must be a separate privileged and audited workflow; it is not opened by this change.

## User experience

The admission pages explain that DOONO generates the number after creation. On success, the issued number is shown clearly with the student name and next-step guidance. The student directory continues to search and display the issued number, and official documents use it where already supported.
## Validation performed

The changed PHP files passed lint. The focused allocator tests passed (`2 tests, 3 assertions`). The complete available PHPUnit suite passed (`14 tests, 19 assertions`), the API route list compiled, the DOONO architecture guard passed, and the Vite production build passed (`274 modules`). The build still reports the existing large-bundle warning; it is not an admission-numbering failure.

A live MySQL concurrency test was not run in the sandbox because the canonical test environment does not provide the project database. The implementation uses a database row lock and a unique sequence row, but production concurrency should still be smoke-tested after the migration is applied to the target database.
