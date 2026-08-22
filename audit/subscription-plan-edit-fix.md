# Subscription plan edit fix

## Root cause

Premium plans were seeded with `-1` in `max_students`, `max_staff`, and `max_branches` to mean unlimited. The backend update validator still required every limit to be at least `1`. In addition, the edit form only displayed one capacity field while silently resubmitting the other capacity fields from the API row, so changing the visible number could not fix the hidden invalid `-1` values.

## Fix

The create and update requests now accept `-1` as the documented unlimited value for all three capacity fields. The edit form now displays students, staff, and branches limits, preserves nullable values, shows the unlimited convention, and converts numeric input strings into numbers before sending the PUT request. Empty branch limits default to `1`; empty optional student/staff limits remain `null`.

No database migration is required. After copying the files, clear the Laravel cache and rebuild the frontend.
