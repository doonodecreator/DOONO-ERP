# Branding, Report-Card, and Profile Completion Plan

## Scope for this implementation

The first completion tranche will wire the already-existing branding schema and add the missing profile-media path without replacing the authoritative result-computation pipeline. It will include school logo/report-card logo, principal signature, school stamp, colors, theme/layout, custom header/footer, watermark controls, report-card display configuration, authenticated user avatar, student photo, and staff/teacher photo support.

## Storage design

All uploaded images will be validated as images with a bounded size and stored through Laravel’s configured filesystem disk under tenant-specific directories. The database will retain only relative storage paths. A small media URL helper will preserve existing absolute URLs, turn stored paths into public URLs, and keep storage concerns out of resources and React pages. Local testing will use the existing public disk and `storage:link`; deployments can switch `FILESYSTEM_DISK` to S3-compatible storage without changing API payloads.

## Authorization design

School branding and report-card presentation settings will require an active school and proprietor/owning organization-owner authority. Platform branding will remain super-admin-only. Authenticated users may update only their own avatar and basic profile fields. Student and staff photos will remain subject to their existing school-scoped management permissions. Every controller will resolve school context through `CurrentContextService`.

## API design

Add an authenticated `GET/PUT /me/profile` contract for the current user, including avatar upload through multipart requests. Extend school show/update responses with branding data and accept multipart branding updates through the existing school update endpoint or a dedicated school-branding endpoint; the dedicated endpoint is preferred to keep base-school updates and file handling explicit. Add a school-scoped `GET/PUT /school-report-card-settings` contract that reads/writes the authoritative `academic_configurations` row and the branding presentation fields together. Expose report-card settings to the PDF payload and preview response.

Extend student/staff update contracts to accept validated photo uploads while preserving all existing tenant and employment restrictions. Resources will return normalized `photo_url`/`avatar_url` fields while retaining the original path fields for compatibility.

## Report-card design

Create the missing `resources/views/pdf/report-card.blade.php` using the existing receipt Blade/DomPDF pattern. The template will support the school identity header, logo, motto/contact data, configurable colors/theme/layout, student photo, scores/grades/position, attendance, comments, promotion status, signature, stamp, watermark, and custom header/footer. The existing result payload remains the source of computed academic values.

## Frontend design

Add a shared `ProfileSettings` page reachable from the authenticated user shell. Extend `Settings.jsx` with a proprietor-only School Branding and Report Card Design section, including image previews, color inputs, theme/layout selectors, visibility switches, custom header/footer, and a report-card preview/download action. The Navbar will render `avatar_url` when available and link to the profile page. Add photo upload controls to student/staff edit/create surfaces where the existing permissions allow them, with mobile-friendly previews and clear validation errors.

## Compatibility and migration safety

New migration files will be idempotent where the repository’s migration history has shown duplicate-column issues. Existing string paths and absolute URLs remain valid. No existing result, subscription, audit-log, or role boundary will be removed or weakened. All new writes will log school/platform actions through the existing audit service.
