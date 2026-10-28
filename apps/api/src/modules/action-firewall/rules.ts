import type { Principal } from '../../middleware/auth.js';
import { canRead } from '../case-links/access.js';
import { distinctPeriods, jaccard, tokens } from '../matching/scoring.js';
import type { ProposedAction } from './validation.js';
import type {
  FirewallComplaint,
  ExistingAction,
  DetectedOverlap,
  Warning,
} from './types.js';
export const FIREWALL_RULE_VERSION = 'firewall-v1';
const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function detectOverlaps(
  principal: Principal,
  complaint: FirewallComplaint,
  proposed: ProposedAction,
  existing: ExistingAction[],
): DetectedOverlap[] {
  const findings: DetectedOverlap[] = [];
  for (const action of existing) {
    if (
      !['PLANNED', 'IN_PROGRESS'].includes(action.status) ||
      action.complaint.institutionId !== complaint.institutionId
    )
      continue;
    const left = proposed.evidenceScope ?? '',
      right = action.evidenceScope ?? '';
    if (distinctPeriods(left, right)) continue;
    const exactScope = Boolean(
      left && right && normalize(left) === normalize(right),
    );
    const sameCategory =
      complaint.category.trim().toUpperCase() ===
      action.complaint.category.trim().toUpperCase();
    const scopeOverlap =
      left && right ? jaccard(tokens(left), tokens(right)) : 0;
    const summaryOverlap = jaccard(
      tokens(proposed.summary),
      tokens(action.summary),
    );
    let code: Warning['code'] | undefined,
      severity: Warning['severity'] = 'LOW',
      message = '';
    if (
      exactScope &&
      proposed.type === 'EVIDENCE_REQUEST' &&
      action.type === 'EVIDENCE_REQUEST'
    ) {
      code = 'POSSIBLE_DUPLICATE';
      severity = 'HIGH';
      message = 'An active evidence request covers the same evidence scope.';
    } else if (exactScope && proposed.type === action.type) {
      code = 'PARALLEL_INVESTIGATION';
      severity = 'MEDIUM';
      message = 'An active action of the same type covers this scope.';
    } else if (
      exactScope &&
      [proposed.type, action.type].includes('NOTICE') &&
      [proposed.type, action.type].some((type) =>
        ['INSPECTION', 'EVIDENCE_REQUEST'].includes(type),
      )
    ) {
      code = 'POSSIBLE_CONFLICT';
      severity = 'MEDIUM';
      message =
        'A notice and an ongoing fact-finding action cover the same scope; timing may need coordination.';
    } else if (
      sameCategory &&
      (scopeOverlap >= 0.6 || (!left && !right && summaryOverlap >= 0.7))
    ) {
      code = 'POSSIBLE_OVERLAP';
      message =
        'Active actions share allegation category and substantial scope or summary wording.';
    }
    if (!code) continue;
    const visible = canRead(principal, action);
    const recommendation =
      code === 'POSSIBLE_DUPLICATE'
        ? 'Contact the initiating bureau to reuse permitted evidence or coordinate one request.'
        : 'Confirm responsibilities and timing with the initiating bureau before proceeding.';
    const reasons = [
      'Same registered institution',
      ...(exactScope
        ? ['Equivalent normalized evidence scope']
        : ['Overlapping scope or summary terms']),
      ...(sameCategory ? ['Same recorded allegation category'] : []),
      'Existing action is active',
    ];
    findings.push({
      actionId: action.id,
      warning: {
        code,
        severity,
        message,
        reasons,
        recommendation,
        relatedActionId: visible ? action.id : null,
        relatedComplaintId: visible ? action.complaintId : null,
        relatedBureauCode: action.bureau.code,
        restricted: !visible,
      },
    });
  }
  return findings.sort(
    (a, b) =>
      ({ HIGH: 0, MEDIUM: 1, LOW: 2 })[a.warning.severity] -
        { HIGH: 0, MEDIUM: 1, LOW: 2 }[b.warning.severity] ||
      a.actionId.localeCompare(b.actionId),
  );
}
