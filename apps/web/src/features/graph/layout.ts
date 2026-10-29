import type { Graph, GraphNodeType } from '@/shared/types';

// Deterministic layout: institution in the centre, bureaus on either side of it (balanced
// by case count), each bureau's complaints in a column beyond it and their actions beyond
// those. Every node gets its own row and column slot, so nodes never overlap.

export const NODE_SIZE: Record<GraphNodeType, { w: number; h: number }> = {
  institution: { w: 220, h: 64 },
  bureau: { w: 88, h: 40 },
  complaint: { w: 148, h: 36 },
  action: { w: 136, h: 32 },
};

const ROW = 52;
const BLOCK_GAP = 28;
const COL_GAP = 72;

export interface Placed {
  id: string;
  type: GraphNodeType;
  label: string;
  /** Top-left corner, as React Flow positions nodes. */
  x: number;
  y: number;
  /** The bureau this node sits under (bureaus, complaints and actions). */
  bureau?: string;
}

/** Places a node by its centre. */
const at = (type: GraphNodeType, cx: number, cy: number) => ({
  x: cx - NODE_SIZE[type].w / 2,
  y: cy - NODE_SIZE[type].h / 2,
});

export function layoutGraph(graph: Graph): Placed[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const institution = graph.nodes.find((n) => n.type === 'institution');
  const owner = new Map(
    graph.edges
      .filter((e) => e.type === 'OWNED_BY')
      .map((e) => [e.source, e.target]),
  );
  const actionsOf = new Map<string, string[]>();
  for (const e of graph.edges.filter((e) => e.type === 'HAS_ACTION'))
    actionsOf.set(e.source, [...(actionsOf.get(e.source) ?? []), e.target]);

  const groups = graph.nodes
    .filter((n) => n.type === 'bureau')
    .map((b) => ({
      bureau: b,
      cases: graph.nodes.filter(
        (n) => n.type === 'complaint' && owner.get(n.id) === b.id,
      ),
    }));

  // Balance the two sides by case count; the first bureau starts on the left.
  const sides: { groups: typeof groups; rows: number }[] = [
    { groups: [], rows: 0 },
    { groups: [], rows: 0 },
  ];
  for (const g of groups) {
    const side = sides[0].rows <= sides[1].rows ? sides[0] : sides[1];
    side.groups.push(g);
    side.rows += Math.max(1, g.cases.length);
  }

  const out: Placed[] = [];
  if (institution) out.push({ ...institution, ...at('institution', 0, 0) });

  const bureauX =
    NODE_SIZE.institution.w / 2 + COL_GAP + NODE_SIZE.bureau.w / 2;
  const caseX =
    bureauX + NODE_SIZE.bureau.w / 2 + COL_GAP + NODE_SIZE.complaint.w / 2;
  const actionX =
    caseX + NODE_SIZE.complaint.w / 2 + COL_GAP + NODE_SIZE.action.w / 2;
  const actionStep = NODE_SIZE.action.w + 24;

  sides.forEach((side, s) => {
    const dir = s === 0 ? -1 : 1;
    const height =
      side.rows * ROW + Math.max(0, side.groups.length - 1) * BLOCK_GAP;
    let top = -height / 2;
    for (const { bureau, cases } of side.groups) {
      const rows = Math.max(1, cases.length);
      out.push({
        ...bureau,
        ...at('bureau', dir * bureauX, top + (rows * ROW) / 2),
        bureau: bureau.label,
      });
      cases.forEach((c, k) => {
        const cy = top + k * ROW + ROW / 2;
        out.push({
          ...c,
          ...at('complaint', dir * caseX, cy),
          bureau: bureau.label,
        });
        (actionsOf.get(c.id) ?? []).forEach((aid, j) => {
          const a = byId.get(aid);
          if (a)
            out.push({
              ...a,
              ...at('action', dir * (actionX + j * actionStep), cy),
              bureau: bureau.label,
            });
        });
      });
      top += rows * ROW + BLOCK_GAP;
    }
  });
  return out;
}
