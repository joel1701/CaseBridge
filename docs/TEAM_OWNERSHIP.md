# Team ownership and integration

## Joel — Lead Backend / AI Intelligence

Owns `apps/api/src/modules/{matching,action-firewall,case-links,coordination,graph}/` and all of `apps/ai/`.

Responsible for semantic matching, model integration, explainable relationships, Action Firewall, cross-bureau coordination intelligence, graph APIs, algorithm tests and evaluation. Joel owns the harder backend responsibilities. Start with candidate retrieval constrained by institution, fixture evaluation against labelled pairs, then redacted link responses. Avoid treating text cosine similarity as a complete matching score.

## Vishwak — Backend / Database

Owns `apps/api/prisma/`, `apps/api/src/modules/{auth,complaints,institutions,bureaus,alerts,reports,case-history}/` and backend middleware.

Responsible for PostgreSQL, Prisma, authentication/RBAC, complaint CRUD, institution management, bureau workflows, reports, alerts, history and seeding. Start with login/me/logout and negative bureau-access tests, then complaint list/create/details. Dashboard summary is in the reports module. Shared backend libraries and route registration require coordination with Joel.

## Pritika — Lead Frontend / Investigation Experience

Owns `apps/web/src/app/`, `apps/web/src/components/layout/` and `apps/web/src/features/{dashboard,investigations,graph,matching,coordination}/`.

Responsible for architecture/routing, main dashboard, investigation workspace, graph, AI explanations, Action Firewall UI and intelligence API integration. Alerts placeholder lives in dashboard. Action Firewall UI belongs in investigations. Pritika owns the harder frontend responsibilities. Start with the investigation shell and typed intelligence states, then graph adapter and review interactions.

## Kevin — Frontend / Complaint Management

Owns `apps/web/src/features/{auth,complaints,institutions,bureau-queue,reports}/`.

Responsible for login UI, complaint registration/list/filtering, institution profiles, bureau work queues, reports/analytics and operational API integration. Start with complaint list and form using explicit mock adapters, then connect authentication once Vishwak's contract is tested.

## Shared files and collaboration

- Initial foundation configuration is shared. Future changes to root package/lock/config, environments, CI and deployment settings require affected owners' review. Joel coordinates backend/AI changes; Pritika coordinates frontend changes.
- Pritika coordinates `components/ui`, `shared/api`, `shared/types`, `shared/utils` and styles with Kevin. Vishwak coordinates schema/migrations with Joel. Joel coordinates labelled data and demo scenarios with all members.
- Branches: `feat/joel-matching`, `feat/vishwak-auth`, `feat/pritika-investigation`, `feat/kevin-complaints`; use `fix/<owner>-<topic>` for fixes.
- One focused branch/PR per feature. No direct pushes to main. Pull main before starting; resolve conflicts with the owner rather than overwriting their work.
- Update API contracts before changing response fields; agree with consuming frontend/backend owner. Never silently change mock structures or replace API failures with mocks.
- Commit lockfile changes with dependency updates. Do not edit generated Prisma files. Include migrations for schema changes and regenerate the client after pulling.
- PR checks: lint, typecheck, build, API tests; AI tests for AI changes; database-backed integration tests for DB changes. Include screenshots for UI changes and access-denial tests for protected routes.
- No teammate GitHub handles were supplied, so CODEOWNERS and remote/branch protection are not invented. Add these after the repository URL and handles are known.
