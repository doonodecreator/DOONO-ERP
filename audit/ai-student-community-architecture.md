# DOONO AI and Student Community Architecture

## Product direction

DOONO should add a **school-safe learning network**, not an unrestricted social network. The central product is a contextual AI tutor and moderated student collaboration layer that is connected to the existing school, enrollment, portal, communication, and audit systems.

The platform must treat students as protected learners. A student account can participate only when it is authenticated, linked to one active student record, attached to an Active enrollment in the current school, and allowed by the school’s feature controls. Search and discovery must not expose private student identity, email addresses, phone numbers, home addresses, class rosters, medical information, fees, or unpublished results.

## Viable product approaches

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| School-safe AI plus moderated community, recorded video, and provider-backed live rooms | Best experience and future growth. Requires an AI provider, private media storage, moderation operations, and a realtime video provider for live rooms. | Medium to high, depending on AI, storage, bandwidth, and live-video usage. | High, because authorization, consent, moderation, media processing, and provider callbacks must all be configured. |
| School-safe AI tutor plus moderated text/project exchange and asynchronous video only | Faster and less expensive. Students can learn, publish approved work, comment, report, and collaborate across approved projects, but there are no live rooms initially. | Low to medium, mainly AI tokens, storage, and bandwidth. | Medium, with no realtime provider or always-on media service required. |

DOONO should implement the second approach as the first release foundation, while defining a provider adapter for live rooms. Live video should be enabled only after the school has configured a compliant provider and the platform can verify room admission, host controls, recording policy, reporting, and participant removal.

## AI tutor

The AI tutor is server-side only. The browser never receives an AI API key. Every request is attached to the authenticated user, active school, role, and conversation. A student tutor can explain lessons, quiz the learner, summarize assigned work, translate educational text, and point the learner to published school resources. It must not invent grades, change results, approve submissions, provide medical or legal decisions, or reveal another learner’s data.

The first model routing policy uses a lower-cost fast model for ordinary student tutoring and a stronger model only for authorized educator planning or difficult structured work. Model IDs and prices must be discovered from the configured provider rather than hardcoded as a platform guarantee. If no provider is configured, the UI must show a clear configuration state instead of pretending that an answer was generated.

AI conversations need school-scoped persistence, message limits, rate limiting, usage accounting, deletion controls, and an audit event that records the action without copying sensitive message text into the audit log. AI output is advisory and must be checked by a teacher when it affects academic decisions.

## Student community

The first community slice is school-scoped moderated posts, comments, project rooms, reports, blocks, and teacher or school moderator review. Direct private messaging between students is intentionally not part of the first release because it increases safeguarding, harassment, grooming, impersonation, and evidence-retention risk.

Posts start as Pending and become visible only after the configured moderation workflow approves them. A student can edit or withdraw their own pending or approved post, report another post or comment, and block another participant. Moderators can approve, reject, take down, or restrict content, with school-scoped audit history. Students see display names or school-safe aliases rather than contact details.

Cross-school and international collaboration is a curated exchange of approved projects, not unrestricted discovery of student profiles. A school must opt in, a project must be approved, and student participation must use a protected project space. Direct contact details remain hidden; communication occurs through moderated project posts and teacher-supervised rooms.

## Video publishing

Video uploads use private storage, server-side MIME and size validation, malware scanning where configured, a moderation state, and short-lived authorized playback/download URLs. An upload is never public merely because it succeeded. The initial release supports asynchronous video submissions and playback after approval. Transcoding, thumbnails, caption extraction, content classification, and abuse detection run as background jobs or through a configured media provider; these are not claimed as available when the deployment has no worker or provider.

Video permissions are separate from general text posting. For minors, school approval and configured guardian consent are required before video publishing or international exchange is enabled. Parent and student portals must remain school- and relationship-scoped.

## Live rooms

A live room record is created in DOONO with a school, host, schedule, audience, approval state, and provider room identifier. Laravel authorizes room creation and participant admission; the media provider carries the audio/video stream. A student can join only after the server confirms active enrollment, audience membership, consent requirements, room status, and any suspension or report restrictions.

A production live-room integration must include host moderation, waiting room or admission controls, participant removal, room closure, abuse reporting, recording consent, retention rules, and provider webhook verification. Until those controls are configured and tested, DOONO should expose scheduled collaboration spaces or asynchronous project exchange rather than an unrestricted “go live with everyone” button.

## Non-negotiable security and safety rules

School tenancy remains enforced through `CurrentContextService`. Parent and student portals can access only linked records. Feature flags control rollout but never replace backend permissions. Every moderation, consent, publication, withdrawal, live-room admission, and provider callback action is auditable without leaking private content into the audit message. Rate limits, upload quotas, report queues, retention rules, and emergency takedown controls are required for production use.

A local source build can implement the data model, moderation workflow, authorization, and asynchronous upload path. It cannot prove provider delivery, global low-latency live video, automated moderation accuracy, international legal compliance, or extreme-scale behavior without the corresponding deployed infrastructure and tests.
