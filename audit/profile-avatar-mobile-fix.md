# Profile Avatar and Mobile Drawer Fix

## Observed failure

The profile update endpoint returned success and the authenticated context refreshed, but the browser rendered a broken image in both My Profile and the Navbar. This indicates the upload path was persisted while the generated browser URL was not reachable from the phone. The likely local/tunnel case is a backend `APP_URL` of `localhost` or a root-relative `/storage/...` URL served by a missing storage symlink.

## Applied repairs

The canonical frontend Axios service now exposes `resolveMediaUrl()`. It maps backend-generated localhost URLs to the configured API origin and maps root-relative `/storage/...` paths to the API origin when the frontend and backend are on different origins. Profile Settings uses this resolver for its saved preview, and the Navbar uses it for the authenticated avatar. Both locations now fall back to initials when an image request fails, so a broken asset cannot remain visible as a broken-image icon.

The authenticated shell now hides ScrollNavigator and DONOGuide while the mobile navigation drawer is open. The drawer uses dynamic viewport height (`100dvh`) and safe-area bottom padding so its menu remains usable on modern phones and does not compete with the fixed footer or bottom controls.

## Deployment requirement

For local filesystem media, the Laravel backend must have `FILESYSTEM_DISK=public`, a correct `APP_URL` for the backend origin, and `php artisan storage:link` run once in the deployed environment. For Railway persistence across deployments, S3-compatible storage remains recommended. The frontend resolver reduces the impact of a stale localhost `APP_URL` during tunnel testing, but it cannot make ephemeral local disk persistent across a new Railway deployment.

## Validation

The frontend production build passed after the changes. Whitespace validation passed. The changed frontend contracts were checked in the built bundle, including media URL normalization, avatar fallback, drawer visibility coordination, dynamic viewport height, and safe-area padding.

## Follow-up correction

The second reproduction showed that the profile form could report success while still showing the selected file and a checked removal control. The profile request was being sent as FormData while the canonical Axios client retained the default JSON content type; Laravel can then fail to parse the uploaded file even though the request handler completes. The client now removes `Content-Type` for every FormData request so the browser supplies the multipart boundary. The profile page now rejects a success state when the refreshed canonical context has no `avatar_url` after an upload, resets the file input after a confirmed save, and only renders the removal checkbox when a persisted avatar exists and no replacement file is selected.
