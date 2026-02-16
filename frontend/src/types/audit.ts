export interface DecisionCategory {
  id: string;
  name: string;
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
}

export interface AuditData {
  // Section 1: Decision Audit
  decisionCategories: DecisionCategory[];
  annualCompensation: number;
  averageMinutesPerDecision: number;
  delayTax: DelayTaxItem[];
  patterns: BottleneckPattern[];
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
  'hiring',
  'team',
  'customer',
  'spending',
  'operations',
  'marketing',
];

export const INITIAL_CATEGORIES: DecisionCategory[] = [
  { id: 'hiring', name: 'Hiring / People decisions', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'team', name: 'Team conflicts / Performance issues', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'product', name: 'Product / Feature prioritization', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'technical', name: 'Technical / Architecture', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'customer', name: 'Customer issues / Escalations', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'spending', name: 'Spending / Budget approvals', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'sales', name: 'Sales / Deal approvals', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'pricing', name: 'Pricing / Packaging', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'operations', name: 'Operations / Process questions', decisions: 0, couldDelegate: 0, notSure: false },
  { id: 'marketing', name: 'Marketing / Content approvals', decisions: 0, couldDelegate: 0, notSure: false },
];

export const INITIAL_DELAY_TAX: DelayTaxItem[] = [
  { id: 'late-launches', name: 'Product/feature launches that shipped late', amount: 0 },
  { id: 'stalled-deals', name: 'Deals that stalled waiting for your approval', amount: 0 },
  { id: 'churned-customers', name: 'Customers who churned while waiting for resolution', amount: 0 },
];

export const INITIAL_PATTERNS: BottleneckPattern[] = [
  {
    id: 'approval-addict',
    name: 'The Approval Addict',
    description: 'You require sign-off on things your team should own. You tell yourself it\'s "quality control" but really it\'s control.',
    checked: false,
  },
  {
    id: 'only-i-know',
    name: 'The "Only I Know" Problem',
    description: 'Only you understand the full picture, so only you can decide. You haven\'t built systems to share context.',
    checked: false,
  },
  {
    id: 'heroic-firefighter',
    name: 'The Heroic Firefighter',
    description: 'You swoop in to solve problems your team could handle. It feels good. It\'s killing your scale.',
    checked: false,
  },
  {
    id: 'perfectionist-blocker',
    name: 'The Perfectionist Blocker',
    description: 'You delay decisions waiting for perfect information. 80% clarity is enough — you wait for 95%.',
    checked: false,
  },
  {
    id: 'meeting-magnet',
    name: 'The Meeting Magnet',
    description: 'You\'re in every meeting "just in case." Your calendar is a graveyard of low-value time.',
    checked: false,
  },
];
