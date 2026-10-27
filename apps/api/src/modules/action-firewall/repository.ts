import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Principal } from '../../middleware/auth.js';
import { authorizedComplaint, type Database } from '../case-links/access.js';
import { withInstitutionLock } from '../case-links/transaction.js';
import { AppError } from '../../lib/errors.js';
import type {
  AuditEntry,
  FirewallComplaint,
  FirewallRepository,
  FirewallTransaction,
} from './types.js';
import type { CreateAction } from './validation.js';
class PrismaFirewallTransaction implements FirewallTransaction {
  constructor(
    protected db: Database,
    private lockComplaint = false,
  ) {}
  async complaint(principal: Principal, id: string) {
    if (this.lockComplaint)
      await this.db
        .$queryRaw`SELECT id FROM "Complaint" WHERE id = ${id} FOR SHARE`;
    return authorizedComplaint(this.db, principal, id);
  }
  async activeActions(institutionId: string) {
    const actions = await this.db.investigationAction.findMany({
      where: {
        complaint: { institutionId },
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
      include: {
        complaint: { select: { institutionId: true, category: true } },
        bureau: { select: { code: true } },
      },
      orderBy: { id: 'asc' },
      take: 2001,
    });
    if (actions.length > 2000)
      throw new AppError(
        503,
        'DEPENDENCY_UNAVAILABLE',
        'Institution action volume exceeds the safe review limit',
      );
    return actions;
  }
  async create(
    principal: Principal,
    complaint: FirewallComplaint,
    input: CreateAction,
  ) {
    return this.db.investigationAction.create({
      data: {
        complaintId: complaint.id,
        bureauId: complaint.bureauId,
        createdById: principal.id,
        type: input.type,
        summary: input.summary,
        evidenceScope: input.evidenceScope,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        overrideReason: input.overrideReason,
      },
      select: {
        id: true,
        complaintId: true,
        bureauId: true,
        createdById: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });
  }
  async audit(entry: AuditEntry) {
    await this.db.auditLog.create({ data: entry });
  }
}
export class PrismaFirewallRepository
  extends PrismaFirewallTransaction
  implements FirewallRepository
{
  constructor(private client: PrismaClient) {
    super(client);
  }
  transaction<T>(
    institutionId: string,
    work: (tx: FirewallTransaction) => Promise<T>,
  ) {
    return withInstitutionLock(this.client, institutionId, (tx) =>
      work(new PrismaFirewallTransaction(tx, true)),
    );
  }
}
