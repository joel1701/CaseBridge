// Landing page copy, from docs/design/setu-landing.html. All data shown is synthetic.

export interface SpecPair {
  label: string;
  value: string;
}

export const navLinks = [
  { href: '#views', label: 'Views' },
  { href: '#engines', label: 'Engines' },
  { href: '#route', label: 'A case' },
  { href: '#roles', label: 'Roles' },
  { href: '#faq', label: 'Questions' },
];

export const hero = {
  srTitle: 'Setu: one view of every complaint case across AICTE bureaus',
  word: 'one view of every case.',
  side: 'Every light crossing this bridge is a complaint moving between bureaus. When two desks reach the same institution, Setu turns it red.',
  keyTransit: 'Case in transit',
  keyOverlap: 'Overlap, coordinate first',
  pylons: ['PGRC', 'RB'] as const,
  redCall: { label: 'overlap', detail: 'RB + PGRC · Aaravika Institute' },
};

export const manifesto = {
  before:
    'Today a college can get two notices from two desks about one complaint. ',
  strong: 'Setu puts every case about an institution on one record',
  after: ', so bureaus coordinate before they act.',
  footLines: ['Smart India Hackathon', 'Problem statement 26264'],
  spec: [
    { label: 'The gap', value: 'No shared, real-time view across bureaus' },
    { label: 'The risk', value: 'Duplicate work and conflicting action' },
    { label: 'The fix', value: 'One record per institution, overlap alerts' },
  ] satisfies SpecPair[],
};

export const desks = {
  steps: [
    {
      title: 'two desks. one institution.',
      text: 'PGRC and RB each open a case on the same college, under different names.',
    },
    {
      title: 'setu connects them.',
      text: 'It matches the permanent ID, the name and the timing.',
    },
    {
      title: 'coordinate first.',
      text: 'Both bureaus are alerted, link the cases and agree who leads.',
    },
  ],
  cases: [
    {
      side: 'l' as const,
      bureau: 'PGRC',
      name: 'aaravika institute of engineering',
      ref: 'PGRC-2026-0412',
      category: 'Fees',
      permanentId: 'AICTE 1-900000001',
    },
    {
      side: 'r' as const,
      bureau: 'RB',
      name: 'aaravika inst. of engg.',
      ref: 'RB-2026-0198',
      category: 'Fees',
      permanentId: 'AICTE 1-900000001',
    },
  ],
  reasons: [
    'Same AICTE permanent ID',
    'Name variant of the same college',
    'Same category, one day apart',
  ],
  alert: {
    title: 'potential overlapping cases',
    text: 'Coordination required between PGRC and RB',
    actions: ['Link cases', 'Review'],
  },
};

export type VignetteData =
  | {
      kind: 'institution';
      name: string;
      permanentId: string;
      meta: string;
      stats: { value: number; label: string }[];
    }
  | {
      kind: 'caseTrack';
      title: string;
      meta: string;
      events: { text: string; date: string; now?: boolean }[];
    }
  | {
      kind: 'overlap';
      title: string;
      pair: { bureau: string; name: string }[];
      flag: string;
    }
  | {
      kind: 'reports';
      title: string;
      rows: { label: string; width: number; value: string }[];
    };

export interface View {
  spec: SpecPair[];
  title: string;
  text: string;
  link: { href: string; label: string };
  figure: VignetteData;
}

export const views = {
  title: 'four views, one source of truth',
  lead: 'Each view answers the question an official asks first, and every one of them is built on the same institution record.',
  items: [
    {
      spec: [
        { label: 'Shows', value: 'Every case, every bureau' },
        { label: 'Keyed by', value: 'AICTE permanent ID' },
        { label: 'Used by', value: 'All officials' },
      ],
      title: 'institution',
      text: 'Name, address, region and the full history of complaints about one institution, gathered from every bureau that has ever touched it.',
      link: { href: '#route', label: 'Follow a case' },
      figure: {
        kind: 'institution',
        name: 'aaravika institute of engineering',
        permanentId: 'AICTE 1-900000001',
        meta: 'Southern region · Karnataka',
        stats: [
          { value: 4, label: 'cases' },
          { value: 2, label: 'bureaus' },
          { value: 1, label: 'overlap' },
        ],
      },
    },
    {
      spec: [
        { label: 'Shows', value: 'Status and movement' },
        { label: 'Records', value: 'Officer, remarks, documents' },
        { label: 'Updates', value: 'On every action' },
      ],
      title: 'case track',
      text: 'Date received, category, current status, assigned officer, last action and the next one due, with every transfer and escalation on a timeline.',
      link: { href: '#route', label: 'See the timeline' },
      figure: {
        kind: 'caseTrack',
        title: 'pgrc-2026-0412',
        meta: 'Unapproved admission fees',
        events: [
          { text: 'Received at PGRC', date: '1 Oct' },
          { text: 'Assigned to S. Rao', date: '1 Oct' },
          { text: 'Notice to institution', date: '4 Oct' },
          { text: 'Linked with RB case', date: '6 Oct', now: true },
        ],
      },
    },
    {
      spec: [
        { label: 'Matches on', value: 'ID, name variants, address' },
        { label: 'Method', value: 'Rules plus AI' },
        { label: 'Decides', value: 'Officers, never the model' },
      ],
      title: 'overlap',
      text: 'When RB and PGRC are both working on the same institution, Setu says so, shows why it thinks so, and lets the bureaus link the cases.',
      link: { href: '#engines', label: 'How matching works' },
      figure: {
        kind: 'overlap',
        title: 'potential overlapping cases',
        pair: [
          { bureau: 'PGRC', name: 'Aaravika Institute of Engineering' },
          { bureau: 'RB', name: 'Aaravika Inst. of Engg.' },
        ],
        flag: 'Coordination required',
      },
    },
    {
      spec: [
        { label: 'Cuts by', value: 'Bureau, region, status' },
        { label: 'Tracks', value: 'Ageing and disposal rate' },
        { label: 'Periods', value: 'Monthly, quarterly' },
      ],
      title: 'reports',
      text: 'Institution-wise, region-wise and bureau-wise reports, with pending-case ageing ready for the review meeting.',
      link: { href: '#chart', label: 'See a chart' },
      figure: {
        kind: 'reports',
        title: 'pending by region',
        rows: [
          { label: 'Southern', width: 82, value: '64' },
          { label: 'Western', width: 66, value: '51' },
          { label: 'Northern', width: 58, value: '45' },
          { label: 'Eastern', width: 40, value: '31' },
        ],
      },
    },
  ] satisfies View[],
};

export interface RouteStop {
  day: string;
  fig: string;
  title: string;
  text: string;
  low?: boolean;
  hit?: boolean;
}

export const route = {
  title: 'twelve days in the life of a case',
  lead: 'One complaint, two bureaus, and the moment Setu noticed. Each day lights up as the case reaches it.',
  reached: 'Reached',
  stops: [
    {
      day: 'Day 1',
      fig: 'pgrc',
      title: 'complaint arrives',
      text: 'Students report unapproved admission fees. PGRC registers the case and assigns an officer.',
    },
    {
      day: 'Day 2',
      fig: 'rb',
      title: 'a second desk',
      text: 'RB opens its own case on the same college, filed under a shorter version of its name.',
      low: true,
    },
    {
      day: 'Day 2, minutes later',
      fig: 'overlap',
      title: 'setu notices',
      text: 'Matcher links the two by permanent ID and category, and alerts both bureaus.',
      hit: true,
    },
    {
      day: 'Day 3',
      fig: 'linked',
      title: 'one lead bureau',
      text: 'The cases are linked. RB takes the lead, and PGRC follows on the same record.',
      low: true,
    },
    {
      day: 'Day 8',
      fig: 'notice',
      title: 'one notice, not two',
      text: 'The institution gets a single notice that covers both complaints.',
    },
    {
      day: 'Day 12',
      fig: 'disposed',
      title: 'closed together',
      text: "Both cases are disposed with the same outcome, and the history stays on the institution's record.",
      low: true,
    },
  ] satisfies RouteStop[],
};

export type EngineFigure =
  | { kind: 'match'; caseRef: string; pair: { label: string; value: string }[] }
  | {
      kind: 'timeline';
      events: { text: string; time: string; now?: boolean }[];
    }
  | { kind: 'countdown'; big: string; note: string }
  | { kind: 'bars'; rows: { label: string; width: number; value: string }[] };

export interface Engine {
  name: string;
  subtitle: string;
  figure: EngineFigure;
  spec: SpecPair[];
}

export const engines = {
  title: 'four engines behind one screen',
  lead: 'Officials see one dashboard. Underneath, four parts of Setu split the work and pass it between them.',
  items: [
    {
      name: 'matcher',
      subtitle: 'Overlap detection',
      figure: {
        kind: 'match',
        caseRef: 'New case RB-2026-0198',
        pair: [
          { label: 'Permanent ID', value: 'Exact match' },
          { label: 'Name', value: '91% similar' },
        ],
      },
      spec: [
        { label: 'Compares', value: 'Every new case against open ones' },
        { label: 'Explains', value: 'Why it matched' },
      ],
    },
    {
      name: 'tracker',
      subtitle: 'Workflow and history',
      figure: {
        kind: 'timeline',
        events: [
          { text: 'Transferred to RB', time: '09:40' },
          { text: 'Escalated to bureau head', time: '11:05', now: true },
        ],
      },
      spec: [
        { label: 'Logs', value: 'Every action with a timestamp' },
        { label: 'Shows', value: 'Who holds the case now' },
      ],
    },
    {
      name: 'watcher',
      subtitle: 'Alerts and timelines',
      figure: {
        kind: 'countdown',
        big: '6 days',
        note: 'left of a 30-day disposal timeline',
      },
      spec: [
        { label: 'Warns', value: 'Before a case goes overdue' },
        { label: 'Escalates', value: 'When it does' },
      ],
    },
    {
      name: 'reporter',
      subtitle: 'Reports and analytics',
      figure: {
        kind: 'bars',
        rows: [
          { label: 'Disposal', width: 72, value: '72%' },
          { label: 'Overlaps', width: 18, value: '18' },
        ],
      },
      spec: [
        { label: 'Builds', value: 'Bureau, region, institution reports' },
        { label: 'Measures', value: 'Ageing and disposal rate' },
      ],
    },
  ] satisfies Engine[],
};

export const chart = {
  title: 'caught before the second notice',
  lead: 'Overlapping cases flagged each month in the pilot data, before either bureau had acted twice.',
  label: 'Overlaps flagged per month, synthetic',
  caption: 'Synthetic data. July peaks with the admissions season.',
  bars: [
    { month: 'Jan', value: 6 },
    { month: 'Feb', value: 9 },
    { month: 'Mar', value: 14 },
    { month: 'Apr', value: 12 },
    { month: 'May', value: 18 },
    { month: 'Jun', value: 21 },
    { month: 'Jul', value: 28 },
    { month: 'Aug', value: 24 },
    { month: 'Sep', value: 19 },
    { month: 'Oct', value: 16 },
  ],
};

export interface Role {
  name: string;
  main?: boolean;
  spec: SpecPair[];
  points: string[];
}

export const roles = {
  title: 'right view for every desk',
  items: [
    {
      name: 'officer',
      spec: [
        { label: 'Sees', value: 'Assigned cases' },
        { label: 'Can', value: 'Act, remark, transfer' },
      ],
      points: [
        'Case timeline and next action',
        'Overlap alerts on own cases',
        'Deadline reminders',
      ],
    },
    {
      name: 'bureau head',
      main: true,
      spec: [
        { label: 'Sees', value: 'The whole bureau' },
        { label: 'Can', value: 'Assign, link, escalate' },
      ],
      points: [
        'Bureau workload and ageing',
        'Link cases across bureaus',
        'Decide the lead bureau',
      ],
    },
    {
      name: 'management',
      spec: [
        { label: 'Sees', value: 'All bureaus and regions' },
        { label: 'Can', value: 'Review and report' },
      ],
      points: [
        'Region and bureau reports',
        'Disposal rate trends',
        'Escalations with context',
      ],
    },
  ] satisfies Role[],
};

export const faq = {
  title: 'before you ask',
  intro: 'Questions officials usually raise in the first demo.',
  items: [
    {
      q: 'Does the AI decide what happens to a case?',
      a: 'No. Setu suggests possible overlaps and explains why. Officers review the suggestion and decide whether to link cases and which bureau leads.',
    },
    {
      q: "What if an institution's name is spelled differently?",
      a: "Matching uses the AICTE permanent ID first, then name variants, address and timing, so small spelling differences don't hide an overlap.",
    },
    {
      q: 'Who can see which cases?',
      a: 'Access follows role and bureau. Officers see their cases, bureau heads see their bureau, and management sees everything.',
    },
    {
      q: 'Is this real data?',
      a: 'Not in this prototype. Every institution, case and number shown is synthetic.',
    },
  ],
};

export const close = {
  spec: [
    { label: 'Access', value: 'Authorized AICTE officials' },
    { label: 'Data', value: 'Synthetic in this prototype' },
    { label: 'Team', value: 'Aarohan, SIH PS 26264' },
  ] satisfies SpecPair[],
  explore: { href: '#views', label: 'Explore the views' },
  word: 'sign in',
};

export const footer = {
  word: 'सेतु',
  links: [
    { href: '#views', label: 'Views' },
    { href: '#route', label: 'A case' },
    { href: '#roles', label: 'Roles' },
    { href: '#faq', label: 'Questions' },
  ],
  note: 'Prototype for Smart India Hackathon · PS 26264 · Team Aarohan · All data shown is synthetic',
};
