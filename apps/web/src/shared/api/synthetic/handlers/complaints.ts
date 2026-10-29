import { DAY, DISPOSAL_DAYS, statusAt } from '../core';
import {
  actions,
  advance,
  audit,
  caseById,
  cases,
  institutionById,
  now,
  officers,
  timelineOf,
  toDetail,
  toListItem,
  type StoreCase,
} from '../store';
import {
  conflict,
  done,
  invalid,
  notFound,
  paginate,
  reasonField,
  text,
} from './util';
import type {
  Action,
  ComplaintArchive,
  ComplaintCreate,
  ComplaintDetail,
  ComplaintListItem,
  ComplaintListQuery,
  ComplaintStatus,
  ComplaintUpdate,
  ImportResult,
  PageQuery,
  TimelineEntry,
} from '../../../types';

const STATUSES: ComplaintStatus[] = [
  'RECEIVED',
  'UNDER_PROCESS',
  'TRANSFERRED',
  'ESCALATED',
  'DISPOSED',
];
// Demo actor for synthetic mutations: the signed-in demo account is not tracked here.
const ACTOR = 'demo-user-pgrc-head';

export function list(q: ComplaintListQuery = {}): {
  items: ComplaintListItem[];
  meta: ReturnType<typeof paginate>['meta'];
} {
  const errs: { path: string[]; message: string }[] = [];
  if (q.status && !STATUSES.includes(q.status))
    errs.push({ path: ['status'], message: 'Invalid status' });
  if (q.q !== undefined && q.q.length > 200)
    errs.push({ path: ['q'], message: 'Must be at most 200 characters' });
  if (errs.length) invalid(errs);
  const needle = q.q?.trim().toLowerCase();
  const sortBy = q.sortBy ?? 'createdAt';
  const dir = q.sortOrder === 'asc' ? 1 : -1;
  const rows = cases
    .filter((c) => (q.archived ? c.archivedAt !== null : c.archivedAt === null))
    .map(toListItem)
    .filter(
      (c) =>
        (!q.status || c.status === q.status) &&
        (!q.institutionId || c.institutionId === q.institutionId) &&
        (!q.category || c.category === q.category) &&
        (!q.assignedToId || c.assignedToId === q.assignedToId) &&
        (!q.bureauId || c.bureauId === q.bureauId) &&
        (!needle ||
          c.title.toLowerCase().includes(needle) ||
          c.originalId.toLowerCase().includes(needle) ||
          caseById(c.id)!.description.toLowerCase().includes(needle)),
    )
    .sort((a, b) => {
      const x = a[sortBy] ?? '';
      const y = b[sortBy] ?? '';
      return (x < y ? -1 : x > y ? 1 : 0) * dir || a.id.localeCompare(b.id);
    });
  return paginate(rows, q);
}

export function get(id: string): ComplaintDetail {
  const c = caseById(id);
  if (!c) notFound('Complaint');
  return toDetail(c);
}

function validateCreate(body: ComplaintCreate, i?: number) {
  const errs: { path: (string | number)[]; message: string }[] = [];
  const at = (f: string) => (i === undefined ? f : `items.${i}.${f}`);
  text(errs, at('originalId'), body.originalId, 100);
  text(errs, at('title'), body.title, 200);
  text(errs, at('description'), body.description, 10000);
  text(errs, at('category'), body.category, 64);
  text(errs, at('institutionId'), body.institutionId, 128);
  text(errs, at('bureauId'), body.bureauId, 128);
  done(errs);
  if (!institutionById(body.institutionId)) notFound('Institution');
  if (
    cases.some(
      (c) => c.bureau === body.bureauId && c.originalId === body.originalId,
    )
  )
    conflict(
      'DUPLICATE_REFERENCE',
      'Original reference already exists in this bureau',
    );
}

function insert(body: ComplaintCreate): StoreCase {
  const t = advance();
  const c: StoreCase = {
    id: `cmp-syn-${t}`,
    originalId: body.originalId.trim(),
    institutionId: body.institutionId,
    bureau: body.bureauId,
    sourceBureau: body.bureauId,
    createdAt: t,
    dueAt: body.dueAt ? Date.parse(body.dueAt) : t + DISPOSAL_DAYS * DAY,
    events: [],
    title: body.title.trim(),
    description: body.description.trim(),
    category: body.category.trim(),
    assignedToId: null,
    createdById: ACTOR,
    version: 0,
    updatedAt: t,
    archivedAt: null,
  };
  cases.push(c);
  return c;
}

export function create(body: ComplaintCreate): ComplaintDetail {
  validateCreate(body);
  return toDetail(insert(body));
}

export function importRows(items: ComplaintCreate[]): ImportResult {
  if (!Array.isArray(items) || items.length < 1 || items.length > 100)
    invalid([{ path: ['items'], message: 'Between 1 and 100 rows' }]);
  items.forEach((row, i) => validateCreate(row, i));
  // All or nothing: validated above before any insert.
  const createdIds = items.map((row) => insert(row).id);
  return { createdIds, count: createdIds.length };
}

export function importCsv(csv: string): ImportResult {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  const cols = header?.split(',').map((h) => h.trim()) ?? [];
  const needed = [
    'originalId',
    'institutionId',
    'bureauId',
    'title',
    'description',
    'category',
  ];
  if (!needed.every((n) => cols.includes(n)))
    invalid([
      { path: ['csv'], message: `Header must include ${needed.join(', ')}` },
    ]);
  // Simple CSV for the mock: quoted fields with commas are supported, escaped quotes too.
  const parse = (line: string) =>
    [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)]
      .slice(0, cols.length)
      .map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
  const rows = lines.filter(Boolean).map((line) => {
    const v = parse(line);
    const row = Object.fromEntries(
      cols.map((c, i) => [c, v[i] ?? '']),
    ) as Record<string, string>;
    return {
      ...row,
      dueAt: row.dueAt ? row.dueAt : null,
    } as unknown as ComplaintCreate;
  });
  return importRows(rows);
}

function checkVersion(c: StoreCase, expected: number) {
  if (c.version !== expected)
    conflict('STALE_COMPLAINT', 'Complaint changed since it was read');
}

export function update(id: string, body: ComplaintUpdate): ComplaintDetail {
  const c = caseById(id);
  if (!c) notFound('Complaint');
  const errs: { path: string[]; message: string }[] = [];
  if (!Number.isInteger(body.expectedVersion) || body.expectedVersion < 0)
    errs.push({ path: ['expectedVersion'], message: 'Required' });
  reasonField(errs, 'reason', body.reason);
  text(errs, 'title', body.title, 200, false);
  text(errs, 'description', body.description, 10000, false);
  text(errs, 'category', body.category, 64, false);
  if (body.status && !STATUSES.includes(body.status))
    errs.push({ path: ['status'], message: 'Invalid status' });
  const fields = [
    'title',
    'description',
    'category',
    'dueAt',
    'institutionId',
    'assignedToId',
    'status',
    'bureauId',
  ] as const;
  if (!fields.some((f) => body[f] !== undefined))
    errs.push({ path: ['body'], message: 'At least one change is required' });
  if (body.bureauId !== undefined && body.status !== undefined)
    errs.push({
      path: ['bureauId'],
      message: 'A transfer cannot change status at the same time',
    });
  done(errs);
  checkVersion(c, body.expectedVersion);
  if (body.institutionId && !institutionById(body.institutionId))
    notFound('Institution');
  if (body.assignedToId && !officers.some((o) => o.id === body.assignedToId))
    notFound('Officer');
  const current = statusAt(c, now());
  if (c.archivedAt)
    conflict('INVALID_STATE', 'Archived complaints cannot change');

  const t = advance();
  const reason = body.reason.trim();
  if (body.title !== undefined) c.title = body.title.trim();
  if (body.description !== undefined) c.description = body.description.trim();
  if (body.category !== undefined) c.category = body.category.trim();
  if (body.dueAt !== undefined)
    c.dueAt = body.dueAt
      ? Date.parse(body.dueAt)
      : c.createdAt + DISPOSAL_DAYS * DAY;
  if (
    body.institutionId !== undefined &&
    body.institutionId !== c.institutionId
  ) {
    audit(c.id, 'COMPLAINT_REASSIGNED_INSTITUTION', ACTOR, {
      fromInstitutionId: c.institutionId,
      toInstitutionId: body.institutionId,
      reason,
    });
    c.institutionId = body.institutionId;
  }
  if (body.assignedToId !== undefined && body.assignedToId !== c.assignedToId) {
    audit(c.id, 'COMPLAINT_ASSIGNED', ACTOR, {
      assignedToId: body.assignedToId,
      reason,
    });
    c.assignedToId = body.assignedToId;
  }
  if (body.bureauId !== undefined && body.bureauId !== c.bureau) {
    audit(c.id, 'COMPLAINT_TRANSFERRED', ACTOR, {
      fromBureauId: c.bureau,
      toBureauId: body.bureauId,
      reason,
    });
    c.bureau = body.bureauId;
    c.assignedToId = null;
    c.events.push({ status: 'TRANSFERRED', at: t });
  }
  // A status equal to the current one is accepted but is not a lifecycle event.
  if (body.status !== undefined && body.status !== current)
    c.events.push({ status: body.status, at: t });
  if (
    ['title', 'description', 'category', 'dueAt'].some(
      (f) => body[f as keyof ComplaintUpdate] !== undefined,
    )
  )
    audit(c.id, 'COMPLAINT_UPDATED', ACTOR, { reason });
  c.version += 1;
  c.updatedAt = t;
  return toDetail(c);
}

export function archive(id: string, body: ComplaintArchive): ComplaintDetail {
  const c = caseById(id);
  if (!c) notFound('Complaint');
  const errs: { path: string[]; message: string }[] = [];
  reasonField(errs, 'reason', body.reason);
  done(errs);
  checkVersion(c, body.expectedVersion);
  if (statusAt(c, now()) !== 'DISPOSED' || c.archivedAt)
    conflict('INVALID_STATE', 'Only disposed complaints can be archived');
  const t = advance();
  c.archivedAt = t;
  c.version += 1;
  c.updatedAt = t;
  audit(c.id, 'COMPLAINT_ARCHIVED', ACTOR, { reason: body.reason.trim() });
  return toDetail(c);
}

export function timeline(
  id: string,
  q: PageQuery = {},
): { items: TimelineEntry[]; meta: ReturnType<typeof paginate>['meta'] } {
  const c = caseById(id);
  if (!c) notFound('Complaint');
  return paginate(timelineOf(c), q);
}

export function actionsOf(
  id: string,
  q: PageQuery = {},
): { items: Action[]; meta: ReturnType<typeof paginate>['meta'] } {
  const c = caseById(id);
  if (!c) notFound('Complaint');
  const mine = actions
    .filter((a) => a.complaintId === id && a.bureauId === c.bureau)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return paginate(mine, q);
}
