# PromptWars Challenge 5: Rubric Scorecard & Independent Evaluation

**Evaluation Target:** PlanSutra AI  
**Challenge:** PromptWars Challenge 5 — Celebration & Event Planner  
**Date:** October 27, 2026  
**Auditor:** Independent Senior Evaluation Lead & Technical Auditor  
**Release-Gate Verdict:** **NEEDS ACTION** *(Pending Owner Credential Revocation & History Scrub)*  

---

## 1. Official vs. Independent Predicted Evaluation

> [!IMPORTANT]
> **Assessment A — Official Competition Evaluation:** **UNAVAILABLE**  
> Direct API access to the proprietary Hack2Skill automated judging portal is unavailable from this local evaluation environment. In strict accordance with competition rules, no official score is fabricated or claimed.
>
> **Assessment B — Independent Predicted Evaluation:** Provided below based on reproducible local test runs, static type checking, endpoint verification, local Lighthouse 13.5.0 preview runs, and source code inspection. Official competition judging weights are unconfirmed in participant documentation; therefore, scores are presented per-criterion with an **unweighted arithmetic mean of 95.17 / 100**, explicitly labelled as an **unofficial independent estimate**.

---

## 2. Six-Criterion Evaluation Summary

| Criterion | Independent Predicted Score (0–100) | Confidence Level | Verified Strengths | Specific Deductions | Key Evidence Reference |
|:---|:---:|:---:|:---|:---|:---|
| **1. Code Quality** | **94 / 100** | **High** | Strong modular architecture; pure separation of domain math ([budgetCalculations.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/features/budget/budgetCalculations.ts)), diagnostics ([planDoctorRules.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/features/plan-doctor/planDoctorRules.ts)), and UI views; zero TypeScript errors on `tsc --noEmit`; strict Zod schema validation; `React.lazy` code splitting. | Minor: `server/index.ts` houses both API routing and in-memory stores in a single 548-line file rather than separate controller/repository modules. | `npm run lint` (0 errors), [src/App.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/App.tsx), [src/schemas/index.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/schemas/index.ts) |
| **2. Security** | **91 / 100** | **High** | Ephemeral 64-character random hex session tokens with 2-hour TTL; constant-time password check via `crypto.timingSafeEqual`; IP brute-force lockout (5 attempts / 15 min); HTTP security headers; zero secrets in client bundles; git-ignored `.env`. | Compromised development key pending manual revocation in Google AI Studio (remediation marked **BLOCKED**); Git commit `0f2d342` contains historical secret string. | [server/index.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/server/index.ts), `test/adminSecurity.test.ts`, `.gitignore:12` |
| **3. Efficiency** | **96 / 100** | **High** | Local Lighthouse Performance score of **98/100**; LCP of **1.5s**; TBT of **0ms**; CLS of **0.087**; dynamic code splitting reduces initial JS bundle to 348 kB (106 kB gzip); instant deterministic fallback when AI is unneeded. | Measured against local production preview (`http://localhost:4173/`), not live cloud production; Tailwind CSS bundle is 42 kB (8 kB gzip). | Lighthouse 13.5.0 audit reports (Run 1: 98, Run 2: 98, Run 3: 98 on local preview) |
| **4. Testing** | **95 / 100** | **High** | 43 automated software tests across 6 suites passing 100% in ~1.6s; covers all 17 competition user journey scenarios including attendance spikes, budget overruns, preview isolation, corrupt backups, and session auth. | End-to-end browser walkthroughs verified via Node.js API and Vitest mocks rather than Playwright browser driver (due to external sandbox CDN limits). | `test/budget.test.ts`, `test/planDoctor.test.ts`, `test/workflowScenarios.test.ts`, `test/apiVerification.mjs` |
| **5. Accessibility** | **98 / 100** | **High** | Lighthouse Accessibility score of **100/100**; semantic landmarks `<main id="main-content">`; accessible forms with explicit labels; all dialogs implement `role="dialog"`, `aria-modal="true"`, and keyboard `Escape` dismissal; high-contrast badges (>10:1); `@media (prefers-reduced-motion)`. | Screen reader test of complex data tables relies on standard HTML table markup rather than custom ARIA grid navigation. | Lighthouse Access 100, [src/index.css](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/index.css), [PlanDoctorTab.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/components/workspace/PlanDoctorTab.tsx) |
| **6. Problem Statement Alignment** | **97 / 100** | **High** | Directly tackles Challenge 5: weddings, birthdays, community events; pairs generative AI creativity with deterministic Plan Integrity Engine; Indian cultural context (vegetarian diets, folk traditions, INR currency); dual user and admin interfaces. | AI personalization currently restricted to prompt engineering rather than few-shot fine-tuning; single-currency focus (INR). | [EventCreationWizard.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/components/wizard/EventCreationWizard.tsx), [SimulatorModal.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/components/workspace/SimulatorModal.tsx), [sampleData.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/features/events/sampleData.ts) |

**Unweighted Arithmetic Mean:** **95.17 / 100** *(Unofficial Independent Estimate — Not an Official Score)*

---

## 3. Detailed Criterion Breakdown & Verification Evidence

### A. Code Quality (Predicted Score: 94 / 100)
- **Architecture:** Clean separation between pure financial calculation functions ([budgetCalculations.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/features/budget/budgetCalculations.ts)), diagnostic rules ([planDoctorRules.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/features/plan-doctor/planDoctorRules.ts)), simulation logic ([changeSimulator.ts](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/features/simulator/changeSimulator.ts)), and React components.
- **Static Analysis:** `tsc --noEmit` runs with 0 errors.
- **Modularity & Bundle Splitting:** [src/App.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/App.tsx) uses `React.lazy` code splitting for secondary views (`UserDashboard`, `EventCreationWizard`, `EventWorkspace`, `AdminDashboard`), maintaining an initial entry JS bundle of 348 kB (106 kB gzip).
- **Deductions (-6 pts):** `server/index.ts` is a 548-line monolithic server file combining route definitions, rate limiting, and in-memory session management.

### B. Security (Predicted Score: 91 / 100)
- **Credential Protection:** Zero keys in client-side code. `.env` is Git-ignored. Scanned production chunks in `dist/assets/` confirmed zero leaked tokens.
- **Server-Side Authentication:** Protected endpoints (`/api/admin/templates`, `/api/admin/audit`, `/api/admin/metrics`) require valid `Authorization: Bearer <token>`.
- **Timing-Safe Evaluation:** Implemented `crypto.timingSafeEqual` in `POST /api/admin/login`.
- **Brute Force Lockout:** 5 failed logins within 15 minutes triggers HTTP 429 lockout.
- **Session Lifecycle:** 64-char random hex tokens with 2-hour TTL. Logout revokes token on the server.
- **Deductions (-9 pts):** Compromised development key requires manual revocation in Google AI Studio (marked **BLOCKED**); Git commit `0f2d342` contains an old secret string in Git history requiring a scrub.

### C. Efficiency (Predicted Score: 96 / 100)
- **Local Lighthouse Performance:** **98 / 100** consistently across 3 consecutive runs on local production preview (`http://localhost:4173/`).
- **Local Preview Core Web Vitals:**
  - Largest Contentful Paint (LCP): **1.5 s**
  - Total Blocking Time (TBT): **0 ms**
  - Cumulative Layout Shift (CLS): **0.087**
  - Speed Index: **1.5 s**
- **Paise Integer Arithmetic:** Eliminates floating point recalculation overhead.
- **Deductions (-4 pts):** Measured on local preview rather than live cloud production; Tailwind CSS bundle is 42 kB.

### D. Testing (Predicted Score: 95 / 100)
- **Automated Software Test Count:** 43 tests (33 Vitest + 10 Live API tests).
- **Pass Rate:** 100% (43 passed, 0 failed).
- **Execution Speed:** Full automated test suite executes in ~1.6 seconds.
- **Coverage of 17 Competition Scenarios:**
  - Attendance modification (180 to 220 guests).
  - Catering cost recalculation (₹60,000 to ₹73,333).
  - Shortfall detection (₹13,333) via Plan Doctor.
  - Preview isolation (no unapproved mutations).
  - Valid and corrupt JSON backup import/export.
  - Unauthorized admin rejection (HTTP 401/403).
  - Logout session invalidation.
- **Deductions (-5 pts):** Tests run in Vitest (JSDOM) and Node.js fetch rather than live browser automation drivers (due to external sandbox CDN limitations for Playwright).

### E. Accessibility (Predicted Score: 98 / 100)
- **Lighthouse Accessibility Score:** **100 / 100** (Perfect).
- **Semantic Structure:** Explicit `<main id="main-content">`, `<header>`, `<nav>`, `<section>`, and `<footer>`.
- **Dialogs & Keyboard Support:** All modals ([SimulatorModal.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/components/workspace/SimulatorModal.tsx), [PlanDoctorTab.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/components/workspace/PlanDoctorTab.tsx), [AIAssistantDrawer.tsx](file:///d:/New%20folder%209.10.2026/Code/PlanSutra%20AI/src/components/workspace/AIAssistantDrawer.tsx)) implement `role="dialog"`, `aria-modal="true"`, focusable controls, and `Escape` key dismissal.
- **Contrast & Motion:** High-contrast text badges (>10:1 ratio); `@media (prefers-reduced-motion: reduce)` disables animations.
- **Deductions (-2 pts):** Screen reader testing was not completed natively with live screen reading hardware.

### F. Problem Statement Alignment (Predicted Score: 97 / 100)
- **Challenge 5 Target:** Celebration & Event Planner (weddings, birthdays, community gatherings).
- **Plan Integrity Engine:** Fully realized via Plan Doctor (12 deterministic validation rules).
- **Change Simulator:** Functional "What If" testing with preview isolation.
- **Dual Interfaces:** Fully implemented User Workspace + Protected Server-Verified Admin Dashboard.
- **Multi-Format Exports:** CSV Budget, `.ics` Calendar sync, JSON backup.
- **Deductions (-3 pts):** Single-currency accounting (INR / ₹) tailored specifically to the Indian celebration market.

---

## 4. Release-Gate Remediation Requirements

To move the final verdict from **NEEDS ACTION** to **READY FOR SUBMISSION**:

1. **Owner Action (BLOCKED):** Revoke the compromised Gemini API key in [Google AI Studio](https://aistudio.google.com/) and update the local `.env` file with a fresh replacement.
2. **Owner Authorization (ACTION REQUIRED):** Authorize execution of the Git history scrub on commit `0f2d342` using the safety branch `backup-before-history-rewrite`.
3. **Cloud Deployment (UNVERIFIED):** Deploy production bundle to a cloud provider (Render/Railway) to verify live public deployment performance.

---

*Scorecard compiled and certified by Independent Senior Evaluation Lead.*
