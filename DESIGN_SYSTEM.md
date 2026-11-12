# CampusResolve AI — Design System v2

## Product direction

A calm, trustworthy campus-operations workspace. The interface should communicate safety, accountability and clarity. It is an incident-intelligence prototype, not an emergency-response service or a production multi-user record system.

## Brand

- Primary identity: forest-green shield, campus-building geometry and a lime verification mark.
- Primary palette: deep forest green, warm neutral canvas, white surfaces and restrained lime accent.
- Status colors must communicate meaning consistently; never rely on color alone.
- Use the brand mark consistently in the sidebar and favicon.

## Visual principles

- Clarity before decoration; make urgent work scannable.
- Use clear hierarchy, readable line lengths and predictable spacing.
- Prefer subtle borders, low-elevation shadows and 10–16px radii.
- Avoid decorative gradients, excessive glass effects, emoji-only controls and motion that delays work.
- Desktop body text starts at 15px; supporting copy should remain legible. On narrow screens, prioritize wrapping and stacked layouts over shrinking text.

## Screen patterns

- Overview: distinguish synthetic activity from real operational metrics; keep priority and recommended actions prominent.
- Incidents: preserve the full table on desktop; convert rows into labeled cards on narrow screens so fields remain readable without horizontal scrolling.
- AI triage: keep model source, uncertainty, missing information and human-review requirements visible.
- Recurring faults: describe matches as observed patterns, never confirmed root causes.
- Audit trail: label client-side history as a local demo timeline, not a tamper-proof record.
- Product notes: separate implemented prototype behavior from production requirements.

## Motion

- Use short opacity/transform transitions for page entry and interaction feedback.
- No flashing, scroll hijacking or essential information hidden behind animation.
- Respect `prefers-reduced-motion`; all actions and information remain available without motion.
- Keep animation CSS-native unless a measured interaction requires a library. Do not add GSAP or other runtime dependencies solely for decoration.

## Accessibility and responsive behavior

- Keep semantic HTML, stable control IDs and existing data hooks.
- Provide a keyboard skip link, visible focus indicators, native keyboard-operable controls and accessible labels.
- Keep navigation state exposed to assistive technology and update mobile-menu expanded state.
- Use live announcements for asynchronous triage output and feedback.
- Use labeled mobile incident cards at narrow viewports.
- Verify contrast, touch targets, modal focus behavior, empty/loading/error/success states and keyboard operation.
- Reduced-motion preference is mandatory.

## Open data and licensing

- Keep demo incident records synthetic. Never import private student or incident data.
- Public datasets must be relevant, documented with source URL, publisher, dataset identifier, retrieval date, update frequency, schema and license/terms.
- OpenStreetMap data requires attribution and ODbL compliance; map tile services have separate usage policies.
- For India OGD datasets, inspect each dataset's license metadata and attribution conditions; do not assume every linked resource shares the same license.
- Public context data is not proof that an incident occurred and must not silently change safety priority.
- See [DATA_SOURCES.md](./DATA_SOURCES.md) for the source register and acceptance checklist.

## Runtime dependencies

- This refresh adds no third-party fonts, icon packages, animation packages or externally hosted assets.
- Existing application architecture and API contracts remain unchanged.
