import type { PrismaClient } from '../../generated/prisma/client.js';
import { bureauScope, type Principal } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
export interface GraphNode {
  id: string;
  type: 'institution' | 'complaint' | 'bureau' | 'action';
  label: string;
  metadata: Record<string, unknown>;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'HAS_COMPLAINT' | 'OWNED_BY' | 'HAS_ACTION' | 'RELATED_TO';
  metadata: Record<string, unknown>;
}
export const nodeId = (type: GraphNode['type'], id: string) =>
  `${type}:${encodeURIComponent(id)}`;
export function edge(
  type: GraphEdge['type'],
  source: string,
  target: string,
  metadata: Record<string, unknown> = {},
): GraphEdge {
  return {
    id: `edge:${encodeURIComponent(JSON.stringify([type, source, target]))}`,
    source,
    target,
    type,
    metadata,
  };
}
export class GraphService {
  constructor(private db: PrismaClient) {}
  async get(principal: Principal, institutionId: string) {
    return this.db.$transaction(
      async (tx) => {
        const scope = bureauScope(principal);
        const institution = await tx.institution.findFirst({
          where: {
            id: institutionId,
            ...(principal.role === 'ADMIN'
              ? {}
              : { complaints: { some: scope } }),
          },
        });
        if (!institution)
          throw new AppError(404, 'NOT_FOUND', 'Institution not found');
        const complaints = await tx.complaint.findMany({
          where: { institutionId, ...scope },
          include: { bureau: { select: { id: true, code: true, name: true } } },
          orderBy: { id: 'asc' },
          take: 501,
        });
        if (complaints.length > 500)
          throw new AppError(
            413,
            'GRAPH_TOO_LARGE',
            'Graph exceeds 500 authorized complaints',
          );
        const ids = complaints.map((c) => c.id);
        const [actions, links] = await Promise.all([
          tx.investigationAction.findMany({
            where: { complaintId: { in: ids }, ...scope },
            orderBy: { id: 'asc' },
            take: 1001,
          }),
          tx.caseLink.findMany({
            where: {
              sourceComplaintId: { in: ids },
              targetComplaintId: { in: ids },
              status: { in: ['SUGGESTED', 'CONFIRMED'] },
            },
            orderBy: { id: 'asc' },
            take: 2001,
          }),
        ]);
        if (actions.length > 1000 || links.length > 2000)
          throw new AppError(
            413,
            'GRAPH_TOO_LARGE',
            'Graph exceeds authorized action or relationship limit',
          );
        const institutionNodeId = nodeId('institution', institution.id);
        const nodes: GraphNode[] = [
          {
            id: institutionNodeId,
            type: 'institution',
            label: institution.name,
            metadata: {
              recordId: institution.id,
              permanentId: institution.permanentId,
              state: institution.state,
            },
          },
        ];
        const edges: GraphEdge[] = [];
        const bureaus = new Set<string>();
        for (const complaint of complaints) {
          const cid = nodeId('complaint', complaint.id),
            bid = nodeId('bureau', complaint.bureauId);
          nodes.push({
            id: cid,
            type: 'complaint',
            label: complaint.originalId,
            metadata: {
              recordId: complaint.id,
              status: complaint.status,
              overlapReviewStatus: complaint.overlapReviewStatus,
              category: complaint.category,
              bureauId: complaint.bureauId,
            },
          });
          if (!bureaus.has(bid)) {
            nodes.push({
              id: bid,
              type: 'bureau',
              label: complaint.bureau.code,
              metadata: {
                recordId: complaint.bureauId,
                name: complaint.bureau.name,
              },
            });
            bureaus.add(bid);
          }
          edges.push(
            edge('HAS_COMPLAINT', institutionNodeId, cid),
            edge('OWNED_BY', cid, bid),
          );
        }
        for (const action of actions) {
          const aid = nodeId('action', action.id);
          nodes.push({
            id: aid,
            type: 'action',
            label: action.type.replaceAll('_', ' '),
            metadata: {
              recordId: action.id,
              status: action.status,
              bureauId: action.bureauId,
              dueAt: action.dueAt,
            },
          });
          edges.push(
            edge('HAS_ACTION', nodeId('complaint', action.complaintId), aid),
          );
        }
        for (const link of links)
          edges.push({
            ...edge(
              'RELATED_TO',
              nodeId('complaint', link.sourceComplaintId),
              nodeId('complaint', link.targetComplaintId),
              {
                recordId: link.id,
                status: link.status,
                score: link.score,
                recommendationOnly: link.status === 'SUGGESTED',
              },
            ),
            id: `link:${encodeURIComponent(link.id)}`,
          });
        return { nodes, edges };
      },
      { isolationLevel: 'RepeatableRead', timeout: 10000 },
    );
  }
}
