// Event Change Simulator for PlanSutra AI
// Deterministic "What If?" scenario testing and impact preview

import { EventPlan, SimulationChanges, SimulationResult, BudgetCategory, Task, Vendor } from '@/types';
import { runPlanDoctor } from '@/features/plan-doctor/planDoctorRules';
import { calculateBudgetSummary } from '@/features/budget/budgetCalculations';
import { sumRupees, fromPaise, toPaise, formatINR } from '@/lib/currency';

/**
 * Simulates the impact of hypothetical changes without altering the original plan.
 */
export function simulateEventChanges(
  originalPlan: EventPlan,
  changes: SimulationChanges
): SimulationResult {
  // Deep clone the original plan
  const simulatedPlan: EventPlan = JSON.parse(JSON.stringify(originalPlan));
  simulatedPlan.updatedAt = new Date().toISOString();

  const affectedCategories: {
    categoryName: string;
    originalCost: number;
    simulatedCost: number;
    difference: number;
    reason: string;
  }[] = [];

  const affectedTasks: string[] = [];
  const affectedVendors: string[] = [];
  const assumptions: string[] = [];

  // 1. Guest Count Simulation
  if (changes.guestCount !== undefined && changes.guestCount !== originalPlan.guestCount) {
    const oldGuests = originalPlan.guestCount;
    const newGuests = changes.guestCount;
    simulatedPlan.guestCount = newGuests;
    const ratio = newGuests / (oldGuests || 1);

    assumptions.push(
      `Guest count adjusted from ${oldGuests} to ${newGuests} (${newGuests > oldGuests ? '+' : ''}${newGuests - oldGuests} guests).`
    );

    // Identify guest-sensitive categories (Catering, Beverages, Favors/Gifts, Invitations)
    simulatedPlan.budgetCategories = simulatedPlan.budgetCategories.map(cat => {
      const isCatering = cat.name.toLowerCase().includes('catering') || cat.name.toLowerCase().includes('food');
      const isGuestVariable = isCatering || 
                              cat.name.toLowerCase().includes('invitation') || 
                              cat.name.toLowerCase().includes('favor') ||
                              cat.costPerGuestApplicable;

      if (isGuestVariable) {
        const baseCost = cat.estimated || cat.allocated || 0;
        // Compute per-guest unit cost
        const perGuestRate = cat.costPerGuestAmount || (oldGuests > 0 ? baseCost / oldGuests : 0);
        const newCost = Math.round(perGuestRate * newGuests);
        const diff = newCost - baseCost;

        affectedCategories.push({
          categoryName: cat.name,
          originalCost: baseCost,
          simulatedCost: newCost,
          difference: diff,
          reason: `Recalculated based on ₹${Math.round(perGuestRate * 100) / 100} per guest for ${newGuests} guests.`,
        });

        return {
          ...cat,
          estimated: newCost,
          actual: cat.actual > 0 ? newCost : cat.actual,
          quoted: cat.quoted > 0 ? newCost : cat.quoted,
          notes: `${cat.notes ? cat.notes + '; ' : ''}Simulated for ${newGuests} guests (₹${Math.round(perGuestRate)}/person)`,
        };
      }
      return cat;
    });

    // Check if venue capacity is breached
    if (simulatedPlan.venueCapacity && newGuests > simulatedPlan.venueCapacity) {
      affectedTasks.push('Verify venue overflow seating or consider alternative hall');
    }
  }

  // 2. Budget Reduction Simulation
  if (changes.budgetReductionPercent && changes.budgetReductionPercent > 0) {
    const reductionFactor = (100 - changes.budgetReductionPercent) / 100;
    const newBudget = Math.round(originalPlan.totalBudget * reductionFactor);
    simulatedPlan.totalBudget = newBudget;

    assumptions.push(
      `Budget reduced by ${changes.budgetReductionPercent}% from ${formatINR(originalPlan.totalBudget)} to ${formatINR(newBudget)}.`
    );
  }

  // 3. Event Date Change Simulation
  if (changes.newEventDate && changes.newEventDate !== originalPlan.date) {
    const oldDate = new Date(originalPlan.date);
    const newDate = new Date(changes.newEventDate);
    const dayDifference = Math.round((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));
    simulatedPlan.date = changes.newEventDate;

    assumptions.push(
      `Event date shifted by ${dayDifference > 0 ? '+' : ''}${dayDifference} days (to ${changes.newEventDate}).`
    );

    // Shift all task due dates proportionally
    simulatedPlan.tasks = simulatedPlan.tasks.map(t => {
      if (t.dueDate) {
        const taskDate = new Date(t.dueDate);
        taskDate.setDate(taskDate.getDate() + dayDifference);
        const updatedDueDate = taskDate.toISOString().split('T')[0];
        affectedTasks.push(`Task "${t.title}" rescheduled to ${updatedDueDate}`);
        return {
          ...t,
          dueDate: updatedDueDate,
        };
      }
      return t;
    });
  }

  // 4. Venue Unavailable Simulation
  if (changes.venueUnavailable) {
    simulatedPlan.venueName = '';
    simulatedPlan.venueCapacity = undefined;
    affectedTasks.push('Emergency search for replacement venue');
    affectedVendors.push('Venue booking released');
    assumptions.push('Primary venue marked as unavailable.');
  }

  // 5. Vendor Cancellation Simulation
  if (changes.cancelledVendorId) {
    const cancelled = simulatedPlan.vendors.find(v => v.id === changes.cancelledVendorId);
    if (cancelled) {
      cancelled.bookingStatus = 'cancelled';
      affectedVendors.push(`${cancelled.name} (${cancelled.category}) marked cancelled`);
      assumptions.push(`${cancelled.name} cancelled their booking.`);

      // Add emergency replacement task
      const emergencyTask: Task = {
        id: `emergency-task-${Date.now()}`,
        title: `Search replacement vendor for ${cancelled.category}`,
        description: `Immediate priority: Review candidate suppliers for ${cancelled.category} due to cancellation.`,
        phase: 'vendor_selection',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        reason: 'Vendor cancellation requires immediate replacement to avoid disruption.',
      };
      simulatedPlan.tasks.push(emergencyTask);
      affectedTasks.push(emergencyTask.title);
    }
  }

  // 6. Rain Risk Simulation (for outdoor/mixed events)
  if (changes.rainRisk) {
    assumptions.push('Simulated sudden rainfall risk for outdoor celebration spaces.');
    
    // Add waterproof marquee / tent category if not present
    const hasTent = simulatedPlan.budgetCategories.some(c => c.name.toLowerCase().includes('tent') || c.name.toLowerCase().includes('canopy'));
    if (!hasTent) {
      const tentCost = Math.round(originalPlan.totalBudget * 0.08); // 8% of budget
      const tentCategory: BudgetCategory = {
        id: `sim-cat-weather-contingency`,
        name: 'Weather Contingency & Tents',
        allocated: tentCost,
        estimated: tentCost,
        quoted: 0,
        actual: 0,
        paid: 0,
        notes: 'Waterproof marquee and indoor flooring for wet weather contingency.',
      };
      simulatedPlan.budgetCategories.push(tentCategory);
      affectedCategories.push({
        categoryName: tentCategory.name,
        originalCost: 0,
        simulatedCost: tentCost,
        difference: tentCost,
        reason: 'Added weatherproof covered marquee for outdoor rain risk.',
      });
    }
  }

  // Run Plan Doctor on both original and simulated
  const originalDoctor = runPlanDoctor(originalPlan);
  const simulatedDoctor = runPlanDoctor(simulatedPlan);

  // Calculate budget difference
  const origSummary = calculateBudgetSummary(originalPlan.totalBudget, originalPlan.budgetCategories, originalPlan.contingencyReservePercent);
  const simSummary = calculateBudgetSummary(simulatedPlan.totalBudget, simulatedPlan.budgetCategories, simulatedPlan.contingencyReservePercent);
  const budgetDifference = simSummary.projectedTotal - origSummary.projectedTotal;

  // Identify new and resolved findings
  const origFindingIds = new Set(originalDoctor.findings.map(f => f.id));
  const newFindings = simulatedDoctor.findings.filter(f => !origFindingIds.has(f.id));
  const simFindingIds = new Set(simulatedDoctor.findings.map(f => f.id));
  const resolvedFindings = originalDoctor.findings.filter(f => !simFindingIds.has(f.id));

  // Determine recommended corrective actions
  const recommendedActions = simulatedDoctor.findings.flatMap(f => f.correctiveActions);

  return {
    originalPlan,
    simulatedPlan,
    budgetDifference,
    affectedCategories,
    affectedTasks,
    affectedVendors,
    newFindings,
    resolvedFindings,
    assumptions,
    recommendedActions,
  };
}
