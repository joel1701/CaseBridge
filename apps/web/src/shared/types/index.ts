export type Role = 'ADMIN' | 'BUREAU_HEAD' | 'OFFICER';
export type ComplaintStatus =
  'RECEIVED' | 'UNDER_PROCESS' | 'TRANSFERRED' | 'ESCALATED' | 'DISPOSED';
export type OverlapReviewStatus = 'NOT_REVIEWED' | 'PENDING' | 'REVIEWED';
export interface Institution {
  id: string;
  permanentId: string;
  name: string;
  state: string;
}
export interface Complaint {
  id: string;
  originalId: string;
  institutionId: string;
  bureauId: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  overlapReviewStatus: OverlapReviewStatus;
  createdAt: string;
}
export interface DashboardSummary {
  totalComplaints: number;
  pendingOverlapReviews: number;
  activeActions: number;
  scope: 'SYNTHETIC' | 'AUTHORIZED';
}
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { page: number; pageSize: number; total: number };
}
export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}
export interface AuthUser {
  id: string;
  displayName: string;
  role: Role;
  bureauId: string | null;
}
export type AlertType = 'OVERLAP' | 'DEADLINE' | 'STATUS_CHANGE' | string;
export interface Alert {
  id: string;
  type: AlertType;
  complaintId: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
}

// Coordination overview (GET /api/dashboard/overview, proposed; mock until the backend ships it).
export type BureauCode = string;
/** An AICTE regional office, e.g. "Bengaluru". */
export type Region = string;
export type OverviewRange = '30d' | '90d' | '12m' | 'all';
export interface OverviewFilters {
  region?: Region;
  /** A bureau code, or OTHER for every bureau except RB and PGRC. Omitted = all. */
  bureau?: 'RB' | 'PGRC' | 'OTHER';
  range: OverviewRange;
}
export interface CountWithPrevious {
  current: number;
  lastMonth: number;
  /** 12 month-end values, oldest first (sparklines). Earlier months ignore the period filter; the last is `current`. */
  trend: number[];
}
export type OverviewCountKey =
  | 'received'
  | 'pending'
  | 'underProcess'
  | 'disposed'
  | 'transferred'
  | 'escalated'
  | 'approachingDeadline'
  | 'overdue';
export interface OverlapAlert {
  id: string;
  linkId: string;
  /** Every pairwise link in this overlap (three-bureau overlaps have two). */
  linkIds?: string[];
  updatedAt: string;
  institution: { id: string; name: string; permanentId: string };
  bureaus: BureauCode[];
  cases: { id: string; originalId: string; bureau: BureauCode }[];
  /** 0..1 */
  confidence: number;
  reasons: string[];
  status: 'NEW' | 'UNDER_REVIEW' | 'LINKED';
  detectedAt: string;
}
export interface DashboardOverview {
  scope: 'SYNTHETIC' | 'AUTHORIZED';
  asOf: string;
  filters: OverviewFilters;
  /** Regional offices present in the data, for the region filter. */
  regions: Region[];
  /** pending = not disposed; overdue = not disposed and dueAt before asOf. */
  counts: Record<OverviewCountKey, CountWithPrevious>;
  monthlyTrend: { month: string; received: number; disposed: number }[];
  bureauWorkload: {
    bureau: BureauCode;
    pending: number;
    underProcess: number;
    overdue: number;
  }[];
  regionBreakdown: { region: Region; open: number; overdue: number }[];
  ageing: {
    thresholdDays: number;
    buckets: {
      key: '0-15' | '16-30' | '31-60' | '60+';
      label: string;
      count: number;
    }[];
  };
  overlapAlerts: OverlapAlert[];
  multiBureauInstitutions: {
    institutionId: string;
    name: string;
    permanentId: string;
    region: Region;
    bureaus: BureauCode[];
    openCases: number;
    overlaps: number;
    lastActivityAt: string;
  }[];
  recentActivity: {
    id: string;
    at: string;
    kind: 'RECEIVED' | 'TRANSFERRED' | 'ESCALATED' | 'DISPOSED' | 'LINKED';
    caseId: string;
    originalId: string;
    bureau: BureauCode;
    text: string;
  }[];
  deadlineAlerts: {
    approachingWindowHours: number;
    items: {
      caseId: string;
      originalId: string;
      institution: string;
      bureau: BureauCode;
      dueAt: string;
      /** Negative when overdue. */
      hoursLeft: number;
      state: 'APPROACHING' | 'OVERDUE';
    }[];
  };
}

export * from './api';
