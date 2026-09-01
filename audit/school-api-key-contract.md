# DOONO De Creator ERP — School Integration API Contract

**Status:** Implemented additive contract containing a limited read-only school API-key surface and a school-bound OAuth 2.0 client-credentials surface. The first-party React/mobile application continues to use Sanctum. This document does not claim authorization-code user consent, marketplace access, or unrestricted public write access.

## Authentication options

### School API key

A school Proprietor creates a key from **API Integrations**. The full bearer secret is shown once. DOONO stores only a SHA-256 hash, while the visible prefix, name, scopes, expiry, last-used time, and revocation time remain available for administration. If the secret is lost, revoke the key and issue a replacement.

Send the key as an HTTPS bearer token:

```text
Authorization: Bearer dono_sk_<secret>
```

### OAuth 2.0 client credentials

A school Proprietor creates a confidential OAuth client from **OAuth Clients**. DOONO stores the client secret as a one-way Passport hash and returns the secret only in the creation response. The secret must be stored by the approved integration’s server-side secret manager and must never be placed in a browser bundle, mobile application, repository, screenshot, or URL.

Request a short-lived access token from the backend’s OAuth endpoint. The endpoint is provided by Laravel Passport, which is the OAuth2 server layer; Sanctum remains the first-party SPA/mobile authentication layer. [1] [2]

```bash
curl --fail --silent --show-error \
  -X POST \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode 'client_id=REPLACE_WITH_CLIENT_ID' \
  --data-urlencode 'client_secret=REPLACE_WITH_CLIENT_SECRET' \
  --data-urlencode 'scope=school.read students.read' \
  'https://YOUR_DOONO_HOST/oauth/token'
```

Use the returned access token as:

```text
Authorization: Bearer <oauth_access_token>
```

OAuth clients are permanently bound to one school. The API never accepts a caller-supplied school ID to expand scope. Revoked clients and expired or invalid tokens are rejected. The client-credentials token is configured with a short lifetime; integrations must request another token after expiry.

## Available scopes

| Scope | Capability | Boundary |
|---|---|---|
| `school.read` | Read school profile | The OAuth client’s own school only |
| `students.read` | Read active student directory | The OAuth client’s own school only |
| `fees.read` | Read fee and invoice summaries | The OAuth client’s own school only |
| `attendance.write` | Synchronize attendance | Only validated active staff, session, term, class, and enrollment records in the OAuth client’s own school |

## Current API-key endpoints

| Method | Endpoint | Required scope | Response boundary |
|---|---|---|---|
| `GET` | `/api/v1/public/school` | `school.read` | The authenticated key’s own school profile only |
| `GET` | `/api/v1/public/students` | `students.read` | Active students in the authenticated key’s own school, paginated |
| `GET` | `/api/v1/public/student-fees` | `fees.read` | School-scoped fee/invoice summaries in the authenticated key’s own school, paginated |

## Current OAuth endpoints

The same resource reads are available under an OAuth-specific path:

| Method | Endpoint | Required scope | Response boundary |
|---|---|---|---|
| `GET` | `/api/v1/oauth/integration/school` | `school.read` | The OAuth client’s own school profile only |
| `GET` | `/api/v1/oauth/integration/students` | `students.read` | Active students in the OAuth client’s own school, paginated |
| `GET` | `/api/v1/oauth/integration/student-fees` | `fees.read` | Fee/invoice summaries in the OAuth client’s own school, paginated |
| `POST` | `/api/v1/oauth/integration/attendance` | `attendance.write` | Creates or corrects attendance only for the OAuth client’s own school |

The student directory returns the student ID, admission number, name, class, stream, and active status. The fee endpoint returns invoice number, student identity summary, amount, discount, amount due, total paid, due date, and fee status. Medical details, guardian details, credentials, examination answers, and private file paths are not returned.

## Attendance write contract

The attendance request must include `academic_session_id`, `term_id`, `attendance_date`, `recorded_by_staff_id`, and one or more records. Each record must contain a school-owned `student_enrollment_id`, a status of `Present`, `Absent`, `Late`, or `Excused`, and an optional remark. Every enrollment must belong to the specified school, session, term, and one class. The recording staff member must be active in that school.

Every attendance write must include a stable `Idempotency-Key`. DOONO scopes idempotency by OAuth client, HTTP method, path, and key. A replay returns the original successful response; a request currently being processed returns `409`; failed responses are not cached. The underlying attendance service uses a transaction, preserves correction history, and triggers existing absence notifications.

```bash
curl --fail --silent --show-error \
  -X POST \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <oauth_access_token>' \
  -H 'Idempotency-Key: attendance-2026-09-01-class-14' \
  -d '{
    "academic_session_id": 1,
    "term_id": 1,
    "attendance_date": "2026-09-01",
    "recorded_by_staff_id": 12,
    "records": [
      {"student_enrollment_id": 101, "status": "Present", "remarks": null},
      {"student_enrollment_id": 102, "status": "Absent", "remarks": "No notice received"}
    ]
  }' \
  'https://YOUR_DOONO_HOST/api/v1/oauth/integration/attendance'
```

## Security and operations

OAuth client management is restricted to a school Proprietor with the dedicated `manage_oauth_clients` permission. All management and integration-write actions are audit logged with the explicit school ID. Rate limiting is keyed by OAuth client identity where available. No OAuth response returns a client secret after creation.

The current OAuth contract intentionally does not expose arbitrary student, fee, result, payroll, medical, file, or administrative writes. It also does not implement authorization-code user consent, refresh tokens for these client-credentials clients, inbound webhooks, or cross-school aggregation. Those capabilities require separate privacy, consent, and operational contracts.

## References

[1]: https://laravel.com/docs/13.x/passport "Laravel Passport 13.x documentation"
[2]: https://laravel.com/docs/13.x/sanctum "Laravel Sanctum 13.x documentation"
