# CampusResolve AI — Design System v1

## Product direction
A calm, trustworthy campus-operations workspace. The interface should communicate safety, accountability and clarity. It is an incident-intelligence prototype, not an emergency-response service or production multi-user record system.

## Visual principles
- Clarity before decoration; make urgent work scannable.
- Forest-green foundation with restrained lime accent for positive actions and active states.
- Warm neutral canvas, white content surfaces, subtle borders and low-elevation shadows.
- Compact, readable operations typography; body copy should remain comfortably legible.
- Consistent 10–16px corner radii and a predictable spacing rhythm.
- Avoid decorative gradients, excessive glass effects, emoji-only controls and motion that delays work.

## Motion
- Use short opacity/transform transitions for page entry and interaction feedback.
- No flashing, scroll hijacking or essential information hidden behind animation.
- Respect `prefers-reduced-motion`; all actions and information remain available without motion.
- Reserve heavier GSAP/VFX sequences for a measured need and only after performance testing. This first refresh uses CSS-native effects and adds no runtime dependency.

## Accessibility and responsive behavior
- Preserve semantic HTML and existing control IDs/data attributes.
- Keep visible keyboard focus, readable contrast, and touch-friendly action heights.
- Verify mobile navigation, narrow viewport table behavior, form errors, empty/loading/success states and keyboard operation.
- Reduced-motion preference is mandatory.

## Data and licensing
- Keep demo records synthetic. Never import private student or incident data.
- Any future public/open dataset must be relevant, documented with source URL, update date, schema and license/terms. Public data is not automatically safe or reusable.
- This refresh adds no third-party fonts, icon packages, animation packages or externally hosted assets.

## Scope of this first implementation slice
- Global visual tokens and component surface refinement.
- Brand favicon refresh.
- Lightweight motion and reduced-motion handling.
- No changes to incident workflows, API contracts, persistence, triage rules or authorization.
