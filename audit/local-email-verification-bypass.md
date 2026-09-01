# Local-only email verification bypass

For Termux testing, `EMAIL_VERIFICATION_REQUIRED=false` allows newly registered users to sign in without opening an email verification link. The application sets `email_verified_at` automatically for registrations in local/testing environments and does not send a verification message for those registrations.

The bypass is intentionally guarded in the application. If the environment is not `local` or `testing`, email verification remains required even when a mistakenly copied production environment variable says false. Render and other hosted deployments must keep `EMAIL_VERIFICATION_REQUIRED=true`.

The Termux launcher writes `EMAIL_VERIFICATION_REQUIRED=false` into the canonical `backend/dono-api/.env` before starting Laravel. Restarting the launcher after applying the release is required. Existing unverified accounts can also sign in while the local flag is active because the login gate is bypassed only in local/testing mode.

To restore verification locally, set `EMAIL_VERIFICATION_REQUIRED=true` in `backend/dono-api/.env`, run `php artisan optimize:clear`, and restart the launcher. Production should never use the local flag.
