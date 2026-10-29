// The one synthetic data source for every page and the dashboard: ~600 synthetic
// cases, 8 synthetic institutions, PGRC/RB plus the synthetic AB/AC bureaus.
// This file holds the deterministic base generator (unchanged from the dashboard's),
// so the same cases come out on every load.
import { complaints, institutions } from '../mock';
import type { BureauCode, ComplaintStatus, Region } from '../../types';

export { institutions };
export const MOCK_TODAY = '2026-10-29T12:00:00Z';
export const DAY = 86_400_000;
export const DISPOSAL_DAYS = 30;
export const APPROACHING_HOURS = 48; // DEADLINE_ALERT_HOURS default on the API

export const mockBureaus: { code: BureauCode; name: string }[] = [
  { code: 'PGRC', name: 'Public Grievance Redressal Cell' },
  { code: 'RB', name: 'Regulation Bureau' },
  { code: 'AB', name: 'Approval Bureau (synthetic)' },
  { code: 'AC', name: 'Academic Cell (synthetic)' },
];

// AICTE regional office for each state used by the synthetic institutions.
const regionalOffice: Record<string, Region> = {
  Karnataka: 'Bengaluru',
  Telangana: 'Hyderabad',
  'Tamil Nadu': 'Chennai',
  Kerala: 'Thiruvananthapuram',
  'Madhya Pradesh': 'Bhopal',
  Gujarat: 'Vadodara',
  'West Bengal': 'Kolkata',
  Punjab: 'Chandigarh',
};
export const regionOf = (institutionId: string): Region => {
  const inst = institutions.find((i) => i.id === institutionId);
  return (inst && regionalOffice[inst.state]) ?? 'Unassigned';
};

export interface BaseCase {
  id: string;
  originalId: string;
  institutionId: string;
  bureau: BureauCode;
  createdAt: number;
  dueAt: number;
  /** Status changes after RECEIVED, in time order. */
  events: { status: ComplaintStatus; at: number }[];
}

// Small seeded PRNG (mulberry32) so the data is the same on every load.
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T>(r: () => number, items: [T, number][]): T => {
  let x = r() * items.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of items) if ((x -= w) < 0) return v;
  return items[items.length - 1][0];
};

export function generateCases(): BaseCase[] {
  const r = rng(26264);
  const today = Date.parse(MOCK_TODAY);
  // Monthly intake, Nov 2025 to Oct 2026, peaking with July admissions.
  const months: [number, number][] = [
    [2025 * 12 + 10, 36],
    [2025 * 12 + 11, 31],
    [2026 * 12, 32],
    [2026 * 12 + 1, 38],
    [2026 * 12 + 2, 47],
    [2026 * 12 + 3, 44],
    [2026 * 12 + 4, 55],
    [2026 * 12 + 5, 66],
    [2026 * 12 + 6, 84],
    [2026 * 12 + 7, 74],
    [2026 * 12 + 8, 58],
    [2026 * 12 + 9, 35],
  ];
  const bureauWeights: [BureauCode, number][] = [
    ['PGRC', 40],
    ['RB', 30],
    ['AB', 18],
    ['AC', 12],
  ];
  const instWeights: [string, number][] = institutions.map((i, n) => [
    i.id,
    n === 0 ? 2 : 1,
  ]);
  const seq: Record<string, number> = {};
  const out: BaseCase[] = [];
  for (const [ym, count] of months) {
    const start = Date.UTC(Math.floor(ym / 12), ym % 12, 1);
    const end = Math.min(
      Date.UTC(Math.floor((ym + 1) / 12), (ym + 1) % 12, 1),
      today - DAY,
    );
    for (let k = 0; k < count; k++) {
      const bureau = pick(r, bureauWeights);
      const createdAt = start + Math.floor(r() * (end - start));
      const year = new Date(createdAt).getUTCFullYear();
      const key = `${bureau}-${year}`;
      seq[key] = (seq[key] ?? 100) + 1 + Math.floor(r() * 3);
      const events: BaseCase['events'] = [];
      let t = createdAt;
      if (r() < 0.07)
        events.push({ status: 'TRANSFERRED', at: (t += (2 + r() * 6) * DAY) });
      if (r() < 0.9)
        events.push({
          status: 'UNDER_PROCESS',
          at: (t += (1 + r() * 4) * DAY),
        });
      if (r() < 0.1)
        events.push({ status: 'ESCALATED', at: (t += (8 + r() * 20) * DAY) });
      // Most cases close inside the 30-day timeline; a tail runs late.
      const disposeAfter = r() < 0.55 ? 10 + r() * 19 : 31 + r() * 90;
      const disposedAt = Math.max(t + DAY, createdAt + disposeAfter * DAY);
      if (disposedAt < today)
        events.push({ status: 'DISPOSED', at: disposedAt });
      out.push({
        id: `syn-${String(out.length + 1).padStart(4, '0')}`,
        originalId: `${bureau}-${year}-${String(seq[key]).padStart(4, '0')}`,
        institutionId: pick(r, instWeights),
        bureau,
        createdAt,
        dueAt: createdAt + DISPOSAL_DAYS * DAY,
        events: events.filter((e) => e.at < today),
      });
    }
  }
  // The two synthetic complaints the rest of the app already uses (mock.ts), still open.
  for (const c of complaints) {
    const createdAt = Date.parse(c.createdAt);
    out.push({
      id: c.id,
      originalId: c.originalId,
      institutionId: c.institutionId,
      bureau: c.bureauId,
      createdAt,
      dueAt: createdAt + DISPOSAL_DAYS * DAY,
      events:
        c.status === 'UNDER_PROCESS'
          ? [{ status: 'UNDER_PROCESS', at: createdAt + DAY }]
          : [],
    });
  }
  return out;
}

export function statusAt(c: BaseCase, t: number): ComplaintStatus | null {
  if (c.createdAt > t) return null;
  let s: ComplaintStatus = 'RECEIVED';
  for (const e of c.events) if (e.at <= t) s = e.status;
  return s;
}
export const isOpenAt = (c: BaseCase, t: number) => {
  const s = statusAt(c, t);
  return s !== null && s !== 'DISPOSED';
};
export const lastEventAt = (c: BaseCase) => c.events.at(-1)?.at ?? c.createdAt;
export const iso = (t: number) => new Date(t).toISOString();
