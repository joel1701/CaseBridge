// Seed records shared with the synthetic store (synthetic/core.ts builds on these).
import type { Complaint, Institution } from '../types';
export const institutions: Institution[] = [
  {
    id: 'inst-01',
    permanentId: 'SYN-AICTE-1-900000001',
    name: 'Aaravika Institute of Engineering (Fictional)',
    state: 'Karnataka',
  },
  {
    id: 'inst-02',
    permanentId: 'SYN-AICTE-1-900000014',
    name: 'Deccan Valley College of Technology (Fictional)',
    state: 'Telangana',
  },
  {
    id: 'inst-03',
    permanentId: 'SYN-AICTE-1-900000027',
    name: 'Kaveri Polytechnic Institute (Fictional)',
    state: 'Tamil Nadu',
  },
  {
    id: 'inst-04',
    permanentId: 'SYN-AICTE-1-900000031',
    name: 'Malabar School of Management (Fictional)',
    state: 'Kerala',
  },
  {
    id: 'inst-05',
    permanentId: 'SYN-AICTE-1-900000048',
    name: 'Narmada Institute of Pharmacy (Fictional)',
    state: 'Madhya Pradesh',
  },
  {
    id: 'inst-06',
    permanentId: 'SYN-AICTE-1-900000052',
    name: 'Sabarmati College of Architecture (Fictional)',
    state: 'Gujarat',
  },
  {
    id: 'inst-07',
    permanentId: 'SYN-AICTE-1-900000069',
    name: 'Hooghly Institute of Engineering (Fictional)',
    state: 'West Bengal',
  },
  {
    id: 'inst-08',
    permanentId: 'SYN-AICTE-1-900000073',
    name: 'Doaba Institute of Technology (Fictional)',
    state: 'Punjab',
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
