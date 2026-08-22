# Employment Authority and Navigation Fix

The release makes role appointment and employment authority explicit. Only the school-scoped Proprietor can create or revoke role invitations, edit employment records, suspend or terminate staff, or remove their school access. Principals may view staff where assigned `view_staff` permission but cannot invite another Principal or mutate staff employment.

A staff termination preserves the historical staff record, sets the employment status to Terminated, revokes the school-scoped role pivot, clears the active school context when applicable, and records an audit event. Suspension, retirement, resignation, and other non-Active status changes also revoke school access. Reactivation records an audit event; a new invitation or explicit role restoration is required to grant access again.

The authenticated shell now exposes a visible Log out button. The dashboard layout records in-app page history and intercepts Android/Chrome back navigation so module-to-module navigation returns to the previous DONO page instead of leaving the SPA. The first dashboard page is protected from accidentally exiting through the browser back button.

The Principal’s Leadership Assignment menu entry is removed and the API is protected by `has.school` plus `role:proprietor`. Existing databases require the new employment-authority migration to remove any stale Principal `assign_roles` pivot and add `view_staff`.
