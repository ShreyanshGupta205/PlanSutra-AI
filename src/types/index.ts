// PlanSutra AI Core Domain Types

export type EventType = 
  | 'wedding' 
  | 'birthday' 
  | 'community' 
  | 'college_fest' 
  | 'corporate' 
  | 'custom';

export type EventSetting = 'indoor' | 'outdoor' | 'mixed';

export type SpendingLevel = 'budget_conscious' | 'balanced' | 'premium';

export type OptimizationMode = 'minimize_costs' | 'balanced' | 'maximize_experience';

export interface PersonalizationPreferences {
  themeStyle?: string;
  colors?: string[];
  culturalTraditions?: string;
  foodDietary?: string[];
  accessibility?: string[];
  entertainment?: string[];
  decoration?: string;
  sustainability?: string;
  mustHaveMoments?: string[];
  itemsToAvoid?: string[];
}

export type QuoteStatus = 'pending' | 'received' | 'negotiating' | 'rejected' | 'accepted';
export type BookingStatus = 'unbooked' | 'hold' | 'confirmed' | 'cancelled';

export interface VendorQuoteDetails {
  baseAmount: number;
  taxesIncluded: boolean;
  taxAmount?: number;
  setupIncluded: boolean;
  setupAmount?: number;
  transportIncluded: boolean;
  transportAmount?: number;
  staffMealsIncluded: boolean;
  overtimeHourlyRate?: number;
  cancellationPolicy?: string;
  depositRequiredPercent?: number;
  omissionsIdentified?: string[];
  comparableTotal?: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contact?: string;
  quotedAmount: number;
  quoteStatus: QuoteStatus;
  bookingStatus: BookingStatus;
  depositPaid: number;
  balanceDue: number;
  servicesIncluded: string[];
  exclusions: string[];
  setupTransportCharges: number;
  taxAmount: number;
  cancellationTerms: string;
  notes: string;
  relatedTaskIds: string[];
  quoteDetails?: VendorQuoteDetails;
  isVerifiedByUser?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number; // Planned allocation in INR
  estimated: number; // Initial estimate in INR
  quoted: number;    // Received quotation amount
  actual: number;    // Contracted/agreed final amount
  paid: number;      // Paid so far
  notes?: string;
  vendorId?: string;
  isContingency?: boolean;
  costPerGuestApplicable?: boolean;
  costPerGuestAmount?: number;
}

export type TaskPhase = 
  | 'initial_planning'
  | 'budget_venue'
  | 'vendor_selection'
  | 'invitations_guests'
  | 'final_confirmations'
  | 'final_week'
  | 'day_of'
  | 'post_event';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
  id: string;
  title: string;
  description: string;
  phase: TaskPhase;
  dueDate: string; // ISO date string YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  dependencies: string[]; // IDs of tasks that must be completed first
  notes?: string;
  relatedVendorId?: string;
  relatedBudgetItemId?: string;
  completedAt?: string;
  reason?: string; // Explanation of why this deadline matters
}

export interface DayOfScheduleItem {
  id: string;
  time: string; // HH:mm
  endTime?: string;
  activity: string;
  owner?: string;
  location?: string;
  notes?: string;
  isCompleted?: boolean;
}

export type FindingSeverity = 
  | 'critical_blocker' 
  | 'high_priority_risk' 
  | 'warning' 
  | 'missing_info' 
  | 'suggestion' 
  | 'resolved';

export type FindingCategory = 
  | 'budget' 
  | 'timeline' 
  | 'venue' 
  | 'vendor' 
  | 'accessibility' 
  | 'logistics';

export interface CorrectiveAction {
  label: string;
  description: string;
  actionType: 
    | 'increase_budget'
    | 'reduce_category_cost'
    | 'adjust_guest_count'
    | 'confirm_venue_capacity'
    | 'reschedule_task'
    | 'add_missing_vendor'
    | 'resolve_dependency'
    | 'add_contingency'
    | 'record_quotation'
    | 'resolve_accessibility';
  payload?: any;
}

export interface PlanDoctorFinding {
  id: string;
  title: string;
  severity: FindingSeverity;
  category: FindingCategory;
  explanation: string;
  triggerRule: string;
  affectedEntity: {
    type: 'event' | 'budget_category' | 'task' | 'vendor' | 'schedule';
    id?: string;
    name?: string;
  };
  correctiveActions: CorrectiveAction[];
  isResolved: boolean;
  resolvedAt?: string;
}

export interface ReadinessScoreBreakdown {
  score: number; // 0 to 100
  label: string; // "Requires Attention", "Good Progress", "Execution Ready"
  blockerCount: number;
  highRiskCount: number;
  warningCount: number;
  factors: {
    budgetIntegrity: number; // 0 - 25
    venueCapacity: number;   // 0 - 20
    timelineReadiness: number; // 0 - 20
    vendorConfirmations: number; // 0 - 20
    logisticsAccessibility: number; // 0 - 15
  };
  unresolvedBlockers: string[];
}

export interface EventPlan {
  id: string;
  name: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  city: string;
  guestCount: number;
  venueName?: string;
  venueCapacity?: number;
  setting: EventSetting;
  
  // Financials
  totalBudget: number; // in INR
  contingencyReservePercent: number; // e.g. 10 for 10%
  spendingLevel: SpendingLevel;
  priorityCategories: string[];
  optimizationMode: OptimizationMode;
  
  // Modules
  budgetCategories: BudgetCategory[];
  tasks: Task[];
  vendors: Vendor[];
  dayOfSchedule: DayOfScheduleItem[];
  
  // Customization
  personalization: PersonalizationPreferences;
  aiAssumptions: string[];
  
  // Meta
  version: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

// Change Simulator Types
export interface SimulationChanges {
  guestCount?: number;
  budgetReductionPercent?: number;
  newEventDate?: string;
  venueUnavailable?: boolean;
  cancelledVendorId?: string;
  rainRisk?: boolean;
}

export interface SimulationResult {
  originalPlan: EventPlan;
  simulatedPlan: EventPlan;
  budgetDifference: number; // positive = increased cost, negative = savings
  affectedCategories: {
    categoryName: string;
    originalCost: number;
    simulatedCost: number;
    difference: number;
    reason: string;
  }[];
  affectedTasks: string[];
  affectedVendors: string[];
  newFindings: PlanDoctorFinding[];
  resolvedFindings: PlanDoctorFinding[];
  assumptions: string[];
  recommendedActions: CorrectiveAction[];
}

// Admin Types
export interface AdminTemplate {
  id: string;
  name: string;
  eventType: EventType;
  description: string;
  isActive: boolean;
  defaultCategories: { name: string; percentage: number; costPerGuest?: boolean; defaultPerGuest?: number }[];
  defaultPhases: { phase: TaskPhase; defaultTasks: { title: string; daysBeforeEvent: number; priority: TaskPriority; reason: string }[] }[];
  defaultRecommendations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  outcome: 'success' | 'failure';
  details?: string;
}

export interface SystemHealthMetrics {
  aiRequestCount: number;
  aiFailureCount: number;
  averageLatencyMs: number;
  errorCategories: Record<string, number>;
  lastHealthCheck: string;
  serverStatus: 'healthy' | 'degraded' | 'offline';
  uptimeSeconds: number;
}
