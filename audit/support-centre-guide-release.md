# DOONO De Creator ERP Support Centre and Guide Release

## Purpose

This release changes the in-product guide from a short tour into a clearer learning and recovery surface and adds a tracked Support Centre. The user can search role and module help, see prerequisites and expected outcomes, submit a support request, follow replies, and retain a reference number.

## Support request visibility

Non-platform users see only tickets in their active school. An organization owner outside a selected school sees organization-level requests. A user without a school or organization sees only requests they created. The Software Owner can view all tickets and change status. Replies and status changes are logged through the existing activity-log service with the active school explicitly recorded.

Support routes are available to authenticated users before the school-module staff and subscription gates so suspended accounts can still ask for account recovery help:

- `GET /api/v1/support-tickets`
- `POST /api/v1/support-tickets`
- `GET /api/v1/support-tickets/{supportTicket}`
- `POST /api/v1/support-tickets/{supportTicket}/replies`
- `PATCH /api/v1/support-tickets/{supportTicket}/status` (Software Owner only)

## Guide behavior

The Support Centre uses the current role helper and existing `guideKnowledge.js` source. It presents role-specific onboarding, module explanations, searchable steps, prerequisites, completion checks, recovery instructions, and a Support Centre escalation path. The global Guide dialog also displays `Before you start`, `When you finish`, and `If you are blocked` guidance.

## Database

The release adds `support_tickets` and `support_ticket_messages`. Run the normal forward migration command in the target environment. Do not run `migrate:fresh` against a live school database.

## Validation

PHP lint, support route discovery, the Laravel test suite, the Vite production build, and `git diff --check` passed. The current suite reports 12 tests and 16 assertions. The Vite large-chunk warning remains a performance optimization item, not a build failure.

## Safe rollout

1. Back up the production database.
2. Apply the release files.
3. Run `php artisan migrate --force`.
4. Run `php artisan optimize:clear`.
5. Rebuild or redeploy the frontend.
6. Test as a teacher, parent, proprietor, organization owner, and Software Owner.
7. Confirm that a school user cannot open another school’s ticket by changing the ticket ID.
8. Confirm that the Software Owner can respond and change status.
9. Confirm that users never submit passwords, one-time codes, or complete payment-card details in a ticket.
