# Live-room provider research — 25 August 2026

## LiveKit

Source: https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/

The LiveKit participant-management documentation states that participants use a developer-provided identity and a server-generated SID. Backend room management can list participants, get participant details, update permissions/metadata, and forcibly remove participants. The documentation states that removing a participant disconnects them and, on LiveKit Cloud, immediately revokes their access token. Participant management requires the room administration grant. LiveKit server APIs can be initialized with a host, API key, and secret.

Source: https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events/

LiveKit documents server-side webhooks for room and participant events, including room started/finished, participant joined/left, connection aborts, track publication, and egress lifecycle. Webhook requests contain JSON and an Authorization header with a signed JWT containing a hash of the payload. The provider documentation says the backend must validate the raw body and authorization header using provider SDK receiver logic. The documentation also warns that webhook delivery is not guaranteed and may be retried, so idempotent event handling is required.

## Daily

Source: https://docs.daily.co/reference/rest-api/meeting-tokens

Daily documents server-created meeting tokens that control room access, time limits, participant identity, permissions, and features. The documentation warns that every token should include a room name because a token without a room name can grant access to any room in the domain. It also states that meeting tokens should be generated server-side and are signed but not encrypted, so sensitive information should not be put inside them.

## Agora

Source: https://docs.agora.io/en/realtime-media/rtc/build/optimize-and-operate/receive-notifications

Agora documents HTTPS callbacks for RTC channel events and requires signature verification using the configured signing secret. The documentation states that callbacks can be duplicated or arrive out of order, and recommends sequence handling, idempotent processing, signature validation, and quick HTTP responses. It also describes participant online-status tracking and event retries.

## Decision for DOONO

The most natural provider adapter candidate for the existing Laravel room model is LiveKit because its documented server APIs directly cover participant admission/removal and its webhook events map to the room and participant lifecycle already modeled in DOONO. This is only a technical fit assessment, not a purchase or deployment claim. A production implementation still needs a provider account, server-side credentials, a client SDK, signed token issuance, webhook signature validation, idempotent event storage, recording/retention policy, school safeguarding approval, and live deployment testing.

## LiveKit token and room-management contract

Source: https://docs.livekit.io/frontends/reference/tokens-grants/

LiveKit access tokens are JWTs signed with the API secret. The documented token payload includes an opaque participant identity, expiration, issuer, subject, and a `video` grant. A room-join grant includes `room`, `roomJoin`, `canSubscribe`, `canPublish`, and related permissions. The documentation explicitly warns not to put personally identifiable information in participant identity or room names because those values appear in infrastructure logs; DOONO must therefore use opaque room and participant identifiers. The documentation also states that removed participants on LiveKit Cloud have their token revoked, while self-hosted deployments require short token TTLs and careful reissuance policy.

Source: https://docs.livekit.io/intro/basics/rooms-participants-tracks/rooms/

LiveKit documents server-side room creation with a room name, empty timeout, and maximum participant count. Rooms can also be created when the first participant joins. The server API can list and delete rooms, and deleting a room disconnects participants. DOONO should create provider rooms only after its own room approval and use an opaque provider room identifier generated server-side.

Implementation implication: the next provider adapter must issue short-lived opaque join tokens only after DOONO admission, never expose the API secret or PII, map provider webhook identities back to `live_room_participants`, and treat provider webhooks as retryable/idempotent events. The current repository remains provider-neutral until a vetted adapter and frontend SDK are configured.

## LiveKit room-service API contract

Source: https://docs.livekit.io/reference/other/roomservice-api/

LiveKit’s official room-service API is exposed through Twirp POST endpoints under `/twirp/livekit.RoomService/<MethodName>`, with JSON request bodies and a signed Bearer access token. `CreateRoom` requires the `roomCreate` permission and accepts an opaque room name, empty timeout, departure timeout, maximum participants, and optional metadata. `DeleteRoom` also requires room-create permission and disconnects all participants. `RemoveParticipant` requires room-admin permission and accepts room plus opaque participant identity; on LiveKit Cloud it also revokes the participant’s current access token. The API documentation states that server SDKs normally construct the authorization token, but a custom client can use the same signed-token contract.

Implementation implication: a Laravel adapter may call the Twirp endpoints with a server-issued admin token, but it must not send provider secrets to the browser. Provider room creation should happen only after DOONO approval, max participants should mirror the DOONO room limit, provider delete/close should be idempotent, and remove-participant failures should be handled without losing the DOONO moderation record.
