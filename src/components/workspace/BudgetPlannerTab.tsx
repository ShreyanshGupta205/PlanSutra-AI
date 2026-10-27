import React, { useState } from 'react';
import { EventPlan, BudgetCategory } from '@/types';
import { calculateBudgetSummary, exportBudgetToCSV } from '@/features/budget/budgetCalculations';
import { formatINR } from '@/lib/currency';
import { 
  Calculator, 
  Plus, 
  Download, 
  Trash2, 
  Edit2, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  Coins, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface BudgetPlannerTabProps {
  event: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
}

export const BudgetPlannerTab: React.FC<BudgetPlannerTabProps> = ({
  event,
  onUpdateEvent,
}) => {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatAllocated, setNewCatAllocated] = useState<number>(10000);
  const [newCatNotes, setNewCatNotes] = useState<string>('');

  // Editing state for active category
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editQuoted, setEditQuoted] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);
  const [editPaid, setEditPaid] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  const summary = calculateBudgetSummary(
    event.totalBudget,
    event.budgetCategories,
    event.contingencyReservePercent
  );

  const startEditing = (cat: BudgetCategory) => {
    setEditingCategoryId(cat.id);
    setEditAllocated(cat.allocated || 0);
    setEditQuoted(cat.quoted || 0);
    setEditActual(cat.actual || 0);
    setEditPaid(cat.paid || 0);
    setEditNotes(cat.notes || '');
  };

  const saveEditing = (catId: string) => {
    const updatedCategories = event.budgetCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          allocated: Math.max(0, editAllocated),
          quoted: Math.max(0, editQuoted),
          actual: Math.max(0, editActual),
          paid: Math.max(0, editPaid),
          notes: editNotes,
        };
      }
      return c;
    });

    onUpdateEvent({
      ...event,
      budgetCategories: updatedCategories,
    });
    setEditingCategoryId(null);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;

    const newCategory: BudgetCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      allocated: Math.max(0, newCatAllocated),
      estimated: Math.max(0, newCatAllocated),
      quoted: 0,
      actual: 0,
      paid: 0,
      notes: newCatNotes,
    };

    onUpdateEvent({
      ...event,
      budgetCategories: [...event.budgetCategories, newCategory],
    });

    setNewCatName('');
    setNewCatAllocated(10000);
    setNewCatNotes('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catId: string) => {
    const filtered = event.budgetCategories.filter(c => c.id !== catId);
    onUpdateEvent({
      ...event,
      budgetCategories: filtered,
    });
  };

  const handleDownloadCSV = () => {
    const csvData = exportBudgetToCSV(event);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_budget.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Total Budget Limit</span>
          <p className="text-xl font-serif font-bold text-navy-950">{formatINR(summary.totalBudget)}</p>
          <p className="text-[11px] text-navy-500 mt-0.5">Authorised ceiling</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Projected Total</span>
          <p className={`text-xl font-serif font-bold ${summary.isOverBudget ? 'text-red-600' : 'text-emerald-800'}`}>
            {formatINR(summary.projectedTotal)}
          </p>
          <p className="text-[11px] text-navy-500 mt-0.5">
            {summary.isOverBudget ? `Over by ${formatINR(summary.varianceAmount)}` : `${formatINR(summary.remainingTotal)} balance`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Contracted & Paid</span>
          <p className="text-xl font-serif font-bold text-navy-950">{formatINR(summary.spentTotal)}</p>
          <p className="text-[11px] text-navy-500 mt-0.5">Committed: {formatINR(summary.committedTotal)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-ivory-200 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-600 block mb-1">Contingency Buffer</span>
          <p className="text-xl font-serif font-bold text-navy-950">{formatINR(summary.contingencyAllocated)}</p>
          <p className="text-[11px] text-navy-500 mt-0.5">{event.contingencyReservePercent}% emergency reserve</p>
        </div>
      </div>

      {/* Warnings & Alerts */}
      {summary.isOverBudget && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm block">Budget Overrun Detected</span>
            Your projected commitments ({formatINR(summary.projectedTotal)}) exceed your available budget of {formatINR(summary.totalBudget)} by {formatINR(summary.varianceAmount)}. Reduce category allocations or adjust guest assumptions.
          </div>
        </div>
      )}

      {summary.hasReconciliationMismatch && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-sm block">Unreconciled Budget Allocation</span>
            The sum of all planned category allocations ({formatINR(summary.allocatedTotal)}) does not reconcile with the total event budget ({formatINR(summary.totalBudget)}). Difference: {formatINR(Math.abs(summary.reconciliationDifference))}.
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-navy-950">Category Allocations & Cash Flow</h2>
          <p className="text-xs text-navy-600">Track and adjust planned vs actual vendor costs. Sub-rupee precision is reconciled deterministically.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingCategory(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus size={15} />
            <span>Add Category</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-ivory-100 text-navy-800 border border-ivory-300 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-soft space-y-3">
          <h3 className="font-bold text-sm text-navy-950">Add New Budget Category</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Traditional Folk Troupe"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Planned Amount (INR)</label>
              <input
                type="number"
                value={newCatAllocated}
                onChange={e => setNewCatAllocated(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
            <div>
              <label className="block text-navy-700 font-semibold mb-1">Notes / Scope</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={newCatNotes}
                onChange={e => setNewCatNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-ivory-300"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddingCategory(false)}
              className="px-3 py-1.5 rounded text-xs font-semibold text-navy-600 hover:bg-ivory-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCategory}
              className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
            >
              Save Category
            </button>
          </div>
        </div>
      )}

      {/* Main Budget Categories Table */}
      <div className="bg-white rounded-2xl border border-ivory-200 shadow-soft overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-ivory-100/80 border-b border-ivory-200 text-navy-700 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-3">Planned (₹)</th>
              <th className="py-3 px-3">Quoted (₹)</th>
              <th className="py-3 px-3">Contracted (₹)</th>
              <th className="py-3 px-3">Paid (₹)</th>
              <th className="py-3 px-3">Share</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ivory-100">
            {event.budgetCategories.map(cat => {
              const effectiveCost = cat.actual || cat.quoted || cat.estimated || cat.allocated || 0;
              const isOverAllocated = cat.allocated > 0 && effectiveCost > cat.allocated;
              const sharePercent = summary.totalBudget > 0 ? Math.round((effectiveCost / summary.totalBudget) * 100) : 0;
              const isEditing = editingCategoryId === cat.id;

              return (
                <tr key={cat.id} className={`hover:bg-ivory-50/60 ${isOverAllocated ? 'bg-red-50/30' : ''}`}>
                  <td className="py-3 px-4 font-semibold text-navy-950">
                    <div className="flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.isContingency && (
                        <span className="text-[10px] bg-marigold-100 text-marigold-800 px-1.5 py-0.5 rounded font-bold">
                          Contingency
                        </span>
                      )}
                    </div>
                    {cat.costPerGuestApplicable && cat.costPerGuestAmount && (
                      <span className="text-[10px] text-navy-500 block">
                        ₹{Math.round(cat.costPerGuestAmount)}/guest rate
                      </span>
                    )}
                    {cat.notes && !isEditing && (
                      <span className="text-[11px] text-navy-500 block line-clamp-1">{cat.notes}</span>
                    )}
                  </td>

                  {/* Planned */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editAllocated}
                        onChange={e => setEditAllocated(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-2 py-1 rounded border border-ivory-300 text-xs"
                      />
                    ) : (
                      formatINR(cat.allocated)
                    )}
                  </td>

                  {/* Quoted */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editQuoted}
                        onChange={e => setEditQuoted(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-2 py-1 rounded border border-ivory-300 text-xs"
                      />
                    ) : cat.quoted > 0 ? (
                      <span className="text-navy-900 font-medium">{formatINR(cat.quoted)}</span>
                    ) : (
                      <span className="text-navy-400 italic">—</span>
                    )}
                  </td>

                  {/* Contracted / Actual */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editActual}
                        onChange={e => setEditActual(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-2 py-1 rounded border border-ivory-300 text-xs"
                      />
                    ) : cat.actual > 0 ? (
                      <span className={`font-semibold ${isOverAllocated ? 'text-red-600' : 'text-emerald-800'}`}>
                        {formatINR(cat.actual)}
                      </span>
                    ) : (
                      <span className="text-navy-400 italic">—</span>
                    )}
                  </td>

                  {/* Paid */}
                  <td className="py-3 px-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPaid}
                        onChange={e => setEditPaid(parseInt(e.target.value, 10) || 0)}
                        className="w-24 px-2 py-1 rounded border border-ivory-300 text-xs"
                      />
                    ) : cat.paid > 0 ? (
                      <span className="text-navy-900 font-semibold">{formatINR(cat.paid)}</span>
                    ) : (
                      <span className="text-navy-400">₹0</span>
                    )}
                  </td>

                  {/* Share % */}
                  <td className="py-3 px-3">
                    <span className="font-medium text-navy-700">{sharePercent}%</span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEditing(cat.id)}
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                          title="Save Changes"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 text-navy-500">
                        <button
                          onClick={() => startEditing(cat)}
                          className="p-1 hover:text-navy-950 hover:bg-ivory-100 rounded"
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                        {!cat.isContingency && (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Savings Opportunities Identified */}
      {summary.savingsOpportunities.length > 0 && (
        <div className="p-4 rounded-xl bg-ivory-100 border border-ivory-200">
          <h3 className="font-bold text-xs uppercase tracking-wider text-navy-800 flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-marigold-600" />
            <span>Deterministic Savings Opportunities</span>
          </h3>
          <div className="space-y-2">
            {summary.savingsOpportunities.map((opp, idx) => (
              <div key={idx} className="text-xs text-navy-700 flex items-start gap-2">
                <span className="font-bold text-emerald-800 shrink-0">Save up to {formatINR(opp.potentialSavings)}:</span>
                <span>{opp.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
