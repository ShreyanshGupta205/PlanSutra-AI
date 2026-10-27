import React from 'react';
import { EventPlan } from '@/types';
import { calculateBudgetSummary } from '@/features/budget/budgetCalculations';
import { runPlanDoctor } from '@/features/plan-doctor/planDoctorRules';
import { formatINR } from '@/lib/currency';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Store, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Sparkles,
  Info
} from 'lucide-react';

interface OverviewTabProps {
  event: EventPlan;
  onNavigateTab: (tab: string) => void;
  onOpenSimulator: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  event,
  onNavigateTab,
  onOpenSimulator,
}) => {
  const budgetSummary = calculateBudgetSummary(
    event.totalBudget,
    event.budgetCategories,
    event.contingencyReservePercent
  );

  const { findings, readiness } = runPlanDoctor(event);
  const criticalBlockers = findings.filter(f => f.severity === 'critical_blocker');
  const highRisks = findings.filter(f => f.severity === 'high_priority_risk');

  // Days until event calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = event.date ? new Date(event.date) : null;
  const daysUntil = eventDate
    ? Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Upcoming tasks (due in next 14 days, not completed)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingTasks = event.tasks
    .filter(t => t.status !== 'completed' && t.dueDate && t.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const overdueTasks = event.tasks.filter(
    t => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
  );

  // Vendor status breakdown
  const confirmedVendors = event.vendors.filter(v => v.bookingStatus === 'confirmed');
  const pendingVendors = event.vendors.filter(v => v.bookingStatus !== 'confirmed');

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-medium relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                {event.type.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-marigold-500/90 text-navy-950">
                {event.setting} setting
              </span>
              {event.isDemo && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-marigold-400 text-navy-950 uppercase tracking-wider">
                  Demo Blueprint
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              {event.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ivory-200">
              <div className="flex items-center gap-1.5">
                <Calendar size={16} className="text-marigold-400" />
                <span>{event.date || 'Date not set'} ({event.startTime || 'Time unset'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-marigold-400" />
                <span>{event.venueName || 'Venue TBD'}, {event.city}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-marigold-400" />
                <span>{event.guestCount} Guests {event.venueCapacity ? `(Hall Cap: ${event.venueCapacity})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Countdown & Quick Action */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center">
              <span className="text-xs uppercase tracking-wider text-ivory-300 block font-semibold">Countdown</span>
              <span className="text-2xl font-bold font-serif text-white">
                {daysUntil > 0 ? `${daysUntil} Days Left` : daysUntil === 0 ? 'Today!' : 'Event Passed'}
              </span>
            </div>

            <button
              onClick={onOpenSimulator}
              className="px-4 py-2 rounded-xl bg-marigold-500 hover:bg-marigold-600 text-navy-950 font-bold text-xs shadow-soft transition-all flex items-center gap-1.5"
            >
              <Sparkles size={15} />
              <span>Test "What If?" Scenarios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Doctor Alert Strip */}
      {criticalBlockers.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="font-bold text-sm">Plan Doctor: {criticalBlockers.length} Critical Blocker{criticalBlockers.length > 1 ? 's' : ''} Identified</p>
              <p className="text-xs text-red-800 mt-0.5">{criticalBlockers[0].explanation}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('doctor')}
            className="px-3.5 py-1.5 rounded-lg bg-red-700 text-white font-semibold text-xs shrink-0 hover:bg-red-800 transition-colors"
          >
            Resolve in Plan Doctor →
          </button>
        </div>
      )}

      {/* Top 3 Core Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Metric 1: Budget */}
        <div className="bg-white p-5 rounded-2xl border border-ivory-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600">Budget Integrity</span>
              <button 
                onClick={() => onNavigateTab('budget')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>View Budget</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="text-2xl font-serif font-bold text-navy-950">
              {formatINR(budgetSummary.projectedTotal)}
            </div>
            <p className="text-xs text-navy-600 mt-0.5">
              of {formatINR(event.totalBudget)} defined ceiling
            </p>

            <div className="mt-4 w-full bg-ivory-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${budgetSummary.isOverBudget ? 'bg-red-500' : 'bg-emerald-600'}`}
                style={{ width: `${Math.min(100, (budgetSummary.projectedTotal / (event.totalBudget || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ivory-200 flex justify-between items-center text-xs">
            <span className="text-navy-600">Committed / Contracted:</span>
            <span className="font-semibold text-navy-900">{formatINR(budgetSummary.committedTotal)}</span>
          </div>
        </div>

        {/* Metric 2: Plan Readiness Score */}
        <div className="bg-white p-5 rounded-2xl border border-ivory-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600">Readiness Score</span>
              <button 
                onClick={() => onNavigateTab('doctor')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Plan Doctor</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-navy-950">{readiness.score}/100</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                readiness.score >= 80 ? 'bg-emerald-100 text-emerald-800' : readiness.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {readiness.label}
              </span>
            </div>
            <p className="text-xs text-navy-600 mt-0.5">
              Deterministic validation of venue, dates, vendors & budget
            </p>

            <div className="mt-3 grid grid-cols-5 gap-1 text-[10px] text-center text-navy-600 font-medium">
              <div className="p-1 rounded bg-ivory-100" title="Budget Integrity">Budget: {readiness.factors.budgetIntegrity}/25</div>
              <div className="p-1 rounded bg-ivory-100" title="Venue Capacity">Venue: {readiness.factors.venueCapacity}/20</div>
              <div className="p-1 rounded bg-ivory-100" title="Timeline Tasks">Tasks: {readiness.factors.timelineReadiness}/20</div>
              <div className="p-1 rounded bg-ivory-100" title="Vendor Contracts">Vendors: {readiness.factors.vendorConfirmations}/20</div>
              <div className="p-1 rounded bg-ivory-100" title="Logistics & Access">Access: {readiness.factors.logisticsAccessibility}/15</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ivory-200 text-xs text-navy-600 flex justify-between">
            <span>Critical Blockers:</span>
            <span className={`font-bold ${criticalBlockers.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {criticalBlockers.length} issues
            </span>
          </div>
        </div>

        {/* Metric 3: Vendor Booking Status */}
        <div className="bg-white p-5 rounded-2xl border border-ivory-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600">Vendor Execution</span>
              <button 
                onClick={() => onNavigateTab('vendors')}
                className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Vendor Manager</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="text-2xl font-serif font-bold text-navy-950">
              {confirmedVendors.length} / {event.vendors.length}
            </div>
            <p className="text-xs text-navy-600 mt-0.5">
              Service suppliers with finalized contracts
            </p>

            <div className="mt-4 w-full bg-ivory-200 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${event.vendors.length > 0 ? (confirmedVendors.length / event.vendors.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ivory-200 flex justify-between items-center text-xs text-navy-600">
            <span>Pending Sign-off:</span>
            <span className="font-semibold text-amber-700">{pendingVendors.length} pending</span>
          </div>
        </div>
      </div>

      {/* Two-Column Detail Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Tasks Due Soon */}
        <div className="bg-white rounded-2xl border border-ivory-200 shadow-soft p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-navy-950 flex items-center gap-2">
              <Clock size={18} className="text-emerald-700" />
              <span>Priority Tasks Due Soon</span>
            </h3>
            <button
              onClick={() => onNavigateTab('timeline')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              All Tasks ({event.tasks.length}) →
            </button>
          </div>

          {overdueTasks.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-700 shrink-0" />
              <span><strong>{overdueTasks.length} task(s) overdue!</strong> Review timeline to reschedule.</span>
            </div>
          )}

          <div className="space-y-2.5">
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-navy-600 py-4 text-center">No upcoming tasks due in the next 14 days.</p>
            ) : (
              upcomingTasks.map(task => (
                <div key={task.id} className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-navy-900">{task.title}</p>
                    <p className="text-navy-600 mt-0.5 line-clamp-1">{task.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-navy-500">
                      <span>Due: {task.dueDate}</span>
                      {task.assignedTo && <span>• Assigned: {task.assignedTo}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    task.priority === 'critical' ? 'bg-red-100 text-red-800' : task.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-ivory-200 text-navy-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Cultural & Personalization Highlights */}
        <div className="bg-white rounded-2xl border border-ivory-200 shadow-soft p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-navy-950 flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-marigold-600" />
              <span>Theme, Aesthetics & Logistics</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Theme & Color Palette</span>
                <p className="text-navy-900 font-semibold">{event.personalization.themeStyle || 'Curated Classic'}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(event.personalization.colors || []).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-ivory-300 text-navy-800 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Dietary & Sustainability Requirements</span>
                <p className="text-navy-800">
                  {event.personalization.foodDietary?.join(', ') || 'Standard menu'} • {event.personalization.sustainability || 'Standard compliance'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Accessibility Provisions</span>
                <p className="text-navy-800">
                  {event.personalization.accessibility?.join(', ') || 'No special accessibility requirements recorded'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between text-xs text-navy-600">
            <span>Last modified: {new Date(event.updatedAt).toLocaleDateString()}</span>
            <span>Version {event.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
