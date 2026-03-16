export interface DecisionCategory {
  id: string;
  name: string;
  description?: string;
  decisions: number;
  couldDelegate: number;
  notSure: boolean;
}

export interface BottleneckPattern {
  id: string;
  name: string;
  description: string;
  checked: boolean;
}

export interface DelayTaxValues {
  product: { arr: string; months: string };
  feature: { mrr: string; weeks: string; rate: string };
  deals: { count: string; value: string; rate: string };
  churn: { customers: string; mrr: string };
}

export interface DelayTaxItem {
  id: string;
  name: string;
  amount: number;
}

export interface UserSegmentationData {
  founderRole: string;
  revenueRange: string;
  teamSize: string;
  industryVertical: string;
  otherIndustryVertical?: string;
}

export interface OpenEndedResponses {
  desiredOutcome: string;   // Q13
  obstacle: string;          // Q14
  anythingElse: string;      // Q15
}

export interface AuditData {
  // Section 1: Decision Audit
  timeframe: 'Week' | 'Month';
  decisionCategories: DecisionCategory[];
  annualCompensation: number;
  averageMinutesPerDecision: number;
  delayTax: DelayTaxItem[];
  delayTaxValues: DelayTaxValues;
  patterns: BottleneckPattern[];
  openEndedResponses?: OpenEndedResponses;
}

export interface AuditResults {
  totalDecisions: number;
  decisionLoadLevel: 'healthy' | 'elevated' | 'critical' | 'danger';
  hourlyRate: number;
  hoursPerWeek: number;
  annualCost: number;
  delayTaxAnnual: number;
  totalBottleneckCost: number;
  patternsChecked: number;
  overallStatus: 'optimized' | 'scaling-risk' | 'critical';
}

export interface Audit {
  _id: string;
  userName: string;
  userEmail: string;
  auditData: AuditData;
  segmentation?: UserSegmentationData;
  results: AuditResults;
  createdAt: string;
}

// Operational categories for the 30% threshold calculation
export const OPERATIONAL_CATEGORY_IDS = [
  'people-org',
  'customer-support',
  'operations-delivery',
  'meetings-communication',
  'founder-admin'
];

export const INITIAL_CATEGORIES: DecisionCategory[] = [
  { id: 'people-org', name: 'People & Org', description: 'Hiring decisions · Promotions/raises · Role/ownership changes · Org structure changes', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'product-tech', name: 'Product & Tech', description: 'Roadmap priorities · Feature yes/no · Technical debt tradeoffs · Release go/no-go', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'revenue-pricing', name: 'Revenue & Pricing', description: 'Sales strategy changes · Big-deal approvals · Pricing changes · Packaging changes · Renewal/churn save decisions', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'finance-budget', name: 'Finance & Budget', description: 'Budget allocations · Headcount additions · Key vendor contract terms · Forecast/plan changes', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'customer-support', name: 'Customer & Support', description: 'VIP customer requests · Support escalations · SLA exceptions · Onboarding changes · Custom feature promises · Account termination decisions', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'operations-delivery', name: 'Operations & Delivery', description: 'Process changes · New SOP approvals · Project prioritization · Cross-team coordination decisions · Quality/standards exceptions · Vendor/service changes · Performance reviews · Conflict escalations (day-to-day) · Sprint scope changes · Bug/fire escalations (day-to-day) · Discount overrides · Individual renewal/churn save decisions on specific accounts · New spend approvals (small/medium)', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'meetings-communication', name: 'Meetings & Communication', description: 'New recurring meetings · Who attends which meeting · Agenda/priority decisions · Internal announcement approvals', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'founder-admin', name: 'Founder Admin & Misc', description: 'Inbox triage priorities · Calendar/time-blocking changes · Tool stack changes · Personal brand/content decisions · Legal/compliance escalations', decisions: 0, couldDelegate: 0, notSure: false },
];

export const INITIAL_DELAY_TAX: DelayTaxItem[] = [
  { id: 'product', name: 'Product launches that shipped late', amount: 0 },
  { id: 'feature', name: 'Feature launches that shipped late', amount: 0 },
  { id: 'deals', name: 'Deals that stalled waiting for your approval', amount: 0 },
  { id: 'churn', name: 'Customers who churned while waiting for resolution', amount: 0 },
];

export const INITIAL_DELAY_TAX_VALUES: DelayTaxValues = {
  product: { arr: "", months: "" },
  feature: { mrr: "", weeks: "", rate: "25" },
  deals: { count: "", value: "", rate: "" },
  churn: { customers: "", mrr: "" },
};

export const INITIAL_PATTERNS: BottleneckPattern[] = [
  {
    id: 'reactive-decision-making',
    name: 'Reactive Decision-Making',
    description: 'Decisions are being made to relieve pressure, not to create progress. You make decisions quickly to keep things moving, direction changes after work starts, and you spend time correcting and clarifying.',
    checked: false,
  },
  {
    id: 'fragmentation',
    name: 'Fragmentation',
    description: 'Your attention is being pulled away from profit-critical decisions. Small decisions interrupt big ones, you switch priorities when things feel urgent even when the plan was clear, and your focus is constantly broken.',
    checked: false,
  },
  {
    id: 'overcommitment-dependency',
    name: 'Overcommitment / Dependency',
    description: "Your team waits for you because they aren't confident deciding without you. You say yes to more than you can manage, and the business runs through you instead of beside you.",
    checked: false,
  },
  {
    id: 'reversal-inconsistency',
    name: 'Reversal / Inconsistency',
    description: 'You change direction after giving your team clear guidance. You skip reviewing the downstream impact of decisions, causing rework cycles and eroding team trust.',
    checked: false,
  },
  {
    id: 'speed-mismatch',
    name: 'Speed Mismatch',
    description: 'Decisions either sit in your head for days before you act, or you move faster than your team can implement. Both patterns create bottlenecks — one from delay, one from overload.',
    checked: false,
  },
];
