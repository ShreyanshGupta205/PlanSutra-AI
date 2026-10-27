import React, { useState, useMemo } from 'react';
import { EventPlan, SimulationChanges } from '@/types';
import { simulateEventChanges } from '@/features/simulator/changeSimulator';
import { formatINR } from '@/lib/currency';
import { 
  Sliders, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  CloudRain, 
  Users, 
  Coins, 
  Calendar, 
  Store, 
  ArrowRight, 
  Check 
} from 'lucide-react';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventPlan;
  onApplyChanges: (simulatedPlan: EventPlan) => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  event,
  onApplyChanges,
}) => {
  if (!isOpen) return null;

  // Simulator controls state
  const [simGuests, setSimGuests] = useState<number>(event.guestCount === 180 ? 220 : event.guestCount + 30);
  const [simBudgetReduction, setSimBudgetReduction] = useState<number>(0);
  const [simDate, setSimDate] = useState<string>(event.date || '');
  const [simVenueUnavailable, setSimVenueUnavailable] = useState<boolean>(false);
  const [simVendorCancelledId, setSimVendorCancelledId] = useState<string>('');
  const [simRainRisk, setSimRainRisk] = useState<boolean>(false);

  // Compute simulation result deterministically
  const simChanges: SimulationChanges = {
    guestCount: simGuests !== event.guestCount ? simGuests : undefined,
    budgetReductionPercent: simBudgetReduction > 0 ? simBudgetReduction : undefined,
    newEventDate: simDate !== event.date ? simDate : undefined,
    venueUnavailable: simVenueUnavailable,
    cancelledVendorId: simVendorCancelledId || undefined,
    rainRisk: simRainRisk,
  };

  const simulationResult = useMemo(() => {
    return simulateEventChanges(event, simChanges);
  }, [event, simGuests, simBudgetReduction, simDate, simVenueUnavailable, simVendorCancelledId, simRainRisk]);

  // Handle ESC key to dismiss dialog (WCAG 2.2 AA)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="simulator-modal-title">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-lifted border border-ivory-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-ivory-100 border-b border-ivory-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-marigold-500 text-navy-950 flex items-center justify-center font-bold">
              <Sliders size={18} />
            </div>
            <div>
              <h2 id="simulator-modal-title" className="text-lg font-bold text-navy-950">Event Change Simulator ("What if?")</h2>
              <p className="text-xs text-navy-600">Simulate disruptions, attendance spikes, and budget cuts without modifying your live plan.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-navy-500 hover:text-navy-950 hover:bg-ivory-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-ivory-50 border border-ivory-200 grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {/* Control 1: Guest Count (Demo Scenario 180 -> 220) */}
            <div>
              <label className="block font-bold text-navy-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-emerald-700" />
                  <span>Simulated Guests:</span>
                </span>
                <span className="text-emerald-800 font-extrabold">{simGuests} Guests</span>
              </label>
              <input
                type="range"
                min="50"
                max="400"
                step="10"
                value={simGuests}
                onChange={e => setSimGuests(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
              <span className="text-[10px] text-navy-500 block mt-0.5">
                Original: {event.guestCount} ({simGuests > event.guestCount ? `+${simGuests - event.guestCount}` : simGuests - event.guestCount})
              </span>
            </div>

            {/* Control 2: Budget Cut */}
            <div>
              <label className="block font-bold text-navy-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Coins size={14} className="text-emerald-700" />
                  <span>Budget Cut:</span>
                </span>
                <span className="text-navy-950 font-bold">{simBudgetReduction}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={simBudgetReduction}
                onChange={e => setSimBudgetReduction(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-700 cursor-pointer"
              />
              <span className="text-[10px] text-navy-500 block mt-0.5">
                Simulated Limit: {formatINR(event.totalBudget * (1 - simBudgetReduction / 100))}
              </span>
            </div>

            {/* Control 3: Rain Risk */}
            <div>
              <label className="block font-bold text-navy-800 mb-1 flex items-center gap-1">
                <CloudRain size={14} className="text-emerald-700" />
                <span>Weather Disruption:</span>
              </label>
              <button
                type="button"
                onClick={() => setSimRainRisk(!simRainRisk)}
                className={`w-full py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                  simRainRisk
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-navy-700 border-ivory-300 hover:bg-ivory-100'
                }`}
              >
                {simRainRisk ? 'Rain Risk Active (Tents Added)' : 'Fair Weather Assumed'}
              </button>
            </div>

            {/* Control 4: Vendor Cancellation */}
            <div>
              <label className="block font-bold text-navy-800 mb-1 flex items-center gap-1">
                <Store size={14} className="text-emerald-700" />
                <span>Simulate Vendor Cancellation:</span>
              </label>
              <select
                value={simVendorCancelledId}
                onChange={e => setSimVendorCancelledId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-ivory-300 bg-white"
              >
                <option value="">None (All Vendors Intact)</option>
                {event.vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Control 5: Venue Unavailable */}
            <div>
              <label className="block font-bold text-navy-800 mb-1">Venue Disruption:</label>
              <button
                type="button"
                onClick={() => setSimVenueUnavailable(!simVenueUnavailable)}
                className={`w-full py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                  simVenueUnavailable
                    ? 'bg-red-600 text-white border-red-700 shadow-sm'
                    : 'bg-white text-navy-700 border-ivory-300 hover:bg-ivory-100'
                }`}
              >
                {simVenueUnavailable ? 'Venue Cancelled / Unavailable' : 'Venue Confirmed'}
              </button>
            </div>

            {/* Reset Defaults */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSimGuests(event.guestCount);
                  setSimBudgetReduction(0);
                  setSimDate(event.date);
                  setSimVenueUnavailable(false);
                  setSimVendorCancelledId('');
                  setSimRainRisk(false);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-navy-600 hover:text-navy-950 underline"
              >
                Reset Simulator Values
              </button>
            </div>
          </div>

          {/* Impact Overview Strip */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Projected Budget Impact</span>
              <span className={`text-xl font-bold font-serif ${simulationResult.budgetDifference > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {simulationResult.budgetDifference > 0 ? `+${formatINR(simulationResult.budgetDifference)}` : formatINR(simulationResult.budgetDifference)}
              </span>
              <span className="text-[11px] text-navy-600 block mt-0.5">
                Total Projected: {formatINR(event.totalBudget + simulationResult.budgetDifference)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Newly Triggered Risks</span>
              <span className="text-xl font-bold font-serif text-amber-700">
                {simulationResult.newFindings.length} New Warning{simulationResult.newFindings.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-navy-600 block mt-0.5">
                Detected by Plan Doctor
              </span>
            </div>

            <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Affected Categories</span>
              <span className="text-xl font-bold font-serif text-navy-900">
                {simulationResult.affectedCategories.length} Categories
              </span>
              <span className="text-[11px] text-navy-600 block mt-0.5">
                Automatically recalculated
              </span>
            </div>
          </div>

          {/* Recalculated Categories Table */}
          {simulationResult.affectedCategories.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-navy-950 mb-2">Category Recalculations</h3>
              <div className="border border-ivory-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-ivory-100 text-navy-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Original Cost</th>
                      <th className="p-2.5">Simulated Cost</th>
                      <th className="p-2.5">Difference</th>
                      <th className="p-2.5">Recalculation Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-100">
                    {simulationResult.affectedCategories.map((c, i) => (
                      <tr key={i} className="hover:bg-ivory-50/50">
                        <td className="p-2.5 font-semibold text-navy-900">{c.categoryName}</td>
                        <td className="p-2.5 text-navy-600">{formatINR(c.originalCost)}</td>
                        <td className="p-2.5 font-bold text-navy-900">{formatINR(c.simulatedCost)}</td>
                        <td className={`p-2.5 font-bold ${c.difference > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {c.difference > 0 ? `+${formatINR(c.difference)}` : formatINR(c.difference)}
                        </td>
                        <td className="p-2.5 text-navy-600 italic">{c.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* New Plan Doctor Findings Triggered */}
          {simulationResult.newFindings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                <span>New Risks Flagged by Plan Doctor:</span>
              </h3>
              <div className="space-y-1.5 text-xs">
                {simulationResult.newFindings.map((f, i) => (
                  <div key={i} className="p-2 rounded bg-white/80 border border-amber-200 text-amber-950">
                    <strong>{f.title}: </strong>
                    <span>{f.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions Made */}
          <div className="text-xs text-navy-600">
            <strong>Simulation Assumptions: </strong>
            <span>{simulationResult.assumptions.join(' ')}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-ivory-50 border-t border-ivory-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-navy-700 hover:bg-ivory-200"
          >
            Discard Simulation
          </button>

          <button
            onClick={() => {
              onApplyChanges(simulationResult.simulatedPlan);
              onClose();
            }}
            id="apply-simulation-btn"
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Apply Simulated Changes to Real Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
