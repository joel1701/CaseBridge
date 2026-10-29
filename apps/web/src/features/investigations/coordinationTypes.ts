import type { CoordinationType } from '@/shared/types';

export const COORDINATION_TYPES: { value: CoordinationType; label: string }[] =
  [
    { value: 'SHARE_EVIDENCE', label: 'Share evidence' },
    { value: 'JOINT_INVESTIGATION', label: 'Joint investigation' },
    { value: 'DEFER_ACTION', label: 'Defer action to one bureau' },
    { value: 'KEEP_SEPARATE', label: 'Keep separate' },
  ];
