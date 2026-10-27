// Budget Calculation Engine for PlanSutra AI
// Deterministic financial reconciliation, cost tracking, and variance analysis

import { BudgetCategory, EventPlan } from '@/types';
import { sumRupees, toPaise, fromPaise, formatINR } from '@/lib/currency';

export interface BudgetSummary {
  totalBudget: number;
  allocatedTotal: number;
  projectedTotal: number;
  committedTotal: number;
  spentTotal: number;
  remainingTotal: number;
  isOverBudget: boolean;
  varianceAmount: number; // positive = over budget, negative = under budget
  reconciliationDifference: number; // allocatedTotal - totalBudget
  hasReconciliationMismatch: boolean;
  contingencyAmount: number;
  contingencyAllocated: number;
  categoryPercentages: { id: string; name: string; percentage: number; amount: number; isOverAllocated: boolean }[];
  savingsOpportunities: { categoryName: string; potentialSavings: number; reason: string }[];
}

/**
 * Calculates a comprehensive financial summary using integer paise arithmetic.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  categories: BudgetCategory[],
  contingencyPercent: number = 10
): BudgetSummary {
  const safeTotalBudget = Math.max(0, totalBudget || 0);

  // Calculate totals
  const allocatedAmounts = categories.map(c => Math.max(0, c.allocated || 0));
  const allocatedTotal = sumRupees(allocatedAmounts);

  // Projected calculation policy:
  // 1. If actual cost is contracted (> 0), use actual
  // 2. Else if quoted cost is available (> 0), use quoted
  // 3. Else fallback to estimated, or allocated
  const projectedAmounts = categories.map(c => {
    if (c.actual && c.actual > 0) return c.actual;
    if (c.quoted && c.quoted > 0) return c.quoted;
    if (c.estimated && c.estimated > 0) return c.estimated;
    return c.allocated || 0;
  });
  const projectedTotal = sumRupees(projectedAmounts);

  // Committed calculation: actual amounts agreed or quotes accepted
  const committedAmounts = categories.map(c => {
    if (c.actual && c.actual > 0) return c.actual;
    if (c.quoted && c.quoted > 0) return c.quoted;
    return 0;
  });
  const committedTotal = sumRupees(committedAmounts);

  // Spent calculation: amounts already paid
  const spentAmounts = categories.map(c => Math.max(0, c.paid || 0));
  const spentTotal = sumRupees(spentAmounts);

  // Remaining budget
  const remainingPaise = toPaise(safeTotalBudget) - toPaise(projectedTotal);
  const remainingTotal = fromPaise(remainingPaise);
  const isOverBudget = remainingTotal < 0;
  const varianceAmount = Math.abs(remainingTotal);

  // Reconciliation check: Does the sum of allocated categories match totalBudget?
  const diffPaise = toPaise(allocatedTotal) - toPaise(safeTotalBudget);
  const reconciliationDifference = fromPaise(diffPaise);
  const hasReconciliationMismatch = Math.abs(diffPaise) > 100; // tolerance of 1 rupee for rounding

  // Contingency
  const contingencyCategory = categories.find(c => c.isContingency || c.name.toLowerCase().includes('contingency'));
  const contingencyAllocated = contingencyCategory ? contingencyCategory.allocated : 0;
  const targetContingencyAmount = fromPaise(Math.round(toPaise(safeTotalBudget) * (contingencyPercent / 100)));

  // Category percentages & over-allocated flags
  const categoryPercentages = categories.map(c => {
    const effectiveCost = c.actual || c.quoted || c.estimated || c.allocated || 0;
    const percentage = safeTotalBudget > 0 ? Math.round((effectiveCost / safeTotalBudget) * 100) : 0;
    const isOverAllocated = c.allocated > 0 && effectiveCost > c.allocated;
    return {
      id: c.id,
      name: c.name,
      percentage,
      amount: effectiveCost,
      isOverAllocated,
    };
  });

  // Savings opportunities identification
  const savingsOpportunities: { categoryName: string; potentialSavings: number; reason: string }[] = [];
  categories.forEach(c => {
    const cost = c.actual || c.quoted || c.estimated || c.allocated || 0;
    if (cost > 0 && safeTotalBudget > 0) {
      const share = cost / safeTotalBudget;
      // If catering > 45% or decor > 25% of total budget
      if (c.name.toLowerCase().includes('catering') && share > 0.45) {
        const excess = cost - (safeTotalBudget * 0.40);
        if (excess > 0) {
          savingsOpportunities.push({
            categoryName: c.name,
            potentialSavings: Math.round(excess),
            reason: 'Catering accounts for >45% of total budget. Optimizing menu tiers or buffet stations could save significant costs.',
          });
        }
      } else if (c.name.toLowerCase().includes('decor') && share > 0.25) {
        const excess = cost - (safeTotalBudget * 0.20);
        if (excess > 0) {
          savingsOpportunities.push({
            categoryName: c.name,
            potentialSavings: Math.round(excess),
            reason: 'Decor exceeds 25% of budget. Substituting seasonal floral arrangements and modular lighting can trim up to 20%.',
          });
        }
      }
    }
  });

  return {
    totalBudget: safeTotalBudget,
    allocatedTotal,
    projectedTotal,
    committedTotal,
    spentTotal,
    remainingTotal,
    isOverBudget,
    varianceAmount,
    reconciliationDifference,
    hasReconciliationMismatch,
    contingencyAmount: targetContingencyAmount,
    contingencyAllocated,
    categoryPercentages,
    savingsOpportunities,
  };
}

/**
 * Generates CSV string for exporting the event budget.
 */
export function exportBudgetToCSV(event: EventPlan): string {
  const summary = calculateBudgetSummary(event.totalBudget, event.budgetCategories, event.contingencyReservePercent);
  
  const headers = ['Category', 'Planned (INR)', 'Estimated (INR)', 'Quoted (INR)', 'Actual (INR)', 'Paid (INR)', 'Status', 'Notes'];
  
  const rows = event.budgetCategories.map(c => {
    const effectiveCost = c.actual || c.quoted || c.estimated || c.allocated || 0;
    const status = c.paid >= effectiveCost && effectiveCost > 0 
      ? 'Fully Paid' 
      : c.paid > 0 
        ? 'Partially Paid' 
        : c.actual > 0 
          ? 'Contracted' 
          : c.quoted > 0 
            ? 'Quoted' 
            : 'Estimated';
            
    return [
      `"${c.name.replace(/"/g, '""')}"`,
      c.allocated.toString(),
      c.estimated.toString(),
      c.quoted.toString(),
      c.actual.toString(),
      c.paid.toString(),
      `"${status}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  // Summary rows
  const summaryRows = [
    '',
    `"Total Budget",${summary.totalBudget}`,
    `"Allocated Total",${summary.allocatedTotal}`,
    `"Projected Total",${summary.projectedTotal}`,
    `"Committed Total",${summary.committedTotal}`,
    `"Spent Total",${summary.spentTotal}`,
    `"Remaining Balance",${summary.remainingTotal}`,
    `"Budget Health",${summary.isOverBudget ? `"OVER BUDGET by ${formatINR(summary.varianceAmount)}"` : '"HEALTHY"'}`,
    `"Export Timestamp","${new Date().toISOString()}"`,
  ];

  return [headers.join(','), ...rows, ...summaryRows].join('\n');
}
