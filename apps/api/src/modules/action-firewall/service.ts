import type { Principal } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
import { detectOverlaps, FIREWALL_RULE_VERSION } from './rules.js';
import {
  createActionSchema,
  previewSchema,
  type CreateAction,
  type ProposedAction,
} from './validation.js';
import { parseInput } from '../case-links/access.js';
import type { DetectedOverlap, FirewallRepository } from './types.js';
function previewResult(findings: DetectedOverlap[]) {
  return {
    warnings: findings.map((f) => f.warning),
    recommendation: findings.length
      ? 'Review warnings and coordinate; an authorized officer may proceed with a recorded reason.'
      : 'No overlap detected by current rules; officer review is still required.',
    recommendationOnly: true,
    requiresOverride: findings.length > 0,
    ruleVersion: FIREWALL_RULE_VERSION,
  };
}
export class FirewallService {
  constructor(private repository: FirewallRepository) {}
  async preview(principal: Principal, input: ProposedAction) {
    input = parseInput(previewSchema, input);
    const complaint = await this.repository.complaint(
      principal,
      input.complaintId,
    );
    return previewResult(
      detectOverlaps(
        principal,
        complaint,
        input,
        await this.repository.activeActions(complaint.institutionId),
      ),
    );
  }
  async create(principal: Principal, input: CreateAction) {
    input = parseInput(createActionSchema, input);
    const initial = await this.repository.complaint(
      principal,
      input.complaintId,
    );
    const result = await this.repository.transaction(
      initial.institutionId,
      async (tx) => {
        // Authorization and retrieval both run again AFTER the database lock.
        const complaint = await tx.complaint(principal, input.complaintId);
        if (complaint.institutionId !== initial.institutionId)
          throw new AppError(
            409,
            'CASE_CHANGED',
            'Institution changed; retry action submission',
          );
        const findings = detectOverlaps(
          principal,
          complaint,
          input,
          await tx.activeActions(complaint.institutionId),
        );
        const metadata = {
          ruleVersion: FIREWALL_RULE_VERSION,
          warningCodes: findings.map((f) => f.warning.code),
          internalOverlapActionIds: findings.map((f) => f.actionId),
          overrideReason: input.overrideReason ?? '',
        };
        if (findings.length && !input.overrideReason) {
          // Return instead of throwing INSIDE transaction so the denied-attempt audit commits.
          await tx.audit({
            actorId: principal.id,
            complaintId: complaint.id,
            event: 'ACTION_REVIEW_REQUIRED',
            metadata,
          });
          return { review: previewResult(findings) };
        }
        const action = await tx.create(principal, complaint, input);
        await tx.audit({
          actorId: principal.id,
          complaintId: complaint.id,
          event: findings.length ? 'ACTION_OVERRIDE_CREATED' : 'ACTION_CREATED',
          metadata: { ...metadata, actionId: action.id },
        });
        return { action };
      },
    );
    if ('review' in result)
      throw new AppError(
        409,
        'REVIEW_REQUIRED',
        'Review detected overlaps and supply an override reason to proceed',
        result.review,
      );
    return result.action;
  }
}
