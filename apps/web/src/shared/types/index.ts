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
