# DOONO Contextual Guide Upgrade

**Date:** 23 August 2026

The guide has been upgraded from a short module summary into a contextual instructor for the active role and current workspace.

## User-facing behavior

When a user clicks a real button, link, or role button outside the guide launcher, DOONO opens a contextual explanation for that control. The explanation states what the control means, how to use it, why it helps the active role, what happens after activation, and who is allowed to use it. Unknown controls receive a safe workflow explanation based on the current page, role, permission, and school context.

The page guide now explains the workspace purpose, why the feature matters, what must be prepared first, important fields and their meaning, available control behavior, expected success signals, next workflow, common mistakes, and support escalation. Support Centre exposes the same material as searchable articles rather than limiting the visible library to a small subset.

## Student ID-card workflow

The guide now explains the Student ID Card action specifically. It tells authorized users to confirm the active student, school, admission number, class, stream, and active status; generate the PDF once; inspect the school name, learner name, admission number, class, stream, validity statement, and layout; print or share it safely; and regenerate it when the learner’s identity or enrollment changes. It also explains that an ID card is not a fee receipt or an academic transcript, and that generation is recorded in the school audit trail.

## Security and role boundaries

The guide uses the canonical role helper and does not grant permissions. Backend authorization, school scoping, approval rules, and official-document checks remain authoritative. The automatic explanation listener excludes the guide itself and the launcher to avoid recursive dialogs. Input fields are explained through the page’s field guide rather than opening a popup on every keystroke.

## Validation evidence

The frontend build passed with 274 transformed modules. The architecture guard passed, the guide registry syntax passed, no legacy frontend role-detection pattern was found, and `git diff --check` passed. The bundle-size message remains a build warning only.

