// Plan Doctor: Deterministic Plan Integrity Engine for PlanSutra AI
// Validates event plans against financial, logistical, and timeline constraints

import { EventPlan, PlanDoctorFinding, ReadinessScoreBreakdown } from '@/types';
import { calculateBudgetSummary } from '@/features/budget/budgetCalculations';
import { formatINR } from '@/lib/currency';

/**
 * Runs the deterministic Plan Integrity Engine across the entire event plan.
 */
export function runPlanDoctor(event: EventPlan): {
  findings: PlanDoctorFinding[];
  readiness: ReadinessScoreBreakdown;
} {
  const findings: PlanDoctorFinding[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const budgetSummary = calculateBudgetSummary(
    event.totalBudget,
    event.budgetCategories,
    event.contingencyReservePercent
  );

  // ----------------------------------------------------
  // 1. Budget Overrun Check
  // ----------------------------------------------------
  if (budgetSummary.isOverBudget) {
    findings.push({
      id: 'finding-budget-overrun',
      title: 'Projected Costs Exceed Total Budget',
      severity: 'critical_blocker',
      category: 'budget',
      explanation: `Projected spending (${formatINR(budgetSummary.projectedTotal)}) exceeds your defined budget of ${formatINR(event.totalBudget)} by ${formatINR(budgetSummary.varianceAmount)}.`,
      triggerRule: 'RULE_BUDGET_OVERRUN',
      affectedEntity: { type: 'event', name: event.name },
      correctiveActions: [
        {
          label: `Increase budget by ${formatINR(budgetSummary.varianceAmount)}`,
          description: `Update total budget to ${formatINR(budgetSummary.projectedTotal)} to cover all projected allocations.`,
          actionType: 'increase_budget',
          payload: { newBudget: budgetSummary.projectedTotal },
        },
        {
          label: 'Reduce highest cost category',
          description: 'Automatically adjust variable categories like Catering or Decor to bring total within limit.',
          actionType: 'reduce_category_cost',
          payload: { requiredReduction: budgetSummary.varianceAmount },
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 2. Budget Reconciliation Check
  // ----------------------------------------------------
  if (budgetSummary.hasReconciliationMismatch) {
    const isUnderAllocated = budgetSummary.reconciliationDifference < 0;
    findings.push({
      id: 'finding-budget-reconciliation',
      title: 'Category Allocations Do Not Reconcile with Budget',
      severity: 'warning',
      category: 'budget',
      explanation: `Sum of category allocations (${formatINR(budgetSummary.allocatedTotal)}) is ${isUnderAllocated ? 'less' : 'more'} than the total event budget (${formatINR(event.totalBudget)}) by ${formatINR(Math.abs(budgetSummary.reconciliationDifference))}.`,
      triggerRule: 'RULE_BUDGET_UNRECONCILED',
      affectedEntity: { type: 'event', name: 'Budget Allocations' },
      correctiveActions: [
        {
          label: 'Rebalance allocations to match total budget',
          description: 'Distribute the difference into the Contingency Reserve or adjust category percentages.',
          actionType: 'add_contingency',
          payload: { adjustment: -budgetSummary.reconciliationDifference },
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 3. Venue Capacity Check
  // ----------------------------------------------------
  if (event.venueCapacity !== undefined && event.venueCapacity !== null && event.venueCapacity > 0) {
    if (event.guestCount > event.venueCapacity) {
      const excessGuests = event.guestCount - event.venueCapacity;
      findings.push({
        id: 'finding-venue-capacity-exceeded',
        title: 'Guest Count Exceeds Venue Capacity',
        severity: 'critical_blocker',
        category: 'venue',
        explanation: `Expected guest count (${event.guestCount}) exceeds the confirmed capacity of ${event.venueName || 'Venue'} (${event.venueCapacity}) by ${excessGuests} guests. This poses safety and seating violations.`,
        triggerRule: 'RULE_VENUE_CAPACITY_EXCEEDED',
        affectedEntity: { type: 'event', name: event.venueName || 'Venue' },
        correctiveActions: [
          {
            label: `Cap guest count to ${event.venueCapacity}`,
            description: `Reduce RSVP limit to match safe venue capacity of ${event.venueCapacity}.`,
            actionType: 'adjust_guest_count',
            payload: { newGuestCount: event.venueCapacity },
          },
          {
            label: 'Find a higher-capacity venue',
            description: 'Change venue setting or upgrade hall size to accommodate the planned guests.',
            actionType: 'confirm_venue_capacity',
          },
        ],
        isResolved: false,
      });
    }
  } else {
    // Capacity unknown: per Section 7, report that capacity needs confirmation rather than claiming it exceeds it
    findings.push({
      id: 'finding-venue-capacity-unconfirmed',
      title: 'Venue Capacity Unconfirmed',
      severity: 'missing_info',
      category: 'venue',
      explanation: `Venue capacity has not been recorded for ${event.guestCount} planned guests. Confirm the maximum legal and comfortable seating capacity with the venue manager.`,
      triggerRule: 'RULE_VENUE_CAPACITY_UNCONFIRMED',
      affectedEntity: { type: 'event', name: event.venueName || 'Venue' },
      correctiveActions: [
        {
          label: 'Enter confirmed venue capacity',
          description: 'Record the official seating and standing capacity for safety validation.',
          actionType: 'confirm_venue_capacity',
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 4. Missing or Invalid Event Date Check
  // ----------------------------------------------------
  if (!event.date) {
    findings.push({
      id: 'finding-missing-date',
      title: 'Event Date Missing',
      severity: 'critical_blocker',
      category: 'timeline',
      explanation: 'No event date has been specified. Timeline phases and vendor deadlines cannot be scheduled.',
      triggerRule: 'RULE_EVENT_DATE_MISSING',
      affectedEntity: { type: 'event', name: event.name },
      correctiveActions: [
        {
          label: 'Set event date',
          description: 'Choose the primary celebration date to activate milestone tracking.',
          actionType: 'reschedule_task',
        },
      ],
      isResolved: false,
    });
  } else if (event.date < todayStr) {
    findings.push({
      id: 'finding-past-date',
      title: 'Event Date is in the Past',
      severity: 'high_priority_risk',
      category: 'timeline',
      explanation: `Event date ${event.date} is in the past compared to current date (${todayStr}).`,
      triggerRule: 'RULE_EVENT_DATE_PAST',
      affectedEntity: { type: 'event', name: event.name },
      correctiveActions: [
        {
          label: 'Update event date to future',
          description: 'Reschedule the event to an upcoming date.',
          actionType: 'reschedule_task',
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 5. Overdue Tasks Check
  // ----------------------------------------------------
  const overdueTasks = event.tasks.filter(
    t => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
  );
  if (overdueTasks.length > 0) {
    findings.push({
      id: 'finding-overdue-tasks',
      title: `${overdueTasks.length} Planning Task${overdueTasks.length > 1 ? 's are' : ' is'} Overdue`,
      severity: 'high_priority_risk',
      category: 'timeline',
      explanation: `The following tasks have passed their target deadline without completion: ${overdueTasks.slice(0, 3).map(t => `"${t.title}" (Due ${t.dueDate})`).join(', ')}${overdueTasks.length > 3 ? ` and ${overdueTasks.length - 3} more` : ''}.`,
      triggerRule: 'RULE_TASKS_OVERDUE',
      affectedEntity: { type: 'task', id: overdueTasks[0].id, name: overdueTasks[0].title },
      correctiveActions: [
        {
          label: 'Reschedule overdue tasks to this week',
          description: 'Push overdue deadlines forward by 7 days to restore active momentum.',
          actionType: 'reschedule_task',
          payload: { taskIds: overdueTasks.map(t => t.id) },
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 6. Task Dependency Conflicts Check
  // ----------------------------------------------------
  const taskMap = new Map(event.tasks.map(t => [t.id, t]));
  const brokenDependencies: { task: string; dependsOn: string; reason: string }[] = [];

  event.tasks.forEach(task => {
    task.dependencies.forEach(depId => {
      const prerequisite = taskMap.get(depId);
      if (!prerequisite) {
        brokenDependencies.push({
          task: task.title,
          dependsOn: depId,
          reason: 'Prerequisite task does not exist or was deleted.',
        });
      } else {
        // If prerequisite is due AFTER the dependent task
        if (prerequisite.dueDate && task.dueDate && prerequisite.dueDate > task.dueDate) {
          brokenDependencies.push({
            task: task.title,
            dependsOn: prerequisite.title,
            reason: `Prerequisite "${prerequisite.title}" is due on ${prerequisite.dueDate}, which is AFTER this task's deadline of ${task.dueDate}.`,
          });
        }
      }
    });
  });

  if (brokenDependencies.length > 0) {
    findings.push({
      id: 'finding-broken-dependencies',
      title: 'Conflicting Task Schedule Dependencies',
      severity: 'high_priority_risk',
      category: 'timeline',
      explanation: brokenDependencies.map(d => `${d.task}: ${d.reason}`).join(' '),
      triggerRule: 'RULE_BROKEN_DEPENDENCY',
      affectedEntity: { type: 'task', name: brokenDependencies[0].task },
      correctiveActions: [
        {
          label: 'Align prerequisite task dates',
          description: 'Reschedule dependent tasks after their prerequisites are completed.',
          actionType: 'resolve_dependency',
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 7. Conflicting Day-Of Schedule Entries Check
  // ----------------------------------------------------
  const scheduleItems = [...event.dayOfSchedule].sort((a, b) => a.time.localeCompare(b.time));
  const timeConflicts: string[] = [];

  for (let i = 0; i < scheduleItems.length - 1; i++) {
    const curr = scheduleItems[i];
    const next = scheduleItems[i + 1];
    
    // Check if current item has endTime and it overlaps next item
    if (curr.endTime && curr.endTime > next.time) {
      timeConflicts.push(`"${curr.activity}" (${curr.time}-${curr.endTime}) overlaps with "${next.activity}" (${next.time})`);
    } else if (curr.time === next.time && (!curr.location || curr.location === next.location)) {
      timeConflicts.push(`"${curr.activity}" and "${next.activity}" are scheduled at the identical time (${curr.time}).`);
    }
  }

  if (timeConflicts.length > 0) {
    findings.push({
      id: 'finding-schedule-conflicts',
      title: 'Conflicting Day-Of Schedule Entries',
      severity: 'warning',
      category: 'logistics',
      explanation: timeConflicts.join('; '),
      triggerRule: 'RULE_SCHEDULE_CONFLICT',
      affectedEntity: { type: 'schedule', name: 'Day-Of Run Sheet' },
      correctiveActions: [
        {
          label: 'Adjust activity start times',
          description: 'Stagger run-sheet activities so events do not collide.',
          actionType: 'reschedule_task',
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 8. Essential Vendor Bookings Check
  // ----------------------------------------------------
  const criticalCategories = ['Venue', 'Catering', 'Photography'];
  const unbookedCritical = criticalCategories.filter(cat => {
    const hasCategory = event.budgetCategories.some(c => c.name.toLowerCase().includes(cat.toLowerCase()));
    if (!hasCategory) return false;
    const vendor = event.vendors.find(v => v.category.toLowerCase().includes(cat.toLowerCase()));
    return !vendor || vendor.bookingStatus !== 'confirmed';
  });

  if (unbookedCritical.length > 0) {
    findings.push({
      id: 'finding-critical-vendors-unbooked',
      title: `Critical Vendor${unbookedCritical.length > 1 ? 's' : ''} Not Confirmed`,
      severity: 'critical_blocker',
      category: 'vendor',
      explanation: `The following essential service categories have no confirmed booking: ${unbookedCritical.join(', ')}. Without signed contracts, date availability is unprotected.`,
      triggerRule: 'RULE_CRITICAL_VENDOR_UNCONFIRMED',
      affectedEntity: { type: 'vendor', name: unbookedCritical[0] },
      correctiveActions: [
        {
          label: `Add and confirm ${unbookedCritical[0]} vendor`,
          description: `Record quotation and mark ${unbookedCritical[0]} booking as confirmed.`,
          actionType: 'add_missing_vendor',
          payload: { category: unbookedCritical[0] },
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 9. Missing Quotations for Major Budget Items
  // ----------------------------------------------------
  const highImpactCategories = event.budgetCategories.filter(
    c => c.allocated > (event.totalBudget * 0.15) && !c.isContingency && (!c.quoted || c.quoted === 0) && (!c.actual || c.actual === 0)
  );

  if (highImpactCategories.length > 0) {
    findings.push({
      id: 'finding-missing-quotations',
      title: 'Unverified Cost Estimates on Major Categories',
      severity: 'warning',
      category: 'budget',
      explanation: `Categories accounting for >15% of your budget have only rough estimates without formal vendor quotations: ${highImpactCategories.map(c => c.name).join(', ')}. Actual quotes may differ significantly.`,
      triggerRule: 'RULE_UNVERIFIED_ESTIMATES',
      affectedEntity: { type: 'budget_category', name: highImpactCategories[0].name },
      correctiveActions: [
        {
          label: `Record vendor quote for ${highImpactCategories[0].name}`,
          description: 'Add quotation details from prospective suppliers.',
          actionType: 'record_quotation',
          payload: { categoryId: highImpactCategories[0].id },
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 10. Missing Contingency Provision
  // ----------------------------------------------------
  const hasContingency = event.budgetCategories.some(
    c => (c.isContingency || c.name.toLowerCase().includes('contingency')) && c.allocated > 0
  );

  if (!hasContingency || event.contingencyReservePercent <= 0) {
    const recommendedReserve = Math.round(event.totalBudget * 0.10);
    findings.push({
      id: 'finding-missing-contingency',
      title: 'No Contingency Reserve Allocated',
      severity: 'high_priority_risk',
      category: 'budget',
      explanation: 'No financial cushion is set aside for unexpected costs, overtime charges, or last-minute guest additions. Industry best practice recommends 8% to 15%.',
      triggerRule: 'RULE_CONTINGENCY_MISSING',
      affectedEntity: { type: 'event', name: 'Contingency Reserve' },
      correctiveActions: [
        {
          label: `Allocate 10% contingency (${formatINR(recommendedReserve)})`,
          description: 'Create a dedicated contingency category to buffer unforeseen operational expenses.',
          actionType: 'add_contingency',
          payload: { percent: 10, amount: recommendedReserve },
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // 11. Unresolved Dietary or Accessibility Requirements
  // ----------------------------------------------------
  const accessibility = event.personalization.accessibility || [];
  const dietary = event.personalization.foodDietary || [];

  if (accessibility.length > 0) {
    // Check if any task or venue specifically mentions accessibility
    const mentionsAccessibility = event.tasks.some(
      t => t.title.toLowerCase().includes('accessibility') || t.description.toLowerCase().includes('wheelchair') || t.description.toLowerCase().includes('ramp')
    ) || (event.venueName && event.venueName.toLowerCase().includes('accessible'));

    if (!mentionsAccessibility) {
      findings.push({
        id: 'finding-unresolved-accessibility',
        title: 'Accessibility Requirements Unverified with Venue',
        severity: 'warning',
        category: 'accessibility',
        explanation: `Personalization specifies requirements (${accessibility.join(', ')}), but no venue inspection task or ramp/elevator verification is scheduled.`,
        triggerRule: 'RULE_ACCESSIBILITY_UNVERIFIED',
        affectedEntity: { type: 'event', name: 'Accessibility Logistics' },
        correctiveActions: [
          {
            label: 'Add accessibility audit task',
            description: 'Create a task to inspect wheelchair ramps, elevators, and step-free venue access.',
            actionType: 'resolve_accessibility',
          },
        ],
        isResolved: false,
      });
    }
  }

  if (dietary.length > 0) {
    const mentionsDietary = event.tasks.some(
      t => t.title.toLowerCase().includes('dietary') || t.description.toLowerCase().includes('vegan') || t.description.toLowerCase().includes('jain') || t.description.toLowerCase().includes('allergy')
    ) || event.vendors.some(v => v.category.toLowerCase().includes('catering') && v.servicesIncluded.some(s => s.toLowerCase().includes('dietary')));

    if (!mentionsDietary) {
      findings.push({
        id: 'finding-unresolved-dietary',
        title: 'Dietary Preferences Not Logged with Catering',
        severity: 'suggestion',
        category: 'logistics',
        explanation: `Dietary preferences specified (${dietary.join(', ')}), but caterer contract does not have special meal allocations recorded.`,
        triggerRule: 'RULE_DIETARY_UNLOGGED',
        affectedEntity: { type: 'vendor', name: 'Catering' },
        correctiveActions: [
          {
            label: 'Add dietary menu review task',
            description: 'Ensure caterer logs exact counts for specified diets.',
            actionType: 'add_missing_vendor',
          },
        ],
        isResolved: false,
      });
    }
  }

  // ----------------------------------------------------
  // 12. Missing Critical Event Decisions
  // ----------------------------------------------------
  if (!event.venueName || event.venueName.trim() === '') {
    findings.push({
      id: 'finding-venue-undecided',
      title: 'Venue Location Undecided',
      severity: 'critical_blocker',
      category: 'venue',
      explanation: 'No venue has been chosen or named. Invitations, setup logistics, and location-dependent vendors remain blocked.',
      triggerRule: 'RULE_VENUE_UNDECIDED',
      affectedEntity: { type: 'event', name: 'Venue Selection' },
      correctiveActions: [
        {
          label: 'Select and enter venue',
          description: 'Enter the finalized venue name and address.',
          actionType: 'confirm_venue_capacity',
        },
      ],
      isResolved: false,
    });
  }

  // ----------------------------------------------------
  // Deterministic Transparent Readiness Score Calculation
  // ----------------------------------------------------
  // Breakdown:
  // - Budget integrity: max 25 pts
  // - Venue & capacity: max 20 pts
  // - Timeline & tasks: max 20 pts
  // - Vendor confirmations: max 20 pts
  // - Logistics & accessibility: max 15 pts

  let budgetScore = 25;
  if (budgetSummary.isOverBudget) budgetScore = 0;
  else if (budgetSummary.hasReconciliationMismatch) budgetScore = 15;

  let venueScore = 20;
  if (!event.venueName || event.venueName.trim() === '') venueScore = 0;
  else if (event.venueCapacity && event.guestCount > event.venueCapacity) venueScore = 5;
  else if (!event.venueCapacity) venueScore = 12;

  let timelineScore = 20;
  if (!event.date || event.date < todayStr) timelineScore = 0;
  else if (brokenDependencies.length > 0) timelineScore = 8;
  else if (overdueTasks.length > 0) timelineScore = Math.max(5, 20 - overdueTasks.length * 4);

  let vendorScore = 20;
  if (unbookedCritical.length > 0) {
    vendorScore = Math.max(0, 20 - unbookedCritical.length * 8);
  }

  let logisticsScore = 15;
  if (!hasContingency) logisticsScore -= 5;
  if (findings.some(f => f.category === 'accessibility')) logisticsScore -= 4;
  if (findings.some(f => f.category === 'logistics')) logisticsScore -= 3;
  logisticsScore = Math.max(0, logisticsScore);

  const rawScore = budgetScore + venueScore + timelineScore + vendorScore + logisticsScore;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const blockerCount = findings.filter(f => f.severity === 'critical_blocker').length;
  const highRiskCount = findings.filter(f => f.severity === 'high_priority_risk').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;

  let label = 'Requires Attention';
  if (blockerCount === 0 && score >= 85) {
    label = 'Execution Ready';
  } else if (blockerCount === 0 && score >= 65) {
    label = 'Good Progress';
  }

  const unresolvedBlockers = findings
    .filter(f => f.severity === 'critical_blocker')
    .map(f => f.title);

  return {
    findings,
    readiness: {
      score,
      label,
      blockerCount,
      highRiskCount,
      warningCount,
      factors: {
        budgetIntegrity: budgetScore,
        venueCapacity: venueScore,
        timelineReadiness: timelineScore,
        vendorConfirmations: vendorScore,
        logisticsAccessibility: logisticsScore,
      },
      unresolvedBlockers,
    },
  };
}
