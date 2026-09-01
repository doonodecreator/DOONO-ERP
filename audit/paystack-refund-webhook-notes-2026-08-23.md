# Paystack refund and webhook verification

**Checked:** 23 August 2026.

The official Paystack Refund API documents `POST /refund` with a transaction reference or ID, an optional amount in the transaction currency's subunit, and optional customer and merchant notes. The response may queue the refund for processing and exposes a refund status. The documented retry path is `POST /refund/retry_with_customer_details/{id}` for a refund in a needs-attention state.

The official Paystack Webhooks documentation states that webhook requests carry an `x-paystack-signature` header containing an HMAC-SHA512 signature of the raw event payload signed with the secret key. The application must validate this signature before processing and return HTTP 200 after handling or acknowledging the event. The documentation also lists IP whitelisting as an additional control.

Sources:

- https://paystack.com/docs/api/refund/ — Refund API, accessed 23 August 2026.
- https://paystack.com/docs/payments/webhooks/ — Webhooks, accessed 23 August 2026.

Implementation implication: any gateway refund feature must remain Software Owner-only, record an internal immutable request/audit trail, never mark a payment refunded before Paystack confirms or queues it, and handle refund webhook/status updates idempotently. No gateway refund code has been claimed complete until these controls are implemented and validated.
