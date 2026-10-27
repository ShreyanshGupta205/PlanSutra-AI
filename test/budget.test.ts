import { describe, it, expect } from 'vitest';
import { calculateBudgetSummary, exportBudgetToCSV } from '../src/features/budget/budgetCalculations';
import { formatINR, toPaise, fromPaise, sumRupees } from '../src/lib/currency';
import { DEMO_COMMUNITY_EVENT } from '../src/features/events/sampleData';

describe('Currency and Arithmetic Utilities', () => {
  it('formats Indian Rupees with proper grouping (lakhs & crores)', () => {
    expect(formatINR(150000)).toBe('₹1,50,000');
    expect(formatINR(10000000)).toBe('₹1,00,00,000');
    expect(formatINR(500)).toBe('₹500');
    expect(formatINR(0)).toBe('₹0');
    expect(formatINR(-15000)).toBe('-₹15,000');
  });

  it('converts to/from integer paise without float drift', () => {
    expect(toPaise(100.55)).toBe(10055);
    expect(fromPaise(10055)).toBe(100.55);
  });

  it('sums rupee arrays deterministically', () => {
    const amounts = [60000, 30000, 20000, 15000, 10000, 15000];
    expect(sumRupees(amounts)).toBe(150000);
  });
});

describe('Budget Calculation Engine', () => {
  it('calculates totals and remaining balance correctly for reconciled budget', () => {
    const summary = calculateBudgetSummary(
      DEMO_COMMUNITY_EVENT.totalBudget,
      DEMO_COMMUNITY_EVENT.budgetCategories,
      DEMO_COMMUNITY_EVENT.contingencyReservePercent
    );

    expect(summary.totalBudget).toBe(150000);
    expect(summary.allocatedTotal).toBe(150000);
    expect(summary.isOverBudget).toBe(false);
    expect(summary.hasReconciliationMismatch).toBe(false);
    expect(summary.reconciliationDifference).toBe(0);
    // In DEMO_COMMUNITY_EVENT, decor was quoted at 18,000 vs 20,000 planned, so projected is 148,000 and remaining is 2,000
    expect(summary.projectedTotal).toBe(148000);
    expect(summary.remainingTotal).toBe(2000);
  });

  it('detects over-budget situation when actual/projected exceeds total budget', () => {
    const modifiedCategories = JSON.parse(JSON.stringify(DEMO_COMMUNITY_EVENT.budgetCategories));
    // Increase catering actual to 85,000 (85k + 30k + 18k + 15k + 10k + 15k = 173,000)
    modifiedCategories[0].actual = 85000;

    const summary = calculateBudgetSummary(150000, modifiedCategories, 10);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.projectedTotal).toBe(173000);
    expect(summary.remainingTotal).toBe(-23000);
    expect(summary.varianceAmount).toBe(23000);
  });

  it('detects unreconciled allocations when category sum does not equal total budget', () => {
    const categories = [
      { id: '1', name: 'Venue', allocated: 50000, estimated: 50000, quoted: 0, actual: 0, paid: 0 },
      { id: '2', name: 'Catering', allocated: 40000, estimated: 40000, quoted: 0, actual: 0, paid: 0 },
    ];
    // Total budget is 100,000 but allocations sum to 90,000
    const summary = calculateBudgetSummary(100000, categories, 10);
    expect(summary.hasReconciliationMismatch).toBe(true);
    expect(summary.reconciliationDifference).toBe(-10000);
  });

  it('calculates contingency target reserve correctly', () => {
    const summary = calculateBudgetSummary(150000, DEMO_COMMUNITY_EVENT.budgetCategories, 10);
    expect(summary.contingencyAmount).toBe(15000);
  });

  it('identifies savings opportunities when a category exceeds recommended threshold', () => {
    const categories = [
      { id: '1', name: 'Catering Feast', allocated: 80000, estimated: 80000, quoted: 0, actual: 80000, paid: 0 },
      { id: '2', name: 'Venue', allocated: 20000, estimated: 20000, quoted: 0, actual: 20000, paid: 0 },
    ];
    // Catering is 80% of 100,000 budget (way above 45% threshold)
    const summary = calculateBudgetSummary(100000, categories, 10);
    expect(summary.savingsOpportunities.length).toBeGreaterThan(0);
    expect(summary.savingsOpportunities[0].categoryName).toBe('Catering Feast');
  });

  it('exports budget to valid CSV format with headers and reconciled totals', () => {
    const csv = exportBudgetToCSV(DEMO_COMMUNITY_EVENT);
    expect(csv).toContain('Category,Planned (INR),Estimated (INR)');
    expect(csv).toContain('"Catering & Traditional Buffet",60000');
    expect(csv).toContain('"Total Budget",150000');
    expect(csv).toContain('"Export Timestamp"');
  });
});
