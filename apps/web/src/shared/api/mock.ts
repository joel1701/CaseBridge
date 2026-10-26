import type { Complaint, DashboardSummary, Institution } from '../types';
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
