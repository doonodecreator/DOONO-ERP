# DONO Dashboard Architecture Release

This working-tree release aligns the twenty architecture dashboards with school-scoped frontend destinations, backend routes, and role permissions. It also adds the missing assignment workspace, completes the school-staff role catalog, repairs transport and hostel payload contracts, adds portal-safe report-card downloads, and connects Proprietor subscription upgrades to Paystack checkout and verification.

## Database migrations

Run all pending migrations with `php artisan migrate --force`. The release includes the existing school-setup and Principal permission migrations plus architecture-role seeding, Vice Principal Administration event/facility permissions, and Teacher/Form Teacher assignment permissions.

## Frontend verification

The Vite production build completed successfully in the sandbox. The remaining PHP syntax and Laravel route checks must be run in Termux or Railway because PHP is not installed in the sandbox.

## Payment behavior

Proprietor checkout resolves the active school through `CurrentContextService`, accepts a selected plan and billing cycle, records a pending transaction before activation, prevents duplicate pending checkouts, verifies the Paystack amount, activates only after successful verification or a valid webhook, and returns to `/subscription-payment` for authenticated verification.

## Invitation behavior

The role selector is sourced from the database catalog and excludes only platform ownership and portal identities from the staff invitation workflow. It now includes the architecture’s school staff roles and operational “others” roles after migration. Principal and Proprietor invitations are guarded by the school-scoped `assign_roles` permission; setup delegation remains Proprietor-only.

## Important deployment rule

Do not push automatically. Apply and test the package locally first. After deployment to Railway, run `php artisan migrate --force` before testing role permissions or payment checkout.
