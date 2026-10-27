# Test guide

The project uses Node.js's built-in test runner, so the unit/API/server tests have no test-framework dependency.

```bash
npm run lint
npm test
npm run test:browser
```

`npm run test:browser` tests dashboard initialization, dialog focus and Escape behavior, mobile navigation, demo triage, safe handling of an XSS payload, duplicate-result prevention, filters, and a reopen-reason workflow.

The automated suite covers local code behavior, not live provider credentials, deployed hosting, full penetration testing, production authentication, persistent storage, or manual screen-reader testing. A passing local test run must not be presented as proof of those external properties.
