# Provider and infrastructure findings — 23 August 2026

## OAuth

Laravel’s official documentation distinguishes Passport from Sanctum. Passport provides a full OAuth2 server implementation, including authorization-code, PKCE, client-credentials, token, scope, and revocation workflows. Sanctum is intended for first-party SPAs, mobile applications, and simple token APIs and does not provide OAuth2. The current DOONO application uses Sanctum tokens for its first-party React client, so adding Passport must be additive: Passport should authenticate explicitly registered third-party OAuth clients while Sanctum remains the first-party browser/mobile path. Passport installation also adds OAuth client/token migrations and signing keys that must be generated and stored as deployment secrets. [1] [2]

## Paystack webhooks

Paystack’s official documentation states that webhook requests should be acknowledged with HTTP 200, should be verified with an HMAC-SHA512 signature over the event payload using the secret key, and should be processed quickly so retries do not result from long-running work. Paystack retries failed live deliveries for 72 hours and exposes payment, refund, dispute, subscription, and transfer event types. Existing DOONO payment event persistence should therefore remain append-only and idempotent, with signature verification before state changes and queued work after acknowledgment. [3]

## SMS

Twilio’s official Messaging API uses HTTPS and supports outbound messages through the Messages resource. Its documentation recommends API-key-based authentication for production and identifies status tracking and delivery limitations. A DOONO adapter can be implemented server-side with credentials held only in environment secrets, but successful API acceptance must be represented as `queued` or `provider_accepted`, not as carrier delivery. Final delivery requires status callbacks and a verified callback endpoint. [4] [5]

## Push notifications

Firebase Cloud Messaging HTTP v1 sends messages to device registration tokens, topics, conditions, or Firebase Installation IDs. Requests require a short-lived OAuth 2.0 access token derived from a service account or application default credentials; a service-account JSON key must remain outside source control. A DOONO adapter can enqueue FCM messages server-side, but device-token registration, token rotation, consent, invalid-token cleanup, and provider response states must be implemented before claiming push delivery. [6] [7]

## Backup boundary

Encrypted automated backups cannot be truthfully claimed without a selected persistent destination, encryption-key management, retention policy, restore verification, and deployment-level scheduling. The DOONO source archive is not a database or media backup. A safe implementation can provide a server-side backup command and manifest contract that fails closed unless an encrypted destination and key are configured; production success still requires a provider-specific storage and restore drill.

## References

[1]: https://laravel.com/docs/13.x/passport "Laravel Passport 13.x documentation"
[2]: https://laravel.com/docs/13.x/sanctum "Laravel Sanctum 13.x documentation"
[3]: https://paystack.com/docs/payments/webhooks/ "Paystack Webhooks documentation"
[4]: https://www.twilio.com/docs/messaging/api "Twilio Messaging API Overview"
[5]: https://www.twilio.com/docs/messaging/tutorials/how-to-send-sms-messages "Twilio Send SMS tutorial"
[6]: https://firebase.google.com/docs/cloud-messaging/send/v1-api "Firebase Cloud Messaging HTTP v1"
[7]: https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages "Firebase Cloud Messaging REST reference"
