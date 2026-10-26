# Product specification

## Scope and actors

MVP is an internal officer tool for institution-related complaints handled by authorized AICTE bureaus. Actors are OFFICER, BUREAU_HEAD and ADMIN. No public student portal, legal decision automation or production evidence upload system is included in this foundation.

OFFICER handles assigned-bureau complaints and proposes actions. BUREAU_HEAD reviews suggested relationships and records coordination for their bureau. ADMIN manages access and explicitly authorized organization-wide oversight. Cross-bureau visibility must be an intentional, audited policy, not a side effect of logging in.

## User journeys

1. Officer signs in, sees a bureau-scoped queue, creates/imports a complaint, retains its external reference and records status/history.
2. Analysis finds candidate related complaints. Authorized reviewers see an explanation with institution/category/context and calibrated semantic contribution, then confirm or reject. Linking never merges complaints or transfers ownership.
3. Before an action, the officer previews overlapping actions. Warnings suggest evidence reuse or joint work. The final creation rechecks current state; a preview is not permanent permission.
4. Bureau heads coordinate a confirmed relationship and record rationale. Status changes remain independent for each complaint.
5. Authorized officers inspect an institution graph and timeline without retrieving private details from another bureau.

## MVP and advanced scope

MVP: authentication, role/bureau access, complaints and institutions, operational queues, status history, alerts and summary reports. Advanced intelligence: explainable matching, Action Firewall and graph. Institutional Pattern Radar is optional future work. External ingestion, real evidence storage and automatic dispositions are excluded.

## Acceptance criteria

Foundation: clean install, generated Prisma Client without DB connection, web/API start together, separate AI start, health endpoints independent of model/DB, responsive navigable owner-labelled pages, explicit mock mode, synthetic fixtures, documented contracts and passing baseline checks.

Product work to come: all private queries enforce bureau policy; invalid data gets predictable errors; duplicate original references are rejected; lifecycle and overlap review remain independent; links preserve IDs/owners; users explicitly review suggestions; action preview warns without making legal decisions; action writes recheck and audit; graphs cannot leak restricted vertices; algorithm evaluation includes unrelated cases at the same institution and similar wording across different institutions.

## AI boundaries

Fixture hashing is deterministic test plumbing, not semantic intelligence. A real embedding model is only one feature signal. Report evaluated thresholds and model version; avoid presenting cosine similarity as a probability. Decisions remain with authorized officers. Synthetic labels are held-out evaluation expectations, not production evidence.
