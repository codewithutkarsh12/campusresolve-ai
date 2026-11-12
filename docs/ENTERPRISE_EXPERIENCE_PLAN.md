# Implementation Plan — CampusResolve Enterprise Experience

## Task 1 — Add product/resource views
1. Extend sidebar resource navigation for How it works, About, FAQ, Help, Contact, Privacy and Terms.
2. Add matching page sections with concise, accurate prototype-specific content.
3. Add breadcrumb labels and page allow-list entries.
4. Use native details/summary for FAQ and a demo-only contact form that never implies successful transmission.

## Task 2 — Add appearance preferences
1. Add an accessible Light/Dark/System selector to the top bar.
2. Initialize saved preference safely; otherwise use prefers-color-scheme.
3. Persist only the theme preference under a separate localStorage key.
4. Add dark-theme token overrides and component-specific overrides for hard-coded light surfaces.
5. Keep reduced-motion and focus styles effective in both themes.

## Task 3 — Strengthen footer and trust messaging
1. Add resource and trust links to a consistent footer on the relevant pages.
2. State localStorage, synthetic-data and optional Gemini data-transfer boundaries plainly.
3. Do not add unsupported legal promises, production support addresses or emergency claims.

## Task 4 — Tests and bundle synchronization
1. Add wiring tests for resource navigation/page targets, theme controls, FAQ semantics, demo-only contact messaging and theme CSS.
2. Update app.js and regenerate lib/client-bundle.js exactly from the updated app.js.
3. Preserve existing DOM IDs, API contracts and current tests.

## Task 5 — Verification and handoff
1. Run npm run lint.
2. Run npm test.
3. Run npm run test:browser.
4. Inspect GitHub Actions for the new commit.
5. Report automated evidence separately from real-browser/device checks; do not claim a protected preview was visually inspected.
6. Keep the pull request unmerged pending owner review and any required manual checks.
