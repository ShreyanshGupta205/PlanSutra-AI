# PlanSutra AI — Celebration & Event Operations Platform
> *"Every celebration, planned. Every detail, under control."*
> 
> **PromptWars Challenge 5: Celebration & Event Planner (Google & Hack2Skill)**

PlanSutra AI is an intelligent celebration-planning and operations platform for weddings, birthdays, community festivals, and college celebrations. It transforms personal ideas and financial constraints into a personalized, financially reconciled, and executable event plan.

---

## 1. Product Vision & Differentiator

### The Problem
Most AI event planning tools act as generic text generators: they produce hallucinatory budget figures that do not add up, ignore venue fire codes and capacity limits, overlook task schedule dependencies, and fail to distinguish unverified estimates from signed vendor contracts.

### The Differentiator: Deterministic Plan Integrity Engine (Plan Doctor)
PlanSutra AI bridges creative vision and operational reality. While GenAI assists with theme ideas, vendor questions, and initial blueprints, **ordinary deterministic code performs all financial arithmetic and logistical rule validation**. 

Plan Doctor audits every event plan across **12 deterministic rules**:
1. **Budget Overrun**: Flags projected commitments that exceed user ceilings.
2. **Budget Reconciliation**: Audits integer paise allocations to ensure category sums match the total budget exactly.
3. **Venue Capacity**: Validates planned guest counts against legal/comfortable hall capacities; reports missing capacity information if unconfirmed instead of guessing.
4. **Date Integrity**: Detects missing dates or past-dated events.
5. **Overdue Tasks**: Identifies missed milestone deadlines in real time.
6. **Broken Task Dependencies**: Detects scheduling conflicts where a task is due before its prerequisite is completed.
7. **Day-Of Schedule Collisions**: Flags overlapping activity time windows in identical venues.
8. **Critical Vendor Unconfirmed**: Flags essential unbooked services (Venue, Catering, Photography).
9. **Unverified Estimates**: Identifies high-impact categories (>15% budget) lacking formal quotations.
10. **Contingency Reserve Missing**: Audits emergency financial buffers (recommends 8%–15%).
11. **Accessibility Verification**: Ensures wheelchair, step-free access, and dietary mandates have active venue audit tasks.
12. **Critical Decisions Undecided**: Flags unchosen venues or missing ceremonial requirements.

---

## 2. Exactly Two Interfaces

### Interface A: User Application
- **Public Landing Page**: Warm ivory & emerald brand identity, 3-stage methodology (*Plan, Validate, Execute*), feature highlights, and privacy disclosures. Zero fake testimonials or fabricated metrics.
- **User Dashboard**: Event cards with real saved metrics, budget utilization progress, readiness score badges, overdue task alerts, duplication, deletion, and JSON export.
- **Event Creation Wizard**: Multi-step flow capturing basics, budget allocations, dietary, accessibility, sustainability, and cultural rituals. Structured generation validated by Zod schemas with fallback recovery.
- **Event Workspace**: Single source of truth containing:
  - **Overview**: Countdown, readiness breakdown, urgent alerts, and recent updates.
  - **Budget Planner**: Reconciled Planned, Quoted, Contracted, and Paid columns in INR (₹) with CSV export and savings analysis.
  - **Timeline & Tasks**: 8 phased planning stages with prerequisite dependency checks.
  - **Vendor Manager & Quote Inspector**: Unbooked vs Confirmed tracking, hidden omission checklist (taxes, setup, transport, overtime, staff meals), and AI negotiation question generator.
  - **Plan Doctor Tab**: Full diagnostic findings with 1-click preview and approval of corrective actions.
  - **Day-Of Run Sheet**: Minute-by-minute activity schedule with dedicated print kit (`@media print`).
  - **Event Change Simulator ("What if?")**: Test guest count jumps (180 to 220), budget cuts, weather rain buffers, and vendor cancellations with instant recalculation.
  - **AI Assistant Drawer**: In-workspace conversational assistant with live event context.

### Interface B: Admin Dashboard (`/admin` or `#admin`)
- **Server-Verified Security**: Protected by `ADMIN_SECRET_KEY` verified on the server. Does not trust client-supplied roles or URL parameters.
- **Operational Health Telemetry**: Live tracking of AI request counts, failure counts, average latency (ms), safe error categories, and server uptime. Zero PII, user prompts, or private event plans are logged.
- **Template Management**: Create, edit, activate, or deactivate structured templates (Wedding, Birthday, Community, College Fest, Corporate).
- **Tamper-Evident Audit Trail**: Chronological log of administrative actions, actors, targets, and outcomes.

---

## 3. Challenge 5 Demonstration Scenario

PlanSutra AI includes a pre-seeded, verified demonstration scenario:
- **Event**: Shanti Nagar Community Cultural Utsav
- **Occasion**: Community celebration in Pune
- **Guests**: 180 planned attendees
- **Budget**: ₹1,50,000 total (100% reconciled)
  - Catering & Buffet: ₹60,000 (~₹333.33/guest)
  - Venue Hall: ₹30,000
  - Stage & Decor: ₹20,000
  - Sound & Performers: ₹15,000
  - Photography: ₹10,000
  - Contingency Reserve (10%): ₹15,000

### Walkthrough Sequence:
1. Open the landing page and click **"Explore Demo Blueprint (₹1.5 Lakhs)"**.
2. Review the **Overview** tab: notice 180 guests, ₹1,50,000 budget, and Plan Doctor findings.
3. Click **"Simulator"** in the header:
   - Adjust simulated guests from **180 to 220 (+40 guests)**.
   - The simulator deterministically recalculates catering from ₹60,000 to **~₹73,333** using the ₹333.33 per-guest rate.
   - Total projected cost increases by **₹13,333**, triggering a budget overrun alert.
4. Click **"Apply Simulated Changes to Real Plan"**.
5. Switch to **Plan Doctor**:
   - Observe the new critical blocker: *"Projected Costs Exceed Total Budget by ₹13,333"*.
   - Click the corrective action: *"Increase budget by ₹13,333"*.
   - Review the approval preview and click **"Approve & Apply Correction"**.
   - Notice the budget adjusts and Plan Doctor resolves the finding!
6. Switch to **Vendors & Quotes**:
   - Inspect Annapurna Feast Caterers.
   - Click **"Quote Inspector & Hidden Fee Audit"** to review omission checks and click **"Refresh Tips"** for AI negotiation questions.
7. Switch to **Day-Of Run Sheet**:
   - Click **"Print Run Sheet"** to preview the clean on-site clipboard execution layout.
8. Click **"Admin Portal"** (or append `#admin`):
   - Enter your server's configured `ADMIN_SECRET_KEY`.
   - Inspect live AI telemetry, template statuses, and audit trail logs.

---

## 4. Architecture & Tech Stack

```
plansutra-ai/
├── src/
│   ├── app/                      # App root and view management
│   ├── components/
│   │   ├── admin/                # Interface B: Admin console
│   │   ├── common/               # Logo and UI elements
│   │   ├── dashboard/            # User events dashboard
│   │   ├── landing/              # Public landing page
│   │   ├── wizard/               # Multi-step creation wizard
│   │   └── workspace/            # Event workspace tabs (Overview, Budget, Timeline,
│   │                             # Vendors, Plan Doctor, Run Sheet, Simulator, Assistant)
│   ├── features/
│   │   ├── budget/               # Deterministic budget calculation engine & CSV export
│   │   ├── events/               # Sample data & templates
│   │   ├── plan-doctor/          # 12-rule Plan Integrity Engine & readiness score
│   │   └── simulator/            # "What if?" change simulator
│   ├── lib/
│   │   ├── currency.ts           # Indian Rupee formatting & integer paise arithmetic
│   │   └── storage.ts            # Local-first persistence, JSON backup, iCal (.ics) sync
│   ├── schemas/                  # Zod validation schemas for input, output, and backup
│   └── types/                    # Domain types
├── server/
│   ├── index.ts                  # Express backend with rate limiting & admin auth
│   └── aiFallback.ts             # Deterministic fallback generator
├── test/
│   ├── adminSecurity.test.ts     # Security & authorization unit tests
│   ├── budget.test.ts            # Currency & budget reconciliation tests
│   ├── planDoctor.test.ts        # Plan Doctor 12-rule engine & simulation tests
│   ├── schema.test.ts            # Zod validation & rejection tests
│   └── apiVerification.mjs       # End-to-end API integration test script
└── .env.example                  # Environment template
```

- **Frontend**: React 19, TypeScript (Strict), Vite 8, Tailwind CSS v4, Lucide React, Zod.
- **Backend**: Node.js 24, Express, TypeScript (`tsx`), CORS.
- **AI Service**: Google Gemini API (`gemini-2.5-flash`) with server-side validation and deterministic fallback engine.
- **Testing**: Vitest, React Testing Library, custom API test suite.

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js (v18 or higher; v24 recommended)
- npm

### Installation
```bash
# Clone or navigate to the workspace
cd "PlanSutra AI"

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Contents of `.env`:
```env
PORT=3001
GEMINI_API_KEY=               # Optional: your Google AI Studio API key
GEMINI_MODEL=gemini-2.5-flash
ADMIN_SECRET_KEY=your_admin_secret_key_here
```
*(Note: If no Gemini API key is provided, PlanSutra AI automatically runs in high-quality deterministic fallback demo mode with zero errors).*

### Running Locally
```bash
# Starts both Express backend (port 3001) and Vite frontend (port 5174) concurrently
npm run dev
```
Open **`http://localhost:5174/`** in your browser.

---

## 6. Testing & Quality Assurance

PlanSutra AI includes a complete automated test suite verifying deterministic business logic, security boundaries, and API integrations:

```bash
# Run unit tests and API integration suite
npm test
```

### Test Suite Summary:
- **`test/budget.test.ts`** (9 tests): Currency formatting in INR, integer paise arithmetic, reconciliation differences, contingency buffers, and CSV exports.
- **`test/planDoctor.test.ts`** (7 tests): Venue capacity violation vs missing capacity, overdue tasks, schedule collisions, transparent readiness score, and 180->220 change simulation.
- **`test/schema.test.ts`** (5 tests): Payload validation, negative budget rejection, malformed AI response handling, and corrupted backup protection.
- **`test/adminSecurity.test.ts`** (2 tests): Server-side secret validation and fail-closed authorization.
- **`test/apiVerification.mjs`** (7 tests): Live endpoint testing covering `/api/health`, `/api/admin/login`, `/api/admin/templates`, `/api/admin/audit`, `/api/ai/generate-plan`, and `/api/ai/chat`.

**Total: 30 automated tests passing with 0 failures.**

---

## 7. Security & Privacy Disclosures

1. **Server-Side API Keys**: Gemini API keys and provider tokens are never sent to the client browser.
2. **Server-Side Admin Authorization**: Admin endpoints enforce bearer token verification against `ADMIN_SECRET_KEY` on the server.
3. **Rate Limiting**: AI endpoints are rate-limited in memory to prevent abuse.
4. **Local-First Data Ownership**: Event plans are stored in browser local storage.
5. **No Hallucinated Math**: Budget sums and Plan Doctor rules are computed in pure TypeScript.
6. **No Fake Marketplace**: Vendors are treated as organizer-entered contacts with quote checks; PlanSutra AI does not falsely claim to be a verified live marketplace.

---

## 8. Deployment

### Vercel / Cloud Node Hosting
- Build command: `npm run build`
- Output directory: `dist`
- Set environment variables in your hosting dashboard: `PORT`, `ADMIN_SECRET_KEY`, and optional `GEMINI_API_KEY`.
