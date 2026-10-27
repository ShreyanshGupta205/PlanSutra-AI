import { describe, it, expect } from 'vitest';
import {
  CreateEventRequestSchema,
  AIStructuredPlanResponseSchema,
  FullEventPlanSchema,
} from '../src/schemas';
import { DEMO_COMMUNITY_EVENT } from '../src/features/events/sampleData';

describe('Zod Schema & Security Validation', () => {
  it('validates a correct event creation request', () => {
    const validData = {
      name: 'College Cultural Fest 2026',
      type: 'college_fest',
      date: '2026-11-15',
      city: 'Bangalore',
      guestCount: 500,
      setting: 'outdoor',
      totalBudget: 400000,
      contingencyReservePercent: 12,
      spendingLevel: 'balanced',
      priorityCategories: ['Sound', 'Artist'],
      optimizationMode: 'maximize_experience',
      personalization: {},
    };

    const result = CreateEventRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid or negative budget in creation request', () => {
    const invalidData = {
      name: 'Birthday',
      type: 'birthday',
      date: '2026-11-15',
      city: 'Delhi',
      guestCount: 50,
      setting: 'indoor',
      totalBudget: -5000, // Negative budget!
    };

    const result = CreateEventRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects malformed AI structured responses missing required fields', () => {
    const malformedAIResponse = {
      themeConcept: 'Rustic Autumn',
      // Missing budgetCategories, tasks, vendorChecklist, dayOfSchedule
    };

    const result = AIStructuredPlanResponseSchema.safeParse(malformedAIResponse);
    expect(result.success).toBe(false);
  });

  it('validates full event plan for backup/export consistency', () => {
    const result = FullEventPlanSchema.safeParse(DEMO_COMMUNITY_EVENT);
    expect(result.success).toBe(true);
  });

  it('rejects corrupted or malicious JSON backup payloads', () => {
    const corruptedBackup = {
      id: 'hacked-id',
      // Injected malicious fields or missing mandatory arrays
      name: 'Hacked Event',
      budgetCategories: 'not-an-array',
    };

    const result = FullEventPlanSchema.safeParse(corruptedBackup);
    expect(result.success).toBe(false);
  });
});
