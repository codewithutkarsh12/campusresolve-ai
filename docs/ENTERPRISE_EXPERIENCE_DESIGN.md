# CampusResolve AI — Enterprise Experience Design

## Intent
Evolve the existing CampusResolve AI prototype into a clearer, more complete campus incident intelligence experience for facilities operators, campus administrators and reviewers. The product should help people understand incoming reports, assess urgency, review recurring patterns and verify resolutions without overstating what the prototype can guarantee.

## Goals
- Preserve the existing vanilla HTML/CSS/JavaScript architecture and all current workflows.
- Add clear About, FAQ, Help, Contact, Privacy and Terms information views.
- Add persistent Light, Dark and System appearance preferences.
- Improve navigation, content hierarchy, trust and responsive behavior.
- Keep AI output advisory, safety overrides deterministic, and human review explicit.
- Make demo-data, localStorage, optional Gemini and production-readiness limitations understandable.

## Non-goals
- No framework migration, database, authentication, roles, billing, messaging backend or third-party analytics.
- No claim that localStorage is shared, authoritative or tamper-resistant.
- No live contact submission, production privacy/legal certification or emergency-response functionality.
- No new runtime dependency or externally hosted font/icon dependency.

## Anti-goals
- Do not hide synthetic/demo labels.
- Do not present AI recommendations as decisions or confirmed root causes.
- Do not imply that a local audit timeline is an immutable audit log.
- Do not collect real student or sensitive incident information in this prototype.

## Approaches considered
1. **Enterprise Operations Console (selected):** preserve the forest-green identity, warm neutral surfaces, strong typography and scannable operational hierarchy. Add focused resource and trust pages without changing the core workspace. Best fit for facilities teams and accountable incident handling.
2. **Safety Command Center:** darker navy/teal, more dramatic alert surfaces and denser command-center presentation. Strong for a dedicated control room, but risks making a synthetic prototype appear more operationally authoritative than it is.
3. **Campus Service Hub:** lighter, warmer and more card-led with student-facing language. More approachable for broad campus audiences, but less aligned with the current operator-first incident workflow.

## Product structure
- Workspace: Overview, Incidents, AI triage, Recurring faults, Audit trail.
- Resources: How it works, About, FAQ, Help, Contact.
- Trust: Privacy, Terms.
- Appearance: Light, Dark and System modes, persisted locally and initialized from the system preference when no saved preference exists.

## Interaction and accessibility
- All navigation remains native keyboard-operable buttons.
- Active page is exposed through aria-current; mobile navigation updates aria-expanded.
- Theme selector has an accessible label and clear current value.
- FAQ uses native details/summary disclosure controls.
- Contact is explicitly a local demo feedback form; it validates input and explains that no message is transmitted.
- Dark mode must maintain readable contrast across app surfaces, tables, forms, banners, modals and supporting pages.
- Respect prefers-reduced-motion and visible keyboard focus.
- Keep existing IDs and JS hooks unless a change is required.

## Technical constraints
- Canonical frontend: index.html, styles.css, app.js, csv.js.
- Preserve script order: csv.js before app.js.
- Keep lib/client-bundle.js byte-for-byte synchronized with app.js.
- Preserve API contracts, CSP/security headers, HTML escaping, CSV formula-injection protection, request bounds, triage schema validation and deterministic safety override.
- Existing test commands: npm run lint; npm test; npm run test:browser.
- Real browser/device and screen-reader checks remain necessary beyond the DOM smoke harness.

## Data and privacy truth
- Incident and audit demo state is stored in the current browser's localStorage.
- The optional server-side Gemini route can send submitted report description and location to Google's Gemini service when configured.
- No authentication, server-enforced authorization, shared persistent incident store or tamper-resistant audit storage is implemented.
- Users must use synthetic data only.

## Success criteria
- All new resource/trust views are navigable and included in the page allow-list and breadcrumb labels.
- Light, dark and system preferences work and persist without changing incident data.
- Contact clearly discloses that the demo does not send messages.
- Existing incident, triage, recurrence, audit, CSV and workflow behavior remains intact.
- Wiring tests cover the new navigation, page sections, theme controls and bundle parity.
- Lint, unit tests and DOM/server smoke tests pass in CI.
- Deployment and real-browser visual verification are reported separately from automated tests.
