import { describe, it, expect } from 'vitest';
import { runPlanDoctor } from '../src/features/plan-doctor/planDoctorRules';
import { simulateEventChanges } from '../src/features/simulator/changeSimulator';
import { DEMO_COMMUNITY_EVENT } from '../src/features/events/sampleData';
import { EventPlan } from '../src/types';

describe('Plan Doctor: Deterministic Plan Integrity Engine', () => {
  it('detects venue capacity violation when guests exceed capacity', () => {
    const event: EventPlan = JSON.parse(JSON.stringify(DEMO_COMMUNITY_EVENT));
    event.guestCount = 250;
    event.venueCapacity = 200;

    const { findings, readiness } = runPlanDoctor(event);
    const capacityFinding = findings.find(f => f.triggerRule === 'RULE_VENUE_CAPACITY_EXCEEDED');

    expect(capacityFinding).toBeDefined();
    expect(capacityFinding?.severity).toBe('critical_blocker');
    expect(readiness.unresolvedBlockers).toContain('Guest Count Exceeds Venue Capacity');
  });

  it('reports missing capacity information when venue capacity is unknown rather than asserting violation', () => {
    const event: EventPlan = JSON.parse(JSON.stringify(DEMO_COMMUNITY_EVENT));
    delete event.venueCapacity;

    const { findings } = runPlanDoctor(event);
    const finding = findings.find(f => f.triggerRule === 'RULE_VENUE_CAPACITY_UNCONFIRMED');

    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('missing_info');
  });

  it('detects overdue tasks accurately based on due date', () => {
    const { findings } = runPlanDoctor(DEMO_COMMUNITY_EVENT);
    const overdueFinding = findings.find(f => f.triggerRule === 'RULE_TASKS_OVERDUE');
    expect(overdueFinding).toBeDefined();
    expect(overdueFinding?.severity).toBe('high_priority_risk');
  });

  it('detects conflicting day-of schedule time slots', () => {
    const event: EventPlan = JSON.parse(JSON.stringify(DEMO_COMMUNITY_EVENT));
    // Introduce conflicting item
    event.dayOfSchedule.push({
      id: 'sched-conflict',
      time: '16:00',
      endTime: '17:00',
      activity: 'Conflicting Parallel Activity in Same Hall',
      location: 'Main Auditorium & Courtyard',
      notes: 'Collision with guest arrival',
    });

    const { findings } = runPlanDoctor(event);
    const conflictFinding = findings.find(f => f.triggerRule === 'RULE_SCHEDULE_CONFLICT');
    expect(conflictFinding).toBeDefined();
  });

  it('computes a transparent readiness score bounded between 0 and 100', () => {
    const { readiness } = runPlanDoctor(DEMO_COMMUNITY_EVENT);
    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(readiness.factors.budgetIntegrity).toBeDefined();
    expect(readiness.factors.venueCapacity).toBeDefined();
  });
});

describe('Event Change Simulator (Challenge 5 Demo Scenario)', () => {
  it('correctly recalculates catering cost from 180 to 220 guests', () => {
    // Demo scenario: 180 guests -> 220 guests (+40 guests)
    // Rate is ~333.33/person. For 220 guests = ~73,333. Base was 60,000.
    // Difference is ~13,333!
    const result = simulateEventChanges(DEMO_COMMUNITY_EVENT, { guestCount: 220 });

    expect(result.simulatedPlan.guestCount).toBe(220);
    expect(result.budgetDifference).toBeGreaterThanOrEqual(13330);
    expect(result.budgetDifference).toBeLessThanOrEqual(13340);

    const cateringChange = result.affectedCategories.find(c => c.categoryName.includes('Catering'));
    expect(cateringChange).toBeDefined();
    expect(cateringChange?.simulatedCost).toBeGreaterThan(60000);

    // Plan Doctor must catch this budget increase as a new finding
    expect(result.newFindings.some(f => f.triggerRule === 'RULE_BUDGET_OVERRUN')).toBe(true);
  });

  it('simulates rain risk and adds weather contingency marquee', () => {
    const result = simulateEventChanges(DEMO_COMMUNITY_EVENT, { rainRisk: true });
    expect(result.assumptions.some(a => a.toLowerCase().includes('rainfall'))).toBe(true);
    expect(result.simulatedPlan.budgetCategories.some(c => c.name.toLowerCase().includes('weather'))).toBe(true);
  });
});
