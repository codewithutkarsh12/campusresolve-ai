# CampusResolve AI

**Campus Incident Intelligence & Prevention** — an original PromptWars prototype.

CampusResolve demonstrates a campus-incident workflow: report an issue, receive a structured triage recommendation, review possible repeat faults, advance a ticket through a controlled demo workflow, and inspect a local event timeline.

## Current capabilities

- Responsive dashboard, incident register, triage workbench, recurrence view, audit view and product transparency page.
- Synthetic demo records with search, category/status/priority filters and CSV export.
- Report creation, triage review, workflow status progression, resolution verification note and reopening reason.
- Explicitly labeled deterministic demo fallback when live Gemini is not configured or unavailable.
- Optional server-side Gemini API endpoint at `POST /api/triage`.
- Strict request bounds and output schema checks, safety-priority override, request timeout, safe error responses, and best-effort in-memory rate limiting.
- Safe CSV escaping, escaped user-generated text, hardened HTTP headers, and a restrictive Content Security Policy for the deployment.
- Automated unit, API, server, static wiring and security regression tests; a Chromium browser smoke suite is available separately.

## Architecture

```text
Browser (index.html + styles.css + app.js + csv.js)
  ├─ Demo incident state: localStorage (synthetic data only)
  └─ POST /api/triage
       ├─ request validation and bounded body
       ├─ optional server-side Gemini API call (GEMINI_API_KEY)
       ├─ structured output validation
       └─ deterministic safety priority override
```

`server.js` is a small local development server. Vercel uses `api/triage.js` as its serverless route. The Github Pages workflow deliberately deploys only the static client; live Gemini requests require a backend-capable host.

## Run locally

Requirements: Node.js 20 or later.

```bash
npm run lint
npm test
npm run dev
```

Open `http://localhost:3000`. The page works as a synthetic demo without a Gemini key. To enable live Gemini triage locally, set `GEMINI_API_KEY` in your shell before starting the server. Never commit real credentials. The local server does not automatically load `.env.local`.

Optional browser test:

```bash
npm run test:browser
```

The browser smoke test verifies initial rendering, mobile navigation, triage fallback, XSS-safe display, preventing repeated use of a triage result, filtering, and the reopen-reason workflow. It does not replace a full device/browser matrix or manual screen-reader testing.

## Gemini configuration

- `GEMINI_API_KEY`: private server-side API key; never expose it in browser code.
- `GEMINI_MODEL`: optional model name. Default: `gemini-3.8-flash`; model access depends on provider availability for the account.

If the key is missing, the API returns a controlled `AI_NOT_CONFIGURED` response and the frontend explicitly labels the rules-based fallback. Provider errors and invalid output return safe controlled errors, after which the client can use the clearly labeled demo fallback.

## Tests and CI

- `npm run lint`: Node syntax checks for the server, frontend, CSV helper and API/triage modules.
- `npm test`: Node's built-in test runner for validation, AI-output schema, safety override, error handling, rate-limit response, CSV formula injection, asset wiring, and local server behavior.
- `npm run test:browser`: Browser smoke test.
- `.github/workflows/ci.yml`: runs lint and the test suite on `main` pushes and pull requests.

The test suite does not prove that live Gemini credentials are valid or that the deployed URL resolves. Those must be verified in the deployment environment.

## Important limits — not production-ready for real reports

This repository is a functional evaluation prototype, not a secure multi-user campus operations system. Incident records and audit history use browser `localStorage`; they are editable by the browser user and do not synchronize between users. It does not implement production authentication, server-enforced staff roles, authoritative persistent records, access-controlled media storage, or tamper-resistant audit logs. The in-memory rate limit is per server instance and is not a global production abuse-control system.

Use synthetic records only. Do not submit private student data, confidential incident descriptions, sensitive photographs or credentials. Before real operational use, implement and test authentication, server-side authorization for every resource/action, persistent storage security rules, global rate limits/quotas, audit retention/deletion policies, monitoring, backups and an approved privacy/threat model.

## Deployment

The Vercel configuration serves the static frontend and defines `api/triage.js` as the server-side endpoint. Import this repository into the existing Vercel project, select the repository root, configure `GEMINI_API_KEY` privately if live AI is needed, deploy, and verify the exact production URL from a fresh browser session. A static GitHub Pages deploy provides the demo UI only; its `/api/triage` path cannot execute the Gemini server function.

Do not claim that deployment, live AI, authentication, persistent storage, or a security review is complete without direct verification.

## Project files

- `index.html`, `styles.css`, `app.js`, `csv.js`: canonical frontend.
- `api/triage.js`: Vercel serverless triage route.
- `lib/triage.js`: validation and deterministic policy helpers.
- `server.js`: local Node server.
- `tests/`: executable tests.
- `SECURITY.md`: security limitations and reporting guidance.
