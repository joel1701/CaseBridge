import type { Principal } from '../../middleware/auth.js';
import type { CreateAction } from './validation.js';
export interface FirewallComplaint {
  id: string;
  institutionId: string;
  bureauId: string;
  category: string;
  updatedAt: Date;
}
export interface ExistingAction {
  id: string;
  complaintId: string;
  bureauId: string;
  type: 'EVIDENCE_REQUEST' | 'INSPECTION' | 'NOTICE' | 'REVIEW';
  status: string;
  summary: string;
  evidenceScope: string | null;
  dueAt: Date | null;
  complaint: { institutionId: string; category: string };
  bureau: { code: string };
}
export interface Warning {
  code:
    | 'POSSIBLE_DUPLICATE'
    | 'PARALLEL_INVESTIGATION'
    | 'POSSIBLE_CONFLICT'
    | 'POSSIBLE_OVERLAP';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  reasons: string[];
  recommendation: string;
  relatedActionId: string | null;
  relatedComplaintId: string | null;
  relatedBureauCode: string;
  restricted: boolean;
}
export interface DetectedOverlap {
  actionId: string;
  warning: Warning;
}
export interface CreatedAction {
  id: string;
  complaintId: string;
  bureauId: string;
  createdById: string | null;
  type: string;
  status: string;
  createdAt: Date;
}
export interface AuditEntry {
  actorId: string;
  complaintId: string;
  event: string;
  metadata: { [key: string]: string | number | boolean | string[] };
}
export interface FirewallTransaction {
  complaint(principal: Principal, id: string): Promise<FirewallComplaint>;
  activeActions(institutionId: string): Promise<ExistingAction[]>;
  create(
    principal: Principal,
    complaint: FirewallComplaint,
    input: CreateAction,
  ): Promise<CreatedAction>;
  audit(entry: AuditEntry): Promise<void>;
}
export interface FirewallRepository extends FirewallTransaction {
  transaction<T>(
    institutionId: string,
    work: (tx: FirewallTransaction) => Promise<T>,
  ): Promise<T>;
}
