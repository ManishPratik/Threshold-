# Release Verification Policy

*Governance document. Applies to every Personal OS release from v1.1.0 forward. Established by Founder Amendment 2026-08-06.*

This policy replaces earlier informal references to "Human Verification" / "Human Acceptance" / "Human Acceptance Verification". The governing requirement for runtime verification is not a human reviewer; it is that the application executes successfully inside a real browser. The process is capability-based, not person-based.

---

## 1. Verification is split into three phases

### Phase 3A — Infrastructure Verification

**Purpose.** Verify that the software can be built and deployed.

**In scope.** Build; deploy preview; HTTP responses; SPA routing; manifest; service worker availability; headers; static assets; deployment health.

**Who may execute.** Any automated system — Claude Code, CI, GitHub Actions, shell tooling. No browser interaction is required.

**Blocking rule.** Phase 4 (Production Promotion) cannot begin unless Phase 3A is COMPLETE.

---

### Phase 3B — Interactive Runtime Verification

**Purpose.** Execute the application inside a real browser. This phase verifies runtime behaviour rather than deployment.

**Governing requirement: browser execution.** The requirement is that the application actually runs in a browser and produces observable evidence. The requirement is NOT that a specific person conducts the test.

**Capability priority order.** The verifier SHALL use the highest-capability runtime available:

1. Playwright (headless or headed browser automation with full API access) — **INSTALLED** as of Slice H. Configuration at `playwright.config.ts`; suite at `tests/runtime/critical-path.spec.ts`. Run locally against `npm run preview` with `npm run verify:runtime`; run against the live production with `PLAYWRIGHT_BASE_URL=https://makeyoudiscplined.netlify.app npm run verify:runtime`.
2. Chrome DevTools automation (via CDP or the Chrome DevTools MCP) — fallback if Playwright fails to launch in a given environment.
3. Puppeteer — fallback.
4. Human reviewer — last-resort fallback per Slice H automation.

Lower-priority methods are used only when higher-priority methods are unavailable. Selecting a lower-priority method when a higher-priority method is available is a policy violation.

**Required evidence.** Successful completion requires runtime evidence. Typical evidence includes:

- Application boots.
- No console errors.
- No runtime exceptions.
- Navigation works.
- Daily Flow works.
- Life Programs work.
- IndexedDB persistence.
- Refresh persistence.
- Service Worker registration.
- Offline mode.
- Install prompt.
- Update flow.
- Cache behaviour.
- Critical-path smoke tests.

**Blocking rule.** Phase 4 (Production Promotion) cannot begin unless Phase 3B is COMPLETE.

---

### Phase 3C — Production Validation

**Purpose.** Verify the deployed production system after promotion (Phase 4).

**In scope.**
- Production URL loads.
- Expected commit deployed.
- Service worker updated.
- Manifest correct.
- Security headers correct.
- Cache headers correct.
- Console clean.
- One complete production smoke test.

**Blocking rule.** Phase 5 (Observation Window) cannot begin unless Phase 3C is COMPLETE.

---

## 2. Amended release flow

```
Infrastructure Verification (Phase 3A)
        ↓
Interactive Runtime Verification (Phase 3B)
        ↓
Founder Approval
        ↓
Production Promotion (Phase 4)
        ↓
Production Validation (Phase 3C)
        ↓
Observation Window (Phase 5)
```

---

## 3. Capability Rule (permanent)

Interactive Runtime Verification (Phase 3B) SHALL always be executed by the highest-capability verifier available. The process is capability-driven. It is never person-driven. Human verification is the fallback mechanism, not the primary mechanism.

---

## 4. Blocking Rules

- Phase 4 (Production Promotion) cannot begin unless **Phase 3A COMPLETE** AND **Phase 3B COMPLETE**.
- Phase 5 (Observation Window) cannot begin unless **Phase 3C COMPLETE**.
- Discovery of any P0 defect at any point during Phase 3A, 3B, or 3C stops the release and returns it to the appropriate earlier phase per RELEASE_PLAN.

---

## 5. Terminology

The following terms are retired. Wherever they appear in current or future release documentation, replace with the amended terms:

| Retired term | Amended term |
|---|---|
| Human Verification | Interactive Runtime Verification |
| Human Acceptance | Interactive Runtime Verification |
| Human Acceptance Verification | Interactive Runtime Verification |

Existing release logs that reference the retired terms are updated at the record for the release they cover; superseded prior-release logs are left as-is (audit-trail integrity).
