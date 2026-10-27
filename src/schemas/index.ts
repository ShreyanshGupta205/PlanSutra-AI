// Zod Schemas for PlanSutra AI
// Validates user inputs, server API requests, and AI structured outputs

import { z } from 'zod';

// Event Basics Schema
export const EventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'community',
  'college_fest',
  'corporate',
  'custom',
]);

export const EventSettingSchema = z.enum(['indoor', 'outdoor', 'mixed']);

export const SpendingLevelSchema = z.enum(['budget_conscious', 'balanced', 'premium']);

export const OptimizationModeSchema = z.enum([
  'minimize_costs',
  'balanced',
  'maximize_experience',
]);

export const PersonalizationSchema = z.object({
  themeStyle: z.string().optional(),
  colors: z.array(z.string()).optional(),
  culturalTraditions: z.string().optional(),
  foodDietary: z.array(z.string()).optional(),
  accessibility: z.array(z.string()).optional(),
  entertainment: z.array(z.string()).optional(),
  decoration: z.string().optional(),
  sustainability: z.string().optional(),
  mustHaveMoments: z.array(z.string()).optional(),
  itemsToAvoid: z.array(z.string()).optional(),
});

// Event Creation Request Schema (Server Input Validation)
export const CreateEventRequestSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters').max(100),
  type: EventTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  city: z.string().min(2, 'City is required').max(100),
  guestCount: z.number().int().positive('Guest count must be at least 1').max(50000),
  venueName: z.string().max(150).optional(),
  venueCapacity: z.number().int().positive().optional(),
  setting: EventSettingSchema,
  totalBudget: z.number().positive('Total budget must be greater than zero'),
  contingencyReservePercent: z.number().min(0).max(50).default(10),
  spendingLevel: SpendingLevelSchema.default('balanced'),
  priorityCategories: z.array(z.string()).default([]),
  optimizationMode: OptimizationModeSchema.default('balanced'),
  personalization: PersonalizationSchema.default({}),
});

// AI Structured Plan Output Schema (Server Validation of LLM Response)
export const AIBudgetCategoryProposalSchema = z.object({
  name: z.string(),
  allocated: z.number().nonnegative(),
  notes: z.string().optional(),
  costPerGuestApplicable: z.boolean().optional(),
  costPerGuestAmount: z.number().optional(),
});

export const AITaskProposalSchema = z.object({
  title: z.string(),
  description: z.string(),
  phase: z.enum([
    'initial_planning',
    'budget_venue',
    'vendor_selection',
    'invitations_guests',
    'final_confirmations',
    'final_week',
    'day_of',
    'post_event',
  ]),
  daysBeforeEvent: z.number().int(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.string().optional(),
});

export const AIVendorChecklistItemSchema = z.object({
  category: z.string(),
  suggestedName: z.string(),
  estimatedCost: z.number().nonnegative(),
  keyServices: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
  negotiationTips: z.array(z.string()),
});

export const AIDayOfScheduleProposalSchema = z.object({
  time: z.string(),
  endTime: z.string().optional(),
  activity: z.string(),
  owner: z.string().optional(),
  notes: z.string().optional(),
});

export const AIStructuredPlanResponseSchema = z.object({
  themeConcept: z.string(),
  paletteSuggestions: z.array(z.string()),
  budgetCategories: z.array(AIBudgetCategoryProposalSchema),
  tasks: z.array(AITaskProposalSchema),
  vendorChecklist: z.array(AIVendorChecklistItemSchema),
  dayOfSchedule: z.array(AIDayOfScheduleProposalSchema),
  assumptions: z.array(z.string()),
  identifiedRisks: z.array(z.string()),
});

// Full Event Plan Schema (for local persistence and JSON backup validation)
export const FullEventPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: EventTypeSchema,
  date: z.string(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  city: z.string(),
  guestCount: z.number(),
  venueName: z.string().optional(),
  venueCapacity: z.number().optional(),
  setting: EventSettingSchema,
  totalBudget: z.number(),
  contingencyReservePercent: z.number(),
  spendingLevel: SpendingLevelSchema,
  priorityCategories: z.array(z.string()),
  optimizationMode: OptimizationModeSchema,
  budgetCategories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      allocated: z.number(),
      estimated: z.number(),
      quoted: z.number(),
      actual: z.number(),
      paid: z.number(),
      notes: z.string().optional(),
      vendorId: z.string().optional(),
      isContingency: z.boolean().optional(),
      costPerGuestApplicable: z.boolean().optional(),
      costPerGuestAmount: z.number().optional(),
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      phase: z.string(),
      dueDate: z.string(),
      dueTime: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
      assignedTo: z.string().optional(),
      dependencies: z.array(z.string()),
      notes: z.string().optional(),
      relatedVendorId: z.string().optional(),
      relatedBudgetItemId: z.string().optional(),
      completedAt: z.string().optional(),
      reason: z.string().optional(),
    })
  ),
  vendors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      contact: z.string().optional(),
      quotedAmount: z.number(),
      quoteStatus: z.enum(['pending', 'received', 'negotiating', 'rejected', 'accepted']),
      bookingStatus: z.enum(['unbooked', 'hold', 'confirmed', 'cancelled']),
      depositPaid: z.number(),
      balanceDue: z.number(),
      servicesIncluded: z.array(z.string()),
      exclusions: z.array(z.string()),
      setupTransportCharges: z.number(),
      taxAmount: z.number(),
      cancellationTerms: z.string(),
      notes: z.string(),
      relatedTaskIds: z.array(z.string()),
      quoteDetails: z.any().optional(),
      isVerifiedByUser: z.boolean().optional(),
    })
  ),
  dayOfSchedule: z.array(
    z.object({
      id: z.string(),
      time: z.string(),
      endTime: z.string().optional(),
      activity: z.string(),
      owner: z.string().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
      isCompleted: z.boolean().optional(),
    })
  ),
  personalization: PersonalizationSchema,
  aiAssumptions: z.array(z.string()),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isDemo: z.boolean().optional(),
});

// Admin Authentication Schema
export const AdminLoginRequestSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
});

// Chat Request Schema
export const AIChatRequestSchema = z.object({
  eventId: z.string(),
  userMessage: z.string().min(1).max(1000),
  eventContext: z.object({
    name: z.string(),
    type: z.string(),
    totalBudget: z.number(),
    guestCount: z.number(),
    city: z.string(),
    venueName: z.string().optional(),
    criticalBlockers: z.array(z.string()).default([]),
  }),
});
