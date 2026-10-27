import React, { useState } from 'react';
import { EventPlan } from '@/types';
import { OverviewTab } from './OverviewTab';
import { BudgetPlannerTab } from './BudgetPlannerTab';
import { TimelineTab } from './TimelineTab';
import { VendorManagerTab } from './VendorManagerTab';
import { PlanDoctorTab } from './PlanDoctorTab';
import { DayOfRunSheetTab } from './DayOfRunSheetTab';
import { SimulatorModal } from './SimulatorModal';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { runPlanDoctor } from '@/features/plan-doctor/planDoctorRules';
import { exportBudgetToCSV } from '@/features/budget/budgetCalculations';
import { exportCalendarICS, exportEventToJSON } from '@/lib/storage';
import { Logo } from '../common/Logo';
import { 
  LayoutDashboard, 
  Calculator, 
  CalendarClock, 
  Store, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  Sparkles, 
  Download, 
  Printer, 
  CheckCircle2, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

interface EventWorkspaceProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
  onBackToDashboard: () => void;
}

export const EventWorkspace: React.FC<EventWorkspaceProps> = ({
  event,
  onUpdateEvent,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Trigger Plan Doctor for navigation badges
  const { findings, readiness } = runPlanDoctor(event);
  const criticalBlockers = findings.filter(f => f.severity === 'critical_blocker');

  const handleUpdate = (updated: EventPlan) => {
    setSaveStatus('saving');
    onUpdateEvent(updated);
    setTimeout(() => setSaveStatus('saved'), 400);
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Planner', icon: Calculator },
    { id: 'timeline', label: 'Timeline & Tasks', icon: CalendarClock },
    { id: 'vendors', label: 'Vendors & Quotes', icon: Store },
    { id: 'doctor', label: 'Plan Doctor', icon: ShieldCheck, badge: criticalBlockers.length > 0 ? criticalBlockers.length : undefined },
    { id: 'runsheet', label: 'Day-Of Run Sheet', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-ivory-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="p-1.5 rounded-lg text-navy-600 hover:text-navy-950 hover:bg-ivory-100 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Return to Dashboard"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">My Events</span>
            </button>
            <div className="h-5 w-px bg-ivory-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-navy-950 text-base line-clamp-1">{event.name}</span>
              <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} />
                <span>{saveStatus === 'saved' ? 'Saved locally' : 'Saving...'}</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Simulator Trigger */}
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-marigold-100 hover:bg-marigold-200 text-marigold-900 border border-marigold-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              title="Launch What If Simulation"
            >
              <Sliders size={14} className="text-marigold-700" />
              <span className="hidden sm:inline">Simulator</span>
            </button>

            {/* AI Assistant Trigger */}
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-emerald-700" />
              <span>AI Assistant</span>
            </button>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-ivory-100 text-navy-800 border border-ivory-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown size={13} />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lifted border border-ivory-200 py-1.5 z-40 text-xs">
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      const csv = exportBudgetToCSV(event);
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_budget.csv`;
                      a.click();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-ivory-100 text-navy-800 font-medium"
                  >
                    CSV Budget Export
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportCalendarICS(event);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-ivory-100 text-navy-800 font-medium"
                  >
                    Calendar (.ics) Sync
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      exportEventToJSON(event);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-ivory-100 text-navy-800 font-medium"
                  >
                    JSON Offline Backup
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      setActiveTab('runsheet');
                      setTimeout(() => window.print(), 300);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-ivory-100 text-navy-800 font-medium border-t border-ivory-100"
                  >
                    Print Run Sheet Kit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-ivory-100 scrollbar-none">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-700 text-emerald-800 font-bold'
                    : 'border-transparent text-navy-600 hover:text-navy-950 hover:border-ivory-300'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-emerald-700' : 'text-navy-500'} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            event={event}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetPlannerTab
            event={event}
            onUpdateEvent={handleUpdate}
          />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab
            event={event}
            onUpdateEvent={handleUpdate}
          />
        )}
        {activeTab === 'vendors' && (
          <VendorManagerTab
            event={event}
            onUpdateEvent={handleUpdate}
          />
        )}
        {activeTab === 'doctor' && (
          <PlanDoctorTab
            event={event}
            onUpdateEvent={handleUpdate}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}
        {activeTab === 'runsheet' && (
          <DayOfRunSheetTab
            event={event}
            onUpdateEvent={handleUpdate}
          />
        )}
      </main>

      {/* Modals and Drawers */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        event={event}
        onApplyChanges={handleUpdate}
      />

      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        event={event}
      />
    </div>
  );
};
