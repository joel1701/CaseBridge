// Institutions and bureaus (reference directories and queues).
import { institutions, mockBureaus, regionOf } from '../core';
import { cases, officers, toListItem } from '../store';
import { list as listComplaints } from './complaints';
import { notFound, paginate } from './util';
import type {
  Bureau,
  ComplaintListQuery,
  ComplaintStatus,
  InstitutionProfile,
  InstitutionSummary,
  PageQuery,
} from '../../../types';

const summary = (id: string): InstitutionSummary => {
  const i = institutions.find((x) => x.id === id)!;
  return {
    id: i.id,
    permanentId: i.permanentId,
    name: i.name,
    state: i.state,
    region: regionOf(i.id),
  };
};

export function listInstitutions(q: PageQuery & { q?: string } = {}) {
  const needle = q.q?.trim().toLowerCase();
  const rows = institutions
    .map((i) => summary(i.id))
    .filter(
      (i) =>
        !needle ||
        i.name.toLowerCase().includes(needle) ||
        i.permanentId.toLowerCase().includes(needle),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return paginate(rows, q);
}

export function getInstitution(id: string): InstitutionProfile {
  if (!institutions.some((i) => i.id === id)) notFound('Institution');
  const mine = cases.filter((c) => c.institutionId === id).map(toListItem);
  const group = <K extends string>(key: (c: (typeof mine)[number]) => K) => {
    const counts = new Map<K, number>();
    for (const c of mine) counts.set(key(c), (counts.get(key(c)) ?? 0) + 1);
    return [...counts];
  };
  return {
    ...summary(id),
    location: `${regionOf(id)} regional office area`,
    authorizedComplaintCount: mine.length,
    byStatus: group((c) => c.status).map(([status, _count]) => ({
      status: status as ComplaintStatus,
      _count,
    })),
    byBureau: group((c) => c.bureauId).map(([bureauId, _count]) => ({
      bureauId,
      _count,
    })),
    recentComplaints: [...mine]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20),
  };
}

export function listBureaus(): {
  items: Bureau[];
  meta: { page: number; pageSize: number; total: number };
} {
  const items = [...mockBureaus]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((b) => ({ id: b.code, code: b.code, name: b.name }));
  return {
    items,
    meta: { page: 1, pageSize: items.length, total: items.length },
  };
}

export function listOfficers(bureauId: string, q: PageQuery = {}) {
  if (!mockBureaus.some((b) => b.code === bureauId)) notFound('Bureau');
  const rows = officers
    .filter((o) => o.bureauId === bureauId)
    .sort((a, b) => a.id.localeCompare(b.id));
  return paginate(rows, q);
}

export function bureauQueue(bureauId: string, q: ComplaintListQuery = {}) {
  if (!mockBureaus.some((b) => b.code === bureauId)) notFound('Bureau');
  return listComplaints({ ...q, bureauId });
}
