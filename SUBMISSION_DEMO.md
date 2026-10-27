# PlanSutra AI — Official Hackathon Submission Demonstration Script

**Competition:** PromptWars Challenge 5: Celebration & Event Planner  
**Duration:** 3 Minutes  
**Demonstrator:** Hackathon Presenter  
**Audience:** Judges & Technical Evaluators  
**Application URLs:**
- Local Dev Environment: `http://localhost:5174/` (Backend on `http://localhost:3001/`)
- Local Production Preview: `http://localhost:4173/` (`npm run preview`)
- Public Remote Cloud Deployment: *Unverified (Local testing only)*  
**Current Release-Gate Status:** **NEEDS ACTION** *(Pending owner credential revocation & Git history scrub)*  

---

## 1. Demonstration Setup & Pre-Flight Checklist

1. **Backend Server:** Running on port 3001 (`npm.cmd run server`).
2. **Frontend Client:** Running on port 5174 (`npm.cmd run client`).
3. **Pre-Demo Security Warning:** Never display or speak the contents of `.env` or the master administrative secret during the recording or live demonstration.
4. **Deterministic Fallback Engine:** If Google Gemini credentials are unconfigured or revoked, PlanSutra seamlessly engages its deterministic blueprint engine (`aiFallback.ts`), generating fully populated blueprints with mathematically reconciled budgets.

---

## 2. Chronological 3-Minute Walkthrough Script

### [0:00 – 0:30] Introduction & Value Proposition
- **Action:** Open `http://localhost:5174/` in a clean browser window.
- **Narration:**
  > *"Judges, welcome to PlanSutra AI. For PromptWars Challenge 5, we tackled the fatal flaw of GenAI in event planning: hallucinations in financial math, venue safety, and scheduling. PlanSutra AI pairs generative AI creativity with a deterministic Plan Integrity Engine called **Plan Doctor**. Indian families and organizers get creative cultural inspiration with guaranteed mathematical and logistical control."*
- **Visuals:** Highlight the landing page hero, the tagline *"Every celebration, planned. Every detail, under control."*, and the PromptWars Challenge 5 alignment.

---

### [0:30 – 1:15] Event Creation & Structured AI Blueprint Generation
- **Action:** Click **"Plan My Event"** (or click **"Explore Demo Showcase"** to load the pre-configured 180-guest celebration).
- **Setup Inputs (if using Wizard):**
  - **Event Name:** *Jaipur Heritage Wedding*
  - **Type:** Wedding
  - **Location:** Jaipur
  - **Guests:** 180
  - **Total Budget:** ₹1,50,000 (INR)
  - **Setting:** Indoor heritage palace
  - **Preferences:** Pure Vegetarian, Rajasthani folk music, Wheelchair accessible Mandap
- **Action:** Click **"Generate Complete Celebration Plan"**.
- **Narration:**
  > *"When the brief is submitted, our Express backend queries the model with strict Zod structured schemas. Notice what returns: a curated Rajasthani color palette, cultural milestone tasks, vendor negotiation tips, a day-of run sheet, and a 100% reconciled budget envelope with a dedicated 10% contingency reserve."*
- **Visuals:** Walk through the **Overview**, **Budget Planner**, and **Timeline & Tasks** tabs.

---

### [1:15 – 2:00] The Core Differentiator: Event Change Simulator & Plan Doctor
- **Action:** Click the **Simulator** button (or open the **Simulator** tab).
- **Action:** Change the simulated guest count from **180 to 220** (+40 guests).
- **Narration:**
  > *"Here is PlanSutra's core differentiator. In Indian celebrations, guest counts always expand. We simulate an increase from 180 to 220 guests. Instantly, our deterministic calculation engine detects that variable categories like catering must increase from ₹60,000 to ₹73,333—a precise ₹13,333 increase at ₹333.33 per guest. Crucially, the live plan is NOT mutated yet—changes are strictly isolated in a sandboxed preview."*
- **Action:** Switch to the **Plan Doctor** tab.
- **Narration:**
  > *"Now look at Plan Doctor. Without relying on an LLM to guess arithmetic, our rule engine detects `RULE_BUDGET_OVERRUN`, flagging the ₹13,333 deficit as a Critical Blocker and dropping our Readiness Score. Plan Doctor provides deterministic repair strategies: reallocate from our contingency reserve, or expand total budget."*
- **Action:** Click **"Approve & Apply Correction"** on the proposed fix.
- **Narration:**
  > *"The user previews the exact impact and approves the correction. Watch the Readiness Score update instantly to 'Execution Ready' with zero math errors."*

---

### [2:00 – 2:30] Vendor Confirmation & Multi-Format Exports
- **Action:** Click on the **Vendors & Quotes** tab.
- **Action:** Mark the Catering vendor as **"Contracted"** and enter a deposit paid of ₹25,000.
- **Action:** Click the **Export** menu in the top bar.
- **Action:** Click **"Export CSV Budget"** and open the generated CSV file.
- **Action:** Click **"Sync to Calendar (.ics)"** to show native calendar integration.
- **Action:** Press `F5` (Refresh browser).
- **Narration:**
  > *"All event state is validated and saved to browser storage. When we refresh, 100% of our contracted rates, updated guest count, and resolved findings persist flawlessly."*

---

### [2:30 – 3:00] Protected Server-Verified Admin Portal (Interface B)
- **Action:** Click **"Admin Portal"** in the footer or navigate to `http://localhost:5174/#admin`.
- **Action:** Type an incorrect secret key (e.g., `wrong-password`) and click **"Authenticate"**.
  - *Observation:* System immediately rejects with HTTP 401 Unauthorized and registers an audit log entry.
- **Action:** Enter the valid server secret configured in `.env` (without displaying or speaking the string aloud).
- **Narration:**
  > *"Interface B is our Admin Portal. This is not hidden UI; it is protected by server-side session authorization, constant-time `crypto.timingSafeEqual` comparison, and brute-force lockout. Once authenticated, the server issues an ephemeral 64-character session token. Here, organizers inspect live system health, template blueprints, and an immutable security audit log."*
- **Action:** Click **"Log Out"**.
- **Narration:**
  > *"Logging out invalidates the session token immediately on the server. That is PlanSutra AI: reliable generative planning with deterministic plan integrity."*

---

## 3. Verified Fallback Behavior & Honest Limitations

1. **Zero-API-Key Demo Mode:** If Google Gemini API credentials are absent or revoked, the system engages `aiFallback.ts`. The UI transparently notifies the user: *"Plan generated via PlanSutra Deterministic Blueprint Engine"*.
2. **Current Limitations:**
   - Single-currency accounting (INR / ₹) tailored specifically to the Indian celebration market.
   - Admin sessions reside in server memory (designed for single-instance or small cluster deployments; multi-instance cloud deployments would benefit from a Redis store).
   - Remote cloud deployment was not executed due to absence of cloud provider credentials in the local evaluation environment.

---

*Demonstration script certified for PromptWars Challenge 5 submission.*
