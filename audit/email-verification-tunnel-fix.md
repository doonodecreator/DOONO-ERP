# DOONO Email Verification Tunnel Fix

## Root cause

Local Test Inbox messages were storing absolute signed links generated from Laravel's local `APP_URL`, which was `http://127.0.0.1:8000`. A phone opening that address reaches the phone itself, not the Termux backend. The verification link therefore could not complete reliably, and login correctly remained blocked because `email_verified_at` had not been updated.

## Applied fix

In Local Test Inbox mode, the verification service now generates a relative signed path. The phone opens that path through the current frontend tunnel and Vite proxy. Existing messages generated with localhost URLs are also rewritten to the current API origin by the Local Test Inbox as a compatibility fallback.

The signed route uses domain-independent validation, so a signed path generated on localhost remains valid when opened through a tunnel host. The controller marks the user verified before redirecting to the frontend. The redirect uses `FRONTEND_URL` in deployed environments and falls back to the requesting public origin when local tunnel headers are available.

Real email delivery continues to use absolute URLs. For Railway, set `APP_URL` to the public backend URL and `FRONTEND_URL` to the public frontend URL. Keep `APP_KEY` unchanged after deployment; changing it invalidates existing signed verification links.

## User flow

1. Register or accept an invitation.
2. Open the Local Test Inbox while testing locally.
3. Open the verification button; it now uses the current tunnel instead of `127.0.0.1`.
4. The backend validates the signature and email hash, sets `email_verified_at`, and redirects to `/email-verified`.
5. Select **Continue to sign in** and use the same email and password.

Previously issued localhost links can be opened from the updated Local Test Inbox because the frontend rewrites them. If a link was copied outside the inbox, resend verification once so a new relative link is generated.

## Validation

PHP lint passed for the changed verification files. The signed verification cross-host regression test passed. The Laravel suite passed 12 tests and 16 assertions. The verification route was discovered with `signed:relative`, and the Vite production build passed.
