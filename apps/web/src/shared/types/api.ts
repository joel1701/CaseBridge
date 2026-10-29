// Request and response types for docs/API_CONTRACT.md (including "Operational additions").
// Field names follow the contract and the API's actual selects.
import type { ComplaintStatus, OverlapReviewStatus, Role } from './index';

export type Scope = 'SYNTHETIC' | 'AUTHORIZED';
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}
export interface PageQuery {
  page?: number;
  /** 1..100, default 20 */
  pageSize?: number;
}
/** A single record plus where it came from. Real and synthetic are never mixed. */
export interface Scoped<T> {
  data: T;
  scope: Scope;
}
export interface Paged<T> {
  items: T[];
  meta: PageMeta;
  scope: Scope;
}

// Complaints ---------------------------------------------------------------
export interface ComplaintListItem {
  id: string;
  originalId: string;
  institutionId: string;
  bureauId: string;
  sourceBureauId: string;
  title: string;
  category: string;
  status: ComplaintStatus;
  overlapReviewStatus: OverlapReviewStatus;
  assignedToId: string | null;
  dueAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}
export interface ComplaintDetail extends ComplaintListItem {
  description: string;
  createdById: string | null;
  resolvedAt: string | null;
}
export type ComplaintSortBy = 'createdAt' | 'updatedAt' | 'dueAt' | 'title';
export interface ComplaintListQuery extends PageQuery {
  status?: ComplaintStatus;
  institutionId?: string;
  category?: string;
  /** Searches title, originalId and description; max 200 */
  q?: string;
  assignedToId?: string;
  sortBy?: ComplaintSortBy;
  sortOrder?: 'asc' | 'desc';
  archived?: boolean;
  /** ADMIN only */
  bureauId?: string;
  /**
   * Frontend-only views the API has no parameter for (dashboard tiles, bureau queue
   * tabs). Never sent to the API; see listComplaints.
   */
  view?: ComplaintView;
}
export type ComplaintView = 'open' | 'overdue' | 'dueSoon' | 'unassigned';
export interface ComplaintCreate {
  originalId: string;
  institutionId: string;
  title: string;
  description: string;
  category: string;
  bureauId: string;
  dueAt?: string | null;
}
export interface ComplaintUpdate {
  expectedVersion: number;
  /** 1..2000 */
  reason: string;
  title?: string;
  description?: string;
  category?: string;
  dueAt?: string | null;
  institutionId?: string;
  assignedToId?: string | null;
  status?: ComplaintStatus;
  bureauId?: string;
}
export interface ComplaintArchive {
  expectedVersion: number;
  reason: string;
}
export interface ImportResult {
  createdIds: string[];
  count: number;
}
export interface TimelineEntry {
  id: string;
  event: string;
  actorId: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Institutions and bureaus ---------------------------------------------------
export interface InstitutionSummary {
  id: string;
  permanentId: string;
  name: string;
  state: string;
  region: string | null;
}
export interface InstitutionProfile extends InstitutionSummary {
  location: string | null;
  authorizedComplaintCount: number;
  byStatus: { status: ComplaintStatus; _count: number }[];
  byBureau: { bureauId: string; _count: number }[];
  recentComplaints: ComplaintListItem[];
}
export interface Bureau {
  id: string;
  code: string;
  name: string;
}
export interface Officer {
  id: string;
  displayName: string;
  role: Role;
  bureauId: string | null;
}

// Intelligence -----------------------------------------------------------------
export type CaseLinkStatus = 'SUGGESTED' | 'CONFIRMED' | 'REJECTED';
export interface LinkSuggestion {
  id: string;
  status: CaseLinkStatus;
  score: number;
  explanation: {
    institutionMatch: boolean;
    categoryMatch: boolean;
    semanticSimilarity: number;
    reasons: string[];
  };
  modelVersion: string;
}
export interface AnalyzeResult {
  caseId: string;
  suggestions: LinkSuggestion[];
  recommendationOnly: true;
}
export interface LinkSummary {
  id: string;
  status: CaseLinkStatus;
  score: number;
  /** id is null when the counterpart is outside the requester's scope */
  otherComplaint: {
    id: string | null;
    bureauCode: string;
    restricted: boolean;
  };
  explanation: { reasons: string[] };
  /** Needed as expectedUpdatedAt for a review. */
  updatedAt?: string;
}
export interface LinkReview {
  status: 'CONFIRMED' | 'REJECTED';
  /** 1..2000 */
  reason: string;
  expectedUpdatedAt: string;
}
export interface LinkReviewResult {
  id: string;
  status: CaseLinkStatus;
  reviewedById: string;
  reviewReason: string;
  reviewedAt: string;
  updatedAt: string;
}
export type GraphNodeType = 'institution' | 'complaint' | 'bureau' | 'action';
export type GraphEdgeType =
  'HAS_COMPLAINT' | 'OWNED_BY' | 'HAS_ACTION' | 'RELATED_TO';
export interface Graph {
  nodes: { id: string; type: GraphNodeType; label: string }[];
  edges: { id: string; source: string; target: string; type: GraphEdgeType }[];
}

// Actions (Action Firewall) ------------------------------------------------------
export type ActionType =
  'EVIDENCE_REQUEST' | 'INSPECTION' | 'NOTICE' | 'REVIEW';
export type ActionStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface ActionDraft {
  complaintId: string;
  type: ActionType;
  /** 1..2000 */
  summary: string;
  /** max 200 */
  evidenceScope?: string;
  dueAt?: string | null;
}
export interface ActionPreview {
  warnings: { code: string; message: string; relatedActionId: string | null }[];
  recommendation: string;
  recommendationOnly: true;
}
export interface ActionCreate extends ActionDraft {
  /** Required (1..2000) when proceeding despite preview warnings. */
  overrideReason?: string;
}
export interface Action {
  id: string;
  complaintId: string;
  bureauId: string;
  createdById: string | null;
  type: ActionType;
  status: ActionStatus;
  summary?: string;
  evidenceScope?: string | null;
  dueAt?: string | null;
  createdAt: string;
}

// Coordination -------------------------------------------------------------------
export type CoordinationType =
  'SHARE_EVIDENCE' | 'JOINT_INVESTIGATION' | 'DEFER_ACTION' | 'KEEP_SEPARATE';
export interface CoordinationDecisionInput {
  caseLinkId: string;
  type: CoordinationType;
  /** 1..2000 */
  rationale: string;
}
export interface CoordinationDecision extends CoordinationDecisionInput {
  id: string;
  decidedById: string;
  createdAt: string;
}
export type WorkspaceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
export interface Workspace {
  id: string;
  caseLinkId: string;
  status: WorkspaceStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  coordinatorId: string | null;
  coordinatorRestricted: boolean;
  involvedBureauIds: string[];
  complaintIds: string[];
  sharedActionIds: string[];
}
export type WorkspaceCommand =
  | { kind: 'ASSIGN'; officerId: string }
  | { kind: 'TRACK_ACTION'; actionId: string }
  | { kind: 'SET_STATUS'; status: WorkspaceStatus };
export interface WorkspaceUpdate {
  expectedVersion: number;
  command: WorkspaceCommand;
}
export interface WorkspaceHistoryEntry {
  event: 'COORDINATION_WORKSPACE_CREATED' | 'COORDINATION_WORKSPACE_UPDATED';
  operation: WorkspaceCommand['kind'] | null;
  version: number;
  fromStatus: WorkspaceStatus | null;
  toStatus: WorkspaceStatus;
  actorId: string | null;
  fromCoordinatorId: string | null;
  toCoordinatorId: string | null;
  coordinatorRestricted: boolean;
  actionId: string | null;
  actionRestricted: boolean;
  createdAt: string;
}
export interface WorkspaceListQuery extends PageQuery {
  caseLinkId?: string;
  complaintId?: string;
  status?: WorkspaceStatus;
}

// Alerts -----------------------------------------------------------------------------
export type AlertKind =
  'OVERLAP' | 'ACTION_CONFLICT' | 'DEADLINE' | 'ESCALATION' | 'STATUS_CHANGE';
export interface AlertItem {
  id: string;
  type: AlertKind;
  complaintId: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
  resolvedAt: string | null;
  userId: string | null;
  dedupeKey: string | null;
}
export interface AlertListQuery extends PageQuery {
  unreadOnly?: boolean;
  resolved?: 'false' | 'true' | 'all';
}

// Reports ----------------------------------------------------------------------------
export interface ReportsSummary {
  totalComplaints: number;
  pendingComplaints: number;
  disposedComplaints: number;
  escalatedComplaints: number;
  overdueCount: number;
  pendingOverlapReviews: number;
  activeActions: number;
  byStatus: Record<ComplaintStatus, number>;
  byBureau: { bureauId: string; _count: number }[];
  byCategory: { category: string; _count: number }[];
  byInstitution: { institutionId: string; _count: number }[];
  trends: { month: string; count: number }[];
  averageResolutionHours: number | null;
  coordinationRequiredCount: number;
  scope: 'AUTHORIZED' | 'SYNTHETIC';
}
export interface DateRange {
  /** Inclusive ISO UTC on createdAt */
  from?: string;
  to?: string;
}
