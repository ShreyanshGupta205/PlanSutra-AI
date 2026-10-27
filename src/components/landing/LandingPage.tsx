import React from 'react';
import { Logo } from '../common/Logo';
import { 
  Sparkles, 
  ShieldCheck, 
  Calculator, 
  CalendarClock, 
  Store, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  FileSpreadsheet, 
  Printer, 
  CalendarCheck2
} from 'lucide-react';
import { formatINR } from '@/lib/currency';

interface LandingPageProps {
  onStartPlanning: () => void;
  onExploreDemo: () => void;
  onGoToDashboard: () => void;
  onOpenAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPlanning,
  onExploreDemo,
  onGoToDashboard,
  onOpenAdmin,
}) => {
  return (
    <div className="min-h-screen bg-ivory-50 text-navy-900 flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 bg-ivory-50/90 backdrop-blur-md border-b border-ivory-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-navy-700">
            <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-emerald-700 transition-colors">Key Engines</a>
            <a href="#plan-doctor" className="hover:text-emerald-700 transition-colors">Plan Doctor</a>
            <a href="#transparency" className="hover:text-emerald-700 transition-colors">Data & Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className="text-xs font-semibold px-3 py-1.5 rounded-md text-navy-700 hover:text-navy-950 hover:bg-ivory-200/60 border border-ivory-300 transition-colors"
              title="Admin Portal"
            >
              Admin Portal
            </button>
            <button
              onClick={onGoToDashboard}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              My Events
            </button>
            <button
              onClick={onStartPlanning}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <span>Plan My Event</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles size={14} className="text-marigold-600" />
            <span>PromptWars Challenge 5 — Celebration & Event Planner</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-navy-950 tracking-tight max-w-4xl mx-auto leading-tight">
            Plan Every Celebration <br />
            <span className="text-emerald-800 italic">With Confidence.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-navy-700 max-w-2xl mx-auto leading-relaxed">
            Turn your ideas and financial constraints into a personalized, financially reconciled, and executable event plan. Powered by GenAI and governed by the deterministic <strong>Plan Doctor</strong> integrity engine.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartPlanning}
              id="hero-plan-my-event-btn"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-medium hover:shadow-lifted transition-all flex items-center justify-center gap-2 text-base"
            >
              <span>Plan My Event</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onExploreDemo}
              id="hero-explore-demo-btn"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-ivory-100 text-navy-900 border border-ivory-300 font-semibold shadow-soft transition-all flex items-center justify-center gap-2 text-base"
            >
              <span>Explore Demo Blueprint (₹1.5 Lakhs)</span>
            </button>
          </div>

          {/* Value Props Strip */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white border border-ivory-200 shadow-soft">
              <div className="text-emerald-700 font-bold flex items-center gap-1.5 text-sm mb-1">
                <CheckCircle2 size={16} />
                <span>Deterministic Math</span>
              </div>
              <p className="text-xs text-navy-700">Financial reconciliation in strict code, never trusted to LLM hallucinations.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-ivory-200 shadow-soft">
              <div className="text-emerald-700 font-bold flex items-center gap-1.5 text-sm mb-1">
                <ShieldCheck size={16} />
                <span>Plan Doctor Engine</span>
              </div>
              <p className="text-xs text-navy-700">12 validation checks catching capacity, budget, and timeline risks before vendors sign.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-ivory-200 shadow-soft">
              <div className="text-emerald-700 font-bold flex items-center gap-1.5 text-sm mb-1">
                <Sliders size={16} />
                <span>Change Simulator</span>
              </div>
              <p className="text-xs text-navy-700">Test "What if?" guest increases, weather shocks, or budget cuts with instant recalculation.</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-ivory-200 shadow-soft">
              <div className="text-emerald-700 font-bold flex items-center gap-1.5 text-sm mb-1">
                <Lock size={16} />
                <span>Local-First Privacy</span>
              </div>
              <p className="text-xs text-navy-700">Your event data stays on your machine. No marketing trackers or sold guest lists.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Core Stages Section */}
      <section id="how-it-works" className="py-16 bg-white border-y border-ivory-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-serif font-bold text-navy-950">The Three Pillars of PlanSutra AI</h2>
            <p className="mt-3 text-navy-700">A structured methodology that bridges the gap between creative celebration dreams and logistical reality.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Stage 1 */}
            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Plan</h3>
                <p className="text-sm text-navy-700 leading-relaxed">
                  Capture your vision, cultural rituals, dietary constraints, guest count, and spending limits. GenAI crafts a tailored blueprint with curated themes, timeline milestones, and categorized budget allocations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-ivory-200 text-xs text-emerald-800 font-semibold flex items-center gap-1">
                <Sparkles size={14} />
                <span>Multi-step Guided Wizard + Zod Validation</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-6 rounded-2xl bg-ivory-50 border border-emerald-200/80 shadow-soft flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-marigold-500 text-navy-950 font-bold text-[10px] uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                Signature Feature
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-marigold-100 text-marigold-800 flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Validate (Plan Doctor)</h3>
                <p className="text-sm text-navy-700 leading-relaxed">
                  The deterministic Plan Integrity Engine tests your plan against 12 validation rules: venue capacity breaches, unreconciled paise arithmetic, broken task dependencies, unconfirmed vendors, and overdue deadlines.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-ivory-200 text-xs text-marigold-800 font-semibold flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>Deterministic Checks + 1-Click Corrective Actions</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-6 rounded-2xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-2">Execute</h3>
                <p className="text-sm text-navy-700 leading-relaxed">
                  Operate with complete clarity on event day. Track vendor quotes with hidden-fee inspection, coordinate minute-by-minute day-of run sheets, and export printable execution kits, calendar syncs, and CSV budgets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-ivory-200 text-xs text-navy-800 font-semibold flex items-center gap-1">
                <CalendarCheck2 size={14} />
                <span>Printable Run Sheet + CSV & iCal Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-serif font-bold text-navy-950">Built for Operational Integrity</h2>
            <p className="mt-3 text-navy-700">Every module is interconnected. When guest counts or dates change, dependent budgets and timelines adapt deterministically.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-ivory-200 shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Calculator size={20} />
              </div>
              <h3 className="font-bold text-lg text-navy-900 mb-2">Reconciled Budget Planner</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Track Planned, Quoted, Actual, and Paid costs in INR. Automatic variance tracking, category breakdowns, and explicit contingency buffers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-200 shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-marigold-100 text-marigold-700 flex items-center justify-center mb-4">
                <CalendarClock size={20} />
              </div>
              <h3 className="font-bold text-lg text-navy-900 mb-2">Timeline & Phased Milestones</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Eight planning phases from initial booking down to day-of execution. Automated prerequisite validation prevents scheduling cart-before-the-horse tasks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-200 shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center mb-4">
                <Store size={20} />
              </div>
              <h3 className="font-bold text-lg text-navy-900 mb-2">Vendor Quote Inspector</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Separate quote status from booking status. Automatically checks for omitted costs like setup, dismantle fees, transport surcharges, and taxes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-200 shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Sliders size={20} />
              </div>
              <h3 className="font-bold text-lg text-navy-900 mb-2">Event Change Simulator</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Model realistic "What If?" scenarios like a guest count jump from 180 to 220, sudden rain risk, or a vendor cancellation before applying changes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-200 shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-marigold-100 text-marigold-700 flex items-center justify-center mb-4">
                <Printer size={20} />
              </div>
              <h3 className="font-bold text-lg text-navy-900 mb-2">Day-Of Run Sheet & Print Kit</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Staggered activity schedule with owner, location, and notes. Dedicated print-optimized layouts for on-site clipboard execution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-200 shadow-soft">
              <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center mb-4">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="font-bold text-lg text-navy-900 mb-2">Export & Multi-Format Sync</h3>
              <p className="text-sm text-navy-700 leading-relaxed">
                Export to CSV for spreadsheet analysis, iCal (.ics) for calendar alarms, and JSON backups for offline archive and migration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data & Privacy Section */}
      <section id="transparency" className="py-14 bg-ivory-100/60 border-t border-ivory-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ivory-300 text-xs font-semibold text-navy-800 mb-4">
            <Lock size={14} className="text-emerald-700" />
            <span>Honest Engineering & Privacy Disclosures</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-navy-950">How Your Data & Price Estimates Are Handled</h2>
          <p className="mt-3 text-sm text-navy-700 leading-relaxed">
            PlanSutra AI stores your event plans <strong>locally in your browser</strong> using structured storage with schema validation. AI generation is performed through server-side Gemini API calls; API keys and user prompts are never exposed to browser clients. Price estimates are illustrative benchmarks and do not represent verified live vendor quotes until you contract them.
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-navy-950 text-navy-200 border-t border-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Logo size="md" className="text-white" isDark={true} />
            <p className="mt-1 text-xs text-navy-400">
              PromptWars Challenge 5 — Celebration & Event Planner. Built with Google Gemini & Vite React.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-navy-300">
            <button onClick={onExploreDemo} className="hover:text-emerald-400 transition-colors">
              Community Demo ({formatINR(150000)})
            </button>
            <button onClick={onGoToDashboard} className="hover:text-emerald-400 transition-colors">
              User Dashboard
            </button>
            <button onClick={onOpenAdmin} className="hover:text-emerald-400 transition-colors">
              Admin Interface
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
