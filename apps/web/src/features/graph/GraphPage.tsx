import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { List, Network, TriangleAlert, X } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader } from '@/components/page';
import { BureauTag } from '@/components/ui/bureau-tag';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spec } from '@/components/ui/spec';
import { StatusPill } from '@/components/ui/status-pill';
import { complaintKeys, getComplaint } from '@/shared/api/complaints';
import { getInstitution, institutionKeys } from '@/shared/api/institutions';
import { getGraph, intelligenceKeys } from '@/shared/api/intelligence';
import { cn } from '@/shared/utils/cn';
import type { Graph, GraphNodeType } from '@/shared/types';
import { layoutGraph, NODE_SIZE, type Placed } from './layout';

type GNode = Node<{ label: string; overlap: boolean }, GraphNodeType>;

// One centred, invisible handle: edges run centre to centre, under the nodes.
const centre = {
  left: '50%',
  top: '50%',
  opacity: 0,
  pointerEvents: 'none' as const,
};
function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Top} style={centre} />
      <Handle type="source" position={Position.Top} style={centre} />
    </>
  );
}

function box(type: GraphNodeType) {
  return { width: NODE_SIZE[type].w, height: NODE_SIZE[type].h };
}

const nodeTypes = {
  institution: ({ data, selected }: NodeProps<GNode>) => (
    <div
      style={box('institution')}
      className={cn(
        'flex items-center justify-center bg-indigo-hi px-3 text-center text-[13px] leading-tight font-bold text-ink',
        selected && 'outline-2 outline-offset-2 outline-snow',
      )}
    >
      <Handles />
      <span className="line-clamp-2">{data.label}</span>
    </div>
  ),
  bureau: ({ data, selected }: NodeProps<GNode>) => (
    <div
      style={box('bureau')}
      className={cn(
        'flex items-center justify-center border border-indigo bg-graphite-1 text-sm font-bold text-indigo-hi',
        selected && 'outline-2 outline-offset-2 outline-snow',
      )}
    >
      <Handles />
      {data.label}
    </div>
  ),
  complaint: ({ data, selected }: NodeProps<GNode>) => (
    <div
      style={box('complaint')}
      className={cn(
        'flex items-center justify-center gap-1.5 border bg-graphite-1 px-2 font-mono text-[12px]',
        data.overlap ? 'border-alert text-alert' : 'border-line-2 text-snow',
        selected && 'outline-2 outline-offset-2 outline-snow',
      )}
    >
      <Handles />
      {data.overlap && <TriangleAlert size={12} aria-label="In an overlap" />}
      <span className="truncate">{data.label}</span>
    </div>
  ),
  action: ({ data, selected }: NodeProps<GNode>) => (
    <div
      style={box('action')}
      className={cn(
        'flex items-center justify-center border border-dashed border-line-2 bg-graphite px-2 text-[12px] text-subtle',
        selected && 'outline-2 outline-offset-2 outline-snow',
      )}
    >
      <Handles />
      <span className="truncate">{data.label}</span>
    </div>
  ),
};

const typeLabel: Record<GraphNodeType, string> = {
  institution: 'Institution',
  bureau: 'Bureau',
  complaint: 'Complaint',
  action: 'Action',
};

function Legend() {
  return (
    <ul
      aria-label="Legend"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-subtle"
    >
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3 bg-indigo-hi" />
        Institution
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3 border border-indigo" />
        Bureau
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-3 border border-line-2" />
        Complaint
      </li>
      <li className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-3 border border-dashed border-line-2"
        />
        Action
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-[3px] w-6 bg-alert" />
        Related cases (overlap)
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-px w-6 bg-line-2" />
        Belongs to
      </li>
    </ul>
  );
}

interface Model {
  placed: Placed[];
  overlapIds: Set<string>;
  /** action id -> complaint id */
  parent: Map<string, string>;
}

function buildModel(graph: Graph): Model {
  const overlapIds = new Set(
    graph.edges
      .filter((e) => e.type === 'RELATED_TO')
      .flatMap((e) => [e.source, e.target]),
  );
  const parent = new Map(
    graph.edges
      .filter((e) => e.type === 'HAS_ACTION')
      .map((e) => [e.target, e.source]),
  );
  return { placed: layoutGraph(graph), overlapIds, parent };
}

function DetailPanel({
  node,
  model,
  onClose,
}: {
  node: Placed;
  model: Model;
  onClose: () => void;
}) {
  const caseId =
    node.type === 'complaint'
      ? node.id
      : node.type === 'action'
        ? model.parent.get(node.id)
        : undefined;
  const complaint = useQuery({
    queryKey: complaintKeys.detail(caseId ?? ''),
    queryFn: () => getComplaint(caseId!),
    enabled: !!caseId,
  });
  const c = complaint.data?.data;
  const overlap = node.type === 'complaint' && model.overlapIds.has(node.id);

  return (
    <aside
      aria-label={`${typeLabel[node.type]} details`}
      className="grid content-start gap-4 border border-line bg-graphite-1 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="wide text-xs text-subtle">{typeLabel[node.type]}</p>
          <h2
            className={cn(
              'mt-1 text-[17px] leading-snug font-bold break-words',
              node.type === 'complaint' && 'font-mono text-[15px]',
            )}
          >
            {node.label}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex size-8 flex-none items-center justify-center text-subtle hover:text-snow"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {node.type === 'institution' && (
        <Button asChild size="sm" variant="ghost">
          <Link to={`/institutions/${node.id}`}>Open institution profile</Link>
        </Button>
      )}

      {node.type === 'bureau' && (
        <>
          <BureauTag code={node.label} className="justify-self-start" />
          <p className="text-sm text-subtle">
            {
              model.placed.filter(
                (p) => p.type === 'complaint' && p.bureau === node.label,
              ).length
            }{' '}
            cases from this bureau in the graph.
          </p>
          <Button asChild size="sm" variant="ghost">
            <Link to="/complaints">Open complaints</Link>
          </Button>
        </>
      )}

      {caseId &&
        (complaint.isPending ? (
          <Skeleton className="h-32" label="Loading case…" />
        ) : c ? (
          <>
            {overlap && (
              <p className="flex items-center gap-2 text-sm text-alert">
                <TriangleAlert size={16} aria-hidden="true" />
                In an overlap with another bureau
              </p>
            )}
            <Spec
              size="sm"
              className="grid-cols-1"
              items={[
                ...(node.type === 'action'
                  ? [
                      {
                        label: 'On case',
                        value: (
                          <span className="font-mono">{c.originalId}</span>
                        ),
                      },
                    ]
                  : []),
                { label: 'Title', value: c.title },
                { label: 'Bureau', value: <BureauTag code={c.bureauId} /> },
                { label: 'Status', value: <StatusPill status={c.status} /> },
                { label: 'Category', value: c.category },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link to={`/complaints/${c.id}`}>Open complaint</Link>
              </Button>
              {overlap && (
                <Button asChild size="sm">
                  <Link to={`/investigations/${c.id}`}>Open investigation</Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-subtle">
            This case isn&apos;t in your scope.
          </p>
        ))}
    </aside>
  );
}

function GraphList({
  model,
  onSelect,
}: {
  model: Model;
  onSelect: (id: string) => void;
}) {
  const bureaus = model.placed.filter((p) => p.type === 'bureau');
  return (
    <div className="grid gap-4">
      {bureaus.map((b) => {
        const cases = model.placed.filter(
          (p) => p.type === 'complaint' && p.bureau === b.label,
        );
        return (
          <section
            key={b.id}
            aria-label={`${b.label} cases`}
            className="border border-line bg-graphite-1 p-4"
          >
            <div className="flex items-center gap-3">
              <BureauTag code={b.label} />
              <span className="text-sm text-subtle">
                {cases.length} {cases.length === 1 ? 'case' : 'cases'}
              </span>
            </div>
            <ul className="mt-3 grid gap-1">
              {cases.map((c) => {
                const acts = model.placed.filter(
                  (p) => p.type === 'action' && model.parent.get(p.id) === c.id,
                );
                const overlap = model.overlapIds.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-2 py-2 text-left text-sm hover:bg-panel"
                    >
                      <span
                        className={cn('font-mono', overlap && 'text-alert')}
                      >
                        {c.label}
                      </span>
                      {overlap && (
                        <span className="flex items-center gap-1 text-xs text-alert">
                          <TriangleAlert size={12} aria-hidden="true" />
                          Overlap
                        </span>
                      )}
                      {acts.length > 0 && (
                        <span className="text-xs text-subtle">
                          {acts.map((a) => a.label).join(', ')}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

const isPhone = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 767px)').matches;

export function GraphPage() {
  const { institutionId = '' } = useParams();
  const [view, setView] = useState<'graph' | 'list'>(() =>
    isPhone() ? 'list' : 'graph',
  );
  const [selected, setSelected] = useState<string | null>(null);

  const graph = useQuery({
    queryKey: intelligenceKeys.graph(institutionId),
    queryFn: () => getGraph(institutionId),
  });
  const institution = useQuery({
    queryKey: institutionKeys.detail(institutionId),
    queryFn: () => getInstitution(institutionId),
  });

  const model = useMemo(
    () => (graph.data ? buildModel(graph.data.data) : null),
    [graph.data],
  );
  const { nodes, edges } = useMemo(() => {
    if (!model || !graph.data) return { nodes: [], edges: [] };
    const nodes: GNode[] = model.placed.map((p) => ({
      id: p.id,
      type: p.type,
      position: { x: p.x, y: p.y },
      data: { label: p.label, overlap: model.overlapIds.has(p.id) },
      width: NODE_SIZE[p.type].w,
      height: NODE_SIZE[p.type].h,
      selected: p.id === selected,
      ariaLabel: `${typeLabel[p.type]} ${p.label}`,
    }));
    // Drawn as institution - bureau - complaint - action: a complaint's own HAS_COMPLAINT
    // line would cross its bureau, so the institution joins each bureau instead.
    const { nodes: gNodes, edges: gEdges } = graph.data.data;
    const owned = new Set(
      gEdges.filter((e) => e.type === 'OWNED_BY').map((e) => e.source),
    );
    const root = gNodes.find((n) => n.type === 'institution');
    const shown = [
      ...(root
        ? gNodes
            .filter((n) => n.type === 'bureau')
            .map((b) => ({
              id: `e-inst-${b.id}`,
              source: root.id,
              target: b.id,
              type: 'OWNED_BY',
            }))
        : []),
      ...gEdges.filter(
        (e) => !(e.type === 'HAS_COMPLAINT' && owned.has(e.target)),
      ),
    ];
    const edges: Edge[] = shown.map((e) => {
      const related = e.type === 'RELATED_TO';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: related ? 'default' : 'straight',
        zIndex: related ? 1 : 0,
        focusable: false,
        style: related
          ? { stroke: 'var(--alert)', strokeWidth: 3 }
          : { stroke: 'var(--line-2)', strokeWidth: 1 },
      };
    });
    return { nodes, edges };
  }, [model, graph.data, selected]);

  const selectedNode = model?.placed.find((p) => p.id === selected);
  const name = institution.data?.data.name;

  if (graph.isPending)
    return (
      <div className="grid gap-6" aria-busy="true">
        <Skeleton className="h-14 w-80" label="Loading knowledge graph…" />
        <Skeleton className="h-[560px]" />
      </div>
    );
  if (graph.error)
    return (
      <ErrorState error={graph.error} onRetry={() => void graph.refetch()} />
    );

  const toggle = (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={view === 'list'}
      onClick={() => setView(view === 'list' ? 'graph' : 'list')}
    >
      {view === 'list' ? (
        <Network size={16} aria-hidden="true" />
      ) : (
        <List size={16} aria-hidden="true" />
      )}
      {view === 'list' ? 'View as graph' : 'View as list'}
    </Button>
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="knowledge graph"
        scope={graph.data.scope}
        description={
          name && (
            <>
              <Link
                to={`/institutions/${institutionId}`}
                className="text-snow hover:underline"
              >
                {name}
              </Link>
              : its bureaus, their cases and the actions on them
            </>
          )
        }
        actions={toggle}
      />
      {model && model.placed.length <= 1 ? (
        <EmptyState
          title="Nothing to map yet"
          body="This institution has no recent or linked cases in your scope."
        />
      ) : (
        model && (
          <>
            <Legend />
            <div
              className={cn(
                'grid items-start gap-4',
                selectedNode && 'lg:grid-cols-[minmax(0,1fr)_300px]',
              )}
            >
              {view === 'graph' ? (
                <div className="h-[clamp(460px,75vh,760px)] border border-line bg-graphite">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    colorMode="dark"
                    fitView
                    minZoom={0.2}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    onNodeClick={(_e, n) => setSelected(n.id)}
                    onPaneClick={() => setSelected(null)}
                  >
                    <Background gap={24} color="var(--line)" />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                </div>
              ) : (
                <GraphList model={model} onSelect={setSelected} />
              )}
              {selectedNode && (
                <DetailPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  model={model}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
