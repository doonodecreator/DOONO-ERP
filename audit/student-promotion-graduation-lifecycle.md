# Student Promotion and Graduation Lifecycle Audit

## Finding before the fix

The original promotion endpoint only created a row in `student_promotions`. It did not close the source enrollment, create target-session enrollments, update the student’s current placement, or change the student status. The original graduation endpoint only created a `graduation_records` row. It did not close active enrollments, change the student status, or stop active student learning access. This meant that a learner could remain attached to the old class while a promotion record said otherwise, or could remain active in assignments and timetable after graduation.

Results processing remains correctly separated from final lifecycle execution: result computation produces a promotion recommendation in the result summary according to the school’s configured pass mark, failed-subject limit, final-term rule, and approval settings. An authorized school decision in Promotion / Graduation is the action that changes enrollment and student lifecycle state.

## Implemented rules

A promoted or repeated learner keeps all historical source-term enrollments. Those source enrollments are marked `Promoted` or `Repeated`, and DOONO creates exactly one target enrollment for every term in the selected target academic session. The target class, division, and optional stream are validated against the same school. The target session must already contain terms.

If the target session and one of its terms are current, the student’s denormalized current placement is updated immediately. If the target session is future, the student remains in the present placement until that session and a term are activated. Activating a session or term now synchronizes eligible active target enrollments into the student row. This keeps timetable, assignments, CBT, attendance, and student-portal placement aligned with the current academic period.

A repeated learner receives a new target-session enrollment at the selected repeat placement. A transferred learner receives no target enrollment; the source active enrollment is closed and the student status becomes `Transferred`. A graduated or alumni learner receives no future active enrollment; all active/promoted/repeated enrollments are closed, the student status becomes `Graduated`, and the official graduation record is created or completed.

Pending graduation records are preparation records only. They do not deactivate the student or close enrollment. Completed graduation records are official history and cannot be deleted or downgraded through ordinary edit actions. Only date, remarks, certificate number, destination, and other permitted record details can be corrected. Ordinary student profile edits can no longer change lifecycle status or placement; those changes belong to the lifecycle workflows.

## Portal and module behavior

A completed graduate, transfer, or withdrawal cannot use active student dashboard, assignment, timetable, or leave-application workflows. CBT already requires an active enrollment, so closing active enrollments removes CBT access consistently. Linked parents and authorized staff retain their permitted historical views, including published report cards, invoices, transcripts, and Student 360 history.

## Validation

The affected PHP files passed lint. The PHPUnit suite passed with 14 tests and 19 assertions. Laravel route compilation passed for promotion and graduation endpoints. The guide validator passed with 73 modules and 57 role guides. The DOONO architecture guard passed. The Vite production build passed with 274 modules.

A live MySQL workflow test remains necessary after applying the release: promote one learner into a future session, activate that session and term, verify the current class changes, then graduate a test learner and confirm active student portal learning requests are rejected while historical parent/staff records remain available. No claim of live database concurrency or production-scale behavior is made from the sandbox tests alone.
