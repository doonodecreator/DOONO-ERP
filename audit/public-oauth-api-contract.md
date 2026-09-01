# DOONO De Creator ERP — Public OAuth API Contract

**Contract date:** 23 August 2026

## Authentication boundary

DOONO uses Sanctum for first-party browser and mobile sessions. Passport client-credentials is reserved for confidential, school-owned server integrations. An OAuth client is created by a Proprietor inside an active school context, receives only the selected scopes, and must keep its secret in a server-side secret manager. The client secret is displayed once and is never returned by list or revoke endpoints.

Every successful OAuth request is bound to the school stored on the authenticated client. Public integration handlers do not accept a caller-supplied school identifier as an authority boundary. A revoked, expired, or schoolless client is rejected before the controller executes.

## Current scopes

| Scope | Capability |
|---|---|
| `school.read` | Read the public school profile for the client’s school. |
| `students.read` | Read active student directory summaries for the client’s school. |
| `fees.read` | Read paginated student-fee summaries for the client’s school. |
| `fees.write` | Record a verified fee payment against an existing school-owned invoice. |
| `attendance.write` | Synchronize a class attendance register for the client’s school. |

The public API does not provide browser login, user delegation, arbitrary school selection, or cross-school access.

## Fee-payment write contract

`POST /api/v1/oauth/integration/fee-payments` requires the `fees.write` scope and an `Idempotency-Key`. The request must include an existing `student_fee_id`, a positive `amount_paid`, a supported payment method, a stable non-empty `transaction_reference`, and optionally a payment date, bank name, or remarks.

The server verifies that the invoice belongs to the OAuth client’s school, locks the invoice during settlement, rejects amounts above the current outstanding balance, creates the normal official receipt, recalculates invoice status, and writes a school audit event. A unique database constraint on non-null transaction references closes the concurrent duplicate-reference race. The response is never a claim that an external bank or gateway has settled money; it records a payment submitted by the authorized integration.

## Attendance write contract

`POST /api/v1/oauth/integration/attendance` requires the `attendance.write` scope and an `Idempotency-Key`. The server verifies the active staff attribution, school/session/term ownership, enrollment ownership, and one-class-per-request rule before delegating to the existing attendance service. Stale updates receive the existing conflict response rather than silently overwriting newer records.

## Operational requirements

Production OAuth requires Composer dependencies, persistent Passport keys, HTTPS, short token lifetimes, rate limiting, secret rotation, client revocation procedures, and database-backed integration tests. OAuth is disabled explicitly with `OAUTH_ENABLED=false` when the deployment is not ready; this does not disable Sanctum or first-party application access.

## Non-goals

This contract does not authorize arbitrary plugin execution, authorization-code login, user impersonation, cross-school data, unverified payment settlement, or unrestricted write access to students, fees, results, or staff records.

