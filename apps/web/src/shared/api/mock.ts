import type { Alert, Complaint, DashboardSummary, Institution } from '../types';
export const institutions: Institution[] = [
  {
    id: 'inst-01',
    permanentId: 'SYN-AICTE-1-900000001',
    name: 'Aaravika Institute of Engineering (Fictional)',
    state: 'Karnataka',
  },
];
export const complaints: Complaint[] = [
  {
    id: 'cmp-001',
    originalId: 'PGRC-DEMO-001',
    institutionId: 'inst-01',
    bureauId: 'PGRC',
    title: 'Unapproved admission fees',
    description: 'Students report unauthorised collection of admission fees.',
    category: 'FEES',
    status: 'RECEIVED',
    overlapReviewStatus: 'PENDING',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'cmp-002',
    originalId: 'RB-DEMO-002',
    institutionId: 'inst-01',
    bureauId: 'RB',
    title: 'Additional admission payments',
    description: 'Institute demanding extra payments beyond approved charges.',
    category: 'FEES',
    status: 'UNDER_PROCESS',
    overlapReviewStatus: 'PENDING',
    createdAt: '2026-10-02T09:00:00Z',
  },
];
export const summary: DashboardSummary = {
  totalComplaints: 25,
  pendingOverlapReviews: 6,
  activeActions: 4,
  scope: 'SYNTHETIC',
};
// Synthetic unread alerts, shaped like GET /api/alerts items.
export const alerts: Alert[] = [
  {
    id: 'alert-demo-001',
    type: 'OVERLAP',
    complaintId: 'cmp-001',
    message: 'Overlap awaits review',
    readAt: null,
    createdAt: '2026-10-02T09:15:00Z',
  },
  {
    id: 'alert-demo-002',
    type: 'DEADLINE',
    complaintId: 'cmp-002',
    message: 'Disposal timeline ends in 6 days',
    readAt: null,
    createdAt: '2026-10-24T08:00:00Z',
  },
  {
    id: 'alert-demo-003',
    type: 'STATUS_CHANGE',
    complaintId: 'cmp-002',
    message: 'Case moved to Under process',
    readAt: null,
    createdAt: '2026-10-25T11:05:00Z',
  },
];
