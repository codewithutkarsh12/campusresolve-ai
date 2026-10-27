# Security policy

CampusResolve AI is a prototype for evaluation and synthetic demo records. It is **not a production security boundary** and must not store real private campus incidents.

## Implemented defensive controls

- Client-rendered text is HTML-escaped before insertion into markup.
- Triage requests are bounded and validated server-side; unsupported methods and invalid payloads receive controlled responses.
- Gemini credentials are read only by the server-side API route.
- Model output is schema-validated; deterministic safety rules can raise urgency and the model cannot set a ticket's authoritative workflow state.
- AI requests have a timeout, bounded output size, safe error responses and a best-effort per-instance rate limit.
- CSV export protects formula-leading cells and correctly quotes fields.
- Vercel config sets security headers and a restrictive Content Security Policy.
- The local server serves only approved public assets and does not serve dotfiles, package files or server source.

## Known limitations

- Demo incident data and audit history are stored in browser `localStorage`; they are not authoritative, tamper-proof, or shared across users.
- Production authentication, role-based access control, resource-level authorization, secure database persistence, server-side audit log retention, and protected evidence uploads are not implemented.
- The in-memory rate limiter is best-effort and per serverless instance. It is not sufficient as a global rate limiter or cost-control system.
- Live Gemini analysis is unverified unless a valid private key is configured and the deployed endpoint is tested.
- Browser tests do not constitute a penetration test, a complete accessibility audit, or a full supported-browser matrix.

## Safe usage

- Use only synthetic/demo data.
- Never commit real API keys. Configure `GEMINI_API_KEY` privately in the hosting environment.
- Treat report text, locations, local storage and AI output as untrusted.
- Follow campus emergency procedures for immediate danger; model output must not substitute for emergency response or authorized human assessment.

## Required before real operational rollout

1. Authentication and server-enforced authorization for every protected read/write/action.
2. A persistent datastore with restrictive rules, tenant isolation, retention/deletion policies and tested backups.
3. Server-side append-only audit logging with actor identity and request correlation.
4. Platform/global rate limits, abuse detection, AI quotas and billing alerts.
5. Privacy review, data minimization, safe evidence upload handling and a documented threat model.
6. Live deployment, AI provider, negative authorization and accessibility verification.

## Reporting

Report security concerns privately to the repository maintainer. Do not post credentials, private incident data, or exploitable personal information in public issues.
