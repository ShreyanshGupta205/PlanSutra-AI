import React, { useState } from 'react';
import { EventPlan, PlanDoctorFinding, CorrectiveAction, FindingSeverity, FindingCategory } from '@/types';
import { runPlanDoctor } from '@/features/plan-doctor/planDoctorRules';
import { calculateBudgetSummary } from '@/features/budget/budgetCalculations';
import { formatINR } from '@/lib/currency';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  Coins, 
  Calendar, 
  Users, 
  RotateCcw,
  Check,
  X
} from 'lucide-react';

interface PlanDoctorTabProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
  onOpenSimulator: () => void;
}

export const PlanDoctorTab: React.FC<PlanDoctorTabProps> = ({
  event,
  onUpdateEvent,
  onOpenSimulator,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [previewAction, setPreviewAction] = useState<{ action: CorrectiveAction; finding: PlanDoctorFinding } | null>(null);

  // Handle ESC key to dismiss action preview modal (WCAG 2.2 AA)
  React.useEffect(() => {
    if (!previewAction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewAction(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewAction]);

  const { findings, readiness } = runPlanDoctor(event);

  const filteredFindings = findings.filter(f => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    return true;
  });

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'critical_blocker':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">Critical Blocker</span>;
      case 'high_priority_risk':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">High Risk</span>;
      case 'warning':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-200">Warning</span>;
      case 'missing_info':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">Missing Info</span>;
      case 'suggestion':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">Suggestion</span>;
      default:
        return null;
    }
  };

  // Corrective Action Executor
  const applyCorrectiveAction = (action: CorrectiveAction) => {
    const cloned: EventPlan = JSON.parse(JSON.stringify(event));

    switch (action.actionType) {
      case 'increase_budget': {
        if (action.payload?.newBudget) {
          cloned.totalBudget = action.payload.newBudget;
        }
        break;
      }
      case 'adjust_guest_count': {
        if (action.payload?.newGuestCount) {
          cloned.guestCount = action.payload.newGuestCount;
        }
        break;
      }
      case 'add_contingency': {
        const hasContingency = cloned.budgetCategories.find(c => c.isContingency || c.name.toLowerCase().includes('contingency'));
        const targetAmount = action.payload?.amount || Math.round(cloned.totalBudget * 0.10);
        if (hasContingency) {
          hasContingency.allocated = targetAmount;
        } else {
          cloned.budgetCategories.push({
            id: `cat-contingency-${Date.now()}`,
            name: 'Contingency Reserve (10%)',
            allocated: targetAmount,
            estimated: targetAmount,
            quoted: 0,
            actual: 0,
            paid: 0,
            notes: 'Created via Plan Doctor corrective action to provide unexpected cost cushion.',
            isContingency: true,
          });
        }
        break;
      }
      case 'reschedule_task': {
        // Reschedule overdue tasks 7 days forward
        const todayStr = new Date().toISOString().split('T')[0];
        cloned.tasks = cloned.tasks.map(t => {
          if (t.status !== 'completed' && t.dueDate && t.dueDate < todayStr) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            return {
              ...t,
              dueDate: nextWeek.toISOString().split('T')[0],
            };
          }
          return t;
        });
        break;
      }
      case 'resolve_accessibility': {
        // Add audit task
        cloned.tasks.push({
          id: `task-accessibility-${Date.now()}`,
          title: 'Conduct On-Site Accessibility & Ramp Walkthrough',
          description: 'Inspect step-free wheelchair routes from parking to main celebration hall.',
          phase: 'invitations_guests',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          status: 'pending',
          dependencies: [],
          reason: 'Ensures elderly and disabled attendees have unhindered access.',
        });
        break;
      }
      case 'add_missing_vendor': {
        if (action.payload?.category) {
          cloned.vendors.push({
            id: `vendor-${Date.now()}`,
            name: `Candidate ${action.payload.category} Provider`,
            category: action.payload.category,
            quotedAmount: 0,
            quoteStatus: 'pending',
            bookingStatus: 'unbooked',
            depositPaid: 0,
            balanceDue: 0,
            servicesIncluded: ['Primary operational service'],
            exclusions: [],
            setupTransportCharges: 0,
            taxAmount: 0,
            cancellationTerms: 'Pending quotation',
            notes: 'Added via Plan Doctor audit item',
            relatedTaskIds: [],
          });
        }
        break;
      }
      case 'confirm_venue_capacity': {
        // If capacity was unconfirmed, estimate default 1.25x of guest count
        if (!cloned.venueCapacity) {
          cloned.venueCapacity = Math.round(cloned.guestCount * 1.2);
        }
        break;
      }
      default:
        break;
    }

    onUpdateEvent(cloned);
    setPreviewAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Signature Banner */}
      <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-6 shadow-medium relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} />
              <span>Core Differentiator: Deterministic Plan Integrity Engine</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-navy-950">Plan Doctor Diagnostics</h1>
            <p className="text-xs text-navy-700 max-w-2xl mt-1">
              Plan Doctor runs 12 deterministic validation rules over your event model in code. It audits budget reconciliation, venue capacity safety, task dependency conflicts, and uncontracted risks without hallucinating arithmetic.
            </p>
          </div>

          {/* Transparent Readiness Indicator */}
          <div className="flex items-center gap-4 bg-ivory-50 p-4 rounded-xl border border-ivory-200 shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Transparent Readiness</span>
              <span className="text-3xl font-serif font-bold text-navy-950">{readiness.score}%</span>
              <span className={`block text-[11px] font-bold ${readiness.score >= 80 ? 'text-emerald-700' : readiness.score >= 50 ? 'text-amber-700' : 'text-red-600'}`}>
                {readiness.label}
              </span>
            </div>

            <div className="border-l border-ivory-300 pl-4 space-y-1 text-[11px] text-navy-600">
              <div>Budget Integrity: <strong className="text-navy-950">{readiness.factors.budgetIntegrity}/25</strong></div>
              <div>Venue & Capacity: <strong className="text-navy-950">{readiness.factors.venueCapacity}/20</strong></div>
              <div>Timeline & Tasks: <strong className="text-navy-950">{readiness.factors.timelineReadiness}/20</strong></div>
              <div>Vendor Bookings: <strong className="text-navy-950">{readiness.factors.vendorConfirmations}/20</strong></div>
              <div>Accessibility & Logistics: <strong className="text-navy-950">{readiness.factors.logisticsAccessibility}/15</strong></div>
            </div>
          </div>
        </div>

        {/* Unresolved Blockers Summary */}
        {readiness.unresolvedBlockers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-ivory-200 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-red-700 flex items-center gap-1">
              <AlertTriangle size={14} />
              <span>Unresolved Critical Blockers:</span>
            </span>
            {readiness.unresolvedBlockers.map((b, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-medium">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            { id: 'all', label: `All Findings (${findings.length})` },
            { id: 'critical_blocker', label: `Blockers (${readiness.blockerCount})` },
            { id: 'high_priority_risk', label: `High Risk (${readiness.highRiskCount})` },
            { id: 'warning', label: `Warnings (${readiness.warningCount})` },
            { id: 'missing_info', label: 'Missing Info' },
            { id: 'suggestion', label: 'Suggestions' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedSeverity(tab.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                selectedSeverity === tab.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-navy-700 border-ivory-300 hover:bg-ivory-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenSimulator}
          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-marigold-500 hover:bg-marigold-600 text-navy-950 flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Sliders size={14} />
          <span>Launch Change Simulator ("What if?")</span>
        </button>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-ivory-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-navy-950 text-base">No Issues in this Category</h3>
            <p className="text-xs text-navy-600 mt-1">All deterministic checks for this severity level have passed successfully.</p>
          </div>
        ) : (
          filteredFindings.map(finding => (
            <div
              key={finding.id}
              className={`p-5 rounded-2xl bg-white border shadow-soft transition-all ${
                finding.severity === 'critical_blocker'
                  ? 'border-red-300'
                  : finding.severity === 'high_priority_risk'
                    ? 'border-amber-300'
                    : 'border-ivory-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(finding.severity)}
                    <span className="text-[10px] font-mono bg-ivory-100 text-navy-600 px-2 py-0.5 rounded">
                      {finding.triggerRule}
                    </span>
                    <span className="text-[11px] text-navy-500 font-medium">
                      Category: <span className="capitalize">{finding.category}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-950 mt-1">
                    {finding.title}
                  </h3>

                  <p className="text-xs text-navy-700 leading-relaxed">
                    {finding.explanation}
                  </p>

                  <div className="pt-1 text-[11px] text-navy-500">
                    Target: <strong>{finding.affectedEntity.name || finding.affectedEntity.type}</strong>
                  </div>
                </div>

                {/* Corrective Actions Section */}
                {finding.correctiveActions.length > 0 && (
                  <div className="flex flex-col gap-2 shrink-0 sm:max-w-xs w-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy-600">
                      Recommended Action:
                    </span>
                    {finding.correctiveActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewAction({ action, finding })}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-100 hover:bg-emerald-50 hover:text-emerald-900 border border-ivory-300 hover:border-emerald-300 text-left transition-all flex items-center justify-between gap-2"
                      >
                        <span className="line-clamp-1">{action.label}</span>
                        <ArrowRight size={13} className="shrink-0 text-emerald-700" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Preview & Confirmation Modal */}
      {previewAction && (
        <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="plan-doctor-modal-title">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lifted border border-ivory-200 relative">
            <button
              onClick={() => setPreviewAction(null)}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-400 hover:text-navy-800 hover:bg-ivory-100 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 id="plan-doctor-modal-title" className="text-lg font-bold text-navy-950">Approve Plan Doctor Correction</h3>
            <p className="text-xs text-navy-600 mt-1">
              Triggered by rule: <code className="bg-ivory-100 px-1 py-0.5 rounded font-mono">{previewAction.finding.triggerRule}</code>
            </p>

            <div className="my-4 p-4 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2 text-xs">
              <span className="font-bold text-navy-950 block">{previewAction.action.label}</span>
              <p className="text-navy-700">{previewAction.action.description}</p>
            </div>

            <p className="text-[11px] text-navy-500 italic">
              Changes with meaningful consequences must be previewed and explicitly approved before being applied.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setPreviewAction(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-navy-700 hover:bg-ivory-100 border border-ivory-300"
              >
                Cancel
              </button>
              <button
                onClick={() => applyCorrectiveAction(previewAction.action)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Approve & Apply Correction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
