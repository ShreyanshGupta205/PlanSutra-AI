import React, { useState } from 'react';
import { EventPlan } from '@/types';
import { calculateBudgetSummary } from '@/features/budget/budgetCalculations';
import { runPlanDoctor } from '@/features/plan-doctor/planDoctorRules';
import { formatINR } from '@/lib/currency';
import { exportEventToJSON } from '@/lib/storage';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Trash2, 
  Copy, 
  Download, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface UserDashboardProps {
  events: EventPlan[];
  onOpenEvent: (id: string) => void;
  onCreateEvent: () => void;
  onDuplicateEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onLoadDemoEvent: () => void;
  onBackToLanding: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  events,
  onOpenEvent,
  onCreateEvent,
  onDuplicateEvent,
  onDeleteEvent,
  onLoadDemoEvent,
  onBackToLanding,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ivory-200">
        <div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onBackToLanding}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              ← Back to Overview
            </button>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy-950 mt-1">Celebration Workspace</h1>
          <p className="text-sm text-navy-700">Manage all your upcoming celebrations, budgets, and operational run sheets.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreateEvent}
            id="dashboard-create-event-btn"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="my-16 text-center max-w-md mx-auto p-8 rounded-2xl bg-white border border-ivory-200 shadow-soft">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl font-bold text-navy-950 mb-2">No Celebrations Planned Yet</h2>
          <p className="text-sm text-navy-700 mb-6">
            Get started by launching a new event wizard, or load the pre-configured community celebration demo to explore Plan Doctor.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={onCreateEvent}
              className="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors"
            >
              Start From Scratch
            </button>
            <button
              onClick={onLoadDemoEvent}
              className="w-full py-2.5 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-navy-900 border border-ivory-300 font-semibold text-sm transition-colors"
            >
              Load Demo Event (180 Guests, ₹1.5L)
            </button>
          </div>
        </div>
      ) : (
        /* Event Cards Grid */
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const summary = calculateBudgetSummary(event.totalBudget, event.budgetCategories, event.contingencyReservePercent);
            const { findings, readiness } = runPlanDoctor(event);
            const blockers = findings.filter(f => f.severity === 'critical_blocker');
            const confirmedVendors = event.vendors.filter(v => v.bookingStatus === 'confirmed').length;
            const overdueTasks = event.tasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]).length;

            return (
              <div 
                key={event.id}
                className="bg-white rounded-2xl border border-ivory-200 hover:border-emerald-300 shadow-soft hover:shadow-medium transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-5 pb-3 border-b border-ivory-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                        {event.type.replace('_', ' ')}
                      </span>
                      {event.isDemo && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-marigold-100 text-marigold-800 border border-marigold-200">
                          Demo Blueprint
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-xl text-navy-950 line-clamp-1">
                      {event.name}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-navy-700">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-emerald-700" />
                        <span>{event.date || 'Date unset'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-emerald-700" />
                        <span>{event.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-emerald-700" />
                        <span>{event.guestCount} Guests</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Operational Progress */}
                  <div className="p-5 space-y-4">
                    {/* Budget Snapshot */}
                    <div>
                      <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="text-navy-700">Budget Projected:</span>
                        <span className={`font-semibold ${summary.isOverBudget ? 'text-red-600' : 'text-navy-950'}`}>
                          {formatINR(summary.projectedTotal)} / {formatINR(event.totalBudget)}
                        </span>
                      </div>
                      <div className="w-full bg-ivory-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            summary.isOverBudget 
                              ? 'bg-red-500' 
                              : summary.projectedTotal / event.totalBudget > 0.85 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, (summary.projectedTotal / (event.totalBudget || 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[11px] text-navy-600">
                        <span>Paid: {formatINR(summary.spentTotal)}</span>
                        <span>
                          {summary.isOverBudget ? (
                            <span className="text-red-600 font-semibold">Over by {formatINR(summary.varianceAmount)}</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">{formatINR(summary.remainingTotal)} left</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Operational Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2 rounded-lg bg-ivory-50 border border-ivory-200 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${readiness.score >= 80 ? 'bg-emerald-500' : readiness.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-[10px] text-navy-600 font-medium">Readiness</p>
                          <p className="font-bold text-navy-900">{readiness.score}% ({readiness.label})</p>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-ivory-50 border border-ivory-200 flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-700" />
                        <div>
                          <p className="text-[10px] text-navy-600 font-medium">Vendors</p>
                          <p className="font-bold text-navy-900">{confirmedVendors} / {event.vendors.length} Booked</p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Doctor Alerts Banner */}
                    {blockers.length > 0 ? (
                      <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                        <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{blockers.length} Critical Issue{blockers.length > 1 ? 's' : ''}: </span>
                          <span className="line-clamp-1">{blockers[0].title}</span>
                        </div>
                      </div>
                    ) : overdueTasks > 0 ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                        <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>{overdueTasks} overdue planning task{overdueTasks > 1 ? 's' : ''} require attention.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-700" />
                        <span>Plan Doctor verified. No critical blockers.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-ivory-50/70 border-t border-ivory-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-navy-600">
                    <button
                      onClick={() => onDuplicateEvent(event.id)}
                      className="p-1.5 rounded-md hover:bg-white hover:text-navy-900 border border-transparent hover:border-ivory-300 transition-colors"
                      title="Duplicate Event"
                      aria-label="Duplicate Event"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => exportEventToJSON(event)}
                      className="p-1.5 rounded-md hover:bg-white hover:text-navy-900 border border-transparent hover:border-ivory-300 transition-colors"
                      title="Export Backup (JSON)"
                      aria-label="Export Backup"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(event.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-colors"
                      title="Delete Event"
                      aria-label="Delete Event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenEvent(event.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Open Workspace</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-event-modal-title">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-lifted border border-ivory-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 id="delete-event-modal-title" className="text-lg font-bold text-navy-950">Delete Event Plan?</h3>
            <p className="text-sm text-navy-700 mt-2">
              Are you sure you want to permanently delete this event plan? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-navy-700 hover:bg-ivory-100 border border-ivory-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEvent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
