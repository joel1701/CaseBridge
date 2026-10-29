# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are regulatory bureau officers (OFFICER), bureau heads (BUREAU_HEAD), and oversight administrators (ADMIN) across independent educational regulatory bodies (specifically AICTE's Public Grievance Redressal Cell [PGRC] and Regional Bureau [RB]). Secondary intended users are legal-aid caseworkers and community intake teams triaging high-volume, emotionally distressed complaints from students, parents, and faculty. They use Setu when an intake arrives to extract facts, uncover evidentiary gaps, and check for sister-bureau overlap before initiating costly or redundant institutional investigations.

## Product Purpose

Setu transforms unstructured complaint narratives into organized, reviewable case records while providing explainable cross-bureau matching and an Action Firewall against duplicate regulatory notices. The product exists to prevent conflicting inspections and repeated evidence burdens on complainants, ensuring that officers spot critical deadlines and missing facts while preserving complete bureau jurisdiction and human decision authority. Success means faster, fairer intake triage, zero duplicate notices dispatched to institutions, and fully transparent human sign-offs.

## Positioning

Unlike generic case management software or black-box AI classifiers, Setu links related complaints across independent regulatory silos without forcing records to merge, transfer ownership, or overwrite original complaint IDs. Its Action Firewall previews proposed actions across bureaus to recommend coordination, explicitly surfacing what evidence is missing rather than hallucinating answers or attempting automated legal determinations.

## Operating Context

Used in government and legal-aid desktop casework environments during complaint registration, case review, and pre-action notice drafting. Caseworkers evaluate dense multi-page transcripts, scanned receipts, and handwritten grievances alongside statutory category rules (Fees, Faculty, Infrastructure, Academic). Work occurs under formal administrative guidelines where cross-bureau access must be an intentional, audited policy rather than an ambient default.

## Capabilities and Constraints

Capabilities today:

- Verbatim narrative intake preservation with cryptographic immutability.
- Structured parameter extraction: statutory category, timeline dates, disputed financial amounts, and respondent institution entities.
- Evidentiary gap surfacing: explicit identification of missing receipts, unverified circulars, and absent documentation.
- Explainable multi-signal matching: institution identity, category alignment, and calibrated semantic text similarity.
- Action Firewall: pre-issuance warning system detecting overlapping inspections or evidence demands across sister bureaus.
- Multi-bureau knowledge graph mapping relationships between complaints, institutions, and actions.
- Public editorial landing page communicating platform capabilities and routing caseworkers to internal workspaces.

Technical constraints & current phase:

- Foundation prototype: browser shell, route layout, health checks, mock adapters (`VITE_USE_MOCKS=true`), and synthetic fixtures are active.
- Real API endpoints currently return 501 placeholders until backend modules are connected.
- Zero automated sanctions: Setu outputs are assistive drafts; all determinations require an authorized human officer.
- Role-scoped tenant isolation between PGRC and RB bureaus.

## Brand Commitments

- Name: Setu (Team Aarohan · SIH26264).
- Voice & Tone: Editorial, authoritative, calm, precise, objective, and human-centered. Avoids generic SaaS hype, hyperbole, or excessive decorative flourishes.
- Primary Surfaces: Clean white (`#FFFFFF`) and calm slate backgrounds (`#F8FAFC`, `#F1F5F9`).
- Primary Text: Deep slate ink (`#0F172A`) for effortless legibility.
- Highlight Accents: Deep Blue (`#1D4ED8` / `#1E40AF`) for primary interactions; Warm Amber (`#D97706`) for missing evidence gaps; Fresh Emerald (`#059669`) for verified records; Clean Sky (`#0284C7`) for cross-bureau signals.
- Typography: Beautiful modern sans-serif typography throughout (`Plus Jakarta Sans` for headings, `Inter` for body); clean monospace strictly for case IDs and references (`JetBrains Mono`). Absolutely no serif fonts.

## Evidence on Hand

- Synthetic Fixture Callset: 10 synthetic institutions (`data/sample_institutions.csv`), 25 categorized complaints (`data/sample_complaints.csv`), and mock actions (`data/sample_actions.json`).
- Benchmark Scenarios: 5 documented evaluation scenarios (`data/demo_scenarios.json`) testing explainable fees linking, false positive rejection, duplicate evidence warnings, staffing notice coordination, and cross-institution text similarity guards.
- Specifications & Architecture: Complete contracts in `docs/PROJECT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, and `docs/DEMO_SCENARIOS.md`.
- Unfinished / Not on hand: Live production bureau databases, automated court filing integrations, and client biometric evidence storage are excluded by design.

## Product Principles

1. Verbatim Integrity: The original narrative is never truncated, altered, or overwritten; all extracted fields link back to verbatim citations.
2. Transparent Uncertainty: When evidence or dates are missing, explicitly highlight the absence rather than guessing or inferring certainty.
3. Sovereign Bureau Ownership: Cross-bureau matching establishes an advisory relationship; complaints are never merged and bureau jurisdictional IDs remain sovereign.
4. Human-in-the-Loop Governance: Algorithms propose explanations and warn of conflicts; only an authorized human officer can confirm relationships or authorize notices.

## Accessibility & Inclusion

- WCAG 2.1/2.2 AA compliant contrast on all surfaces (near-black `#171717` on warm cream `#FFFCF0` and white `#FFFFFF`).
- Full keyboard navigation with visible focus rings (`focus-visible:ring-2`).
- Responsive layouts across mobile (320px+), tablet, and desktop viewports without horizontal overflow.
- Strict `prefers-reduced-motion` compliance across all transitions and animations.
- Screen-reader accessible landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), ARIA expanded controls, and descriptive alternate labels on vector graphics.
