import { useState } from 'react';
import { Link } from 'react-router';
import {
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Building2,
} from 'lucide-react';

interface CaseData {
  id: string;
  bureauRef: string;
  bureauName: string;
  institution: string;
  category: string;
  narrative: string;
  highlights: {
    text: string;
    label: string;
  }[];
  extracted: {
    disputedSum: string;
    statutoryDeadline: string;
    institutionCode: string;
    categoryTag: string;
  };
  gaps: {
    item: string;
    detail: string;
  }[];
  sisterNotice: {
    sisterRef: string;
    bureau: string;
    conflictText: string;
    actionRec: string;
  };
}

const demoCases: CaseData[] = [
  {
    id: 'cmp-001',
    bureauRef: 'PGRC-DEMO-001',
    bureauName: 'AICTE Public Grievance Redressal Cell',
    institution: 'Aaravika Institute of Engineering',
    category: 'Fees & Admission Charges (AICTE APH §4.2)',
    narrative:
      "I am lodging this report on behalf of my son and 30 second-year transfer applicants at Aaravika Institute. On October 1, 2026, when reporting to the admissions desk, the finance counter refused to finalize enrollment without a mandatory cash deposit of Rs. 45,000 titled 'Institutional Infrastructure Development'. This sum was never listed in the official AICTE approved prospectus or state fee schedule. The counter staff refused to issue a formal stamped voucher, providing only an unnumbered yellow carbon slip with no registration stamp. Several families were told their admission would lapse if unsubmitted by October 15. We have reached out to the dean's office twice by phone with no callback.",
    highlights: [
      { text: 'Rs. 45,000', label: 'Cash demand' },
      { text: 'unnumbered yellow carbon slip', label: 'Unverified receipt' },
      { text: 'October 15', label: 'Admission deadline' },
    ],
    extracted: {
      disputedSum: '₹45,000 / applicant',
      statutoryDeadline: 'Oct 15, 2026',
      institutionCode: 'SYN-AICTE-1-900000001',
      categoryTag: 'Fees & Admission Charges',
    },
    gaps: [
      {
        item: 'Stamped official receipt absent',
        detail:
          'Complainant was issued only an unnumbered handwritten slip without official seal.',
      },
      {
        item: 'Written fee circular absent',
        detail:
          'Demand was made verbally at admissions counter; not listed in approved prospectus.',
      },
    ],
    sisterNotice: {
      sisterRef: 'RB-DEMO-002',
      bureau: 'AICTE Regional Bureau (South)',
      conflictText:
        'Regional Bureau is scheduling an evidence request for identical Q3 admission fee ledgers.',
      actionRec:
        'Action Firewall recommends a Joint Information Notice under PGRC reference to avoid duplicate audits.',
    },
  },
  {
    id: 'cmp-004',
    bureauRef: 'RB-DEMO-004',
    bureauName: 'AICTE Regional Bureau (Inspection Desk)',
    institution: 'Aaravika Institute of Engineering',
    category: 'Faculty Cadre & Attendance (AICTE APH §7.1)',
    narrative:
      'During our department committee audit in early October 2026, students submitted signatures noting that core third-semester lectures in Mechanical and Computer Science have been combined into single auditorium batches because 6 designated professor posts remain unfilled since August. Faculty attendance records verify that multiple prerequisite lab sessions were marked held without assigned instructional staff. Dean verbally claimed recruitment is underway, but no recruitment advertisement or gazette posting has been published.',
    highlights: [
      { text: '6 designated professor posts', label: 'Vacancies' },
      { text: 'no recruitment advertisement', label: 'Unadvertised' },
      { text: 'since August', label: 'Duration' },
    ],
    extracted: {
      disputedSum: '6 vacant professorial cadre posts',
      statutoryDeadline: 'Term ongoing',
      institutionCode: 'SYN-AICTE-1-900000001',
      categoryTag: 'Instructional cadre deficit',
    },
    gaps: [
      {
        item: 'Annual faculty disclosure missing',
        detail:
          'No public roster or recruitment gazette advertisement on institutional portal.',
      },
      {
        item: 'Biometric lab registers uncorroborated',
        detail:
          'Lab sessions marked held without identifying supervising instructors.',
      },
    ],
    sisterNotice: {
      sisterRef: 'PGRC-DEMO-005',
      bureau: 'AICTE Public Grievance Redressal Cell',
      conflictText:
        'PGRC has received an overlapping complaint regarding unheld laboratory terms.',
      actionRec:
        'Action Firewall recommends combining the physical inspection notice under ACT-004.',
    },
  },
];

export function ProductWorkbench() {
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const activeCase = demoCases[activeCaseIdx];

  return (
    <section
      id="product-preview"
      className="relative bg-slate-50 py-16 lg:py-24 border-b border-slate-200"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header - Direct, No Eyebrow Pill */}
        <div className="max-w-3xl mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            How an intake looks inside the workspace.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 font-body leading-relaxed">
            Compare raw grievance testimony with extracted parameters, missing
            evidence flags, and cross-bureau overlap notices in a single view.
          </p>
        </div>

        {/* Workbench Container Mockup */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
          {/* Workbench Top Bar */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
            <span className="text-xs font-medium text-slate-300">
              CaseBridge Workspace · AICTE Redressal Desk
            </span>

            {/* Case Selector Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCaseIdx(0)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeCaseIdx === 0
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Case 1: Admission fees (cmp-001)
              </button>
              <button
                type="button"
                onClick={() => setActiveCaseIdx(1)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeCaseIdx === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Case 2: Faculty shortage (cmp-004)
              </button>
            </div>
          </div>

          {/* Workbench Context Subheader */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>{activeCase.institution}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{activeCase.bureauName}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Reference:{' '}
                <strong className="font-mono-code text-slate-700">
                  {activeCase.bureauRef}
                </strong>
              </span>
              <span>·</span>
              <span className="text-emerald-700 font-medium">Under review</span>
            </div>
          </div>

          {/* 2-Column Workbench Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: Complainant's Original Narrative (7 Cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-semibold text-slate-900">
                      Original complaint (verbatim)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Source text preserved
                  </span>
                </div>

                {/* Complaint Text */}
                <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 text-sm sm:text-base leading-relaxed text-slate-800 font-body">
                  <p className="whitespace-pre-line">
                    "{activeCase.narrative}"
                  </p>
                </div>

                {/* Fact Tags Extracted from Text */}
                <div className="mt-5">
                  <span className="text-xs font-medium text-slate-500 block mb-2">
                    Key details extracted from text:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeCase.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <strong>{h.text}</strong> ({h.label})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Citation Footnote */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Intake preserved without edits</span>
                <Link
                  to="/investigations/cmp-001"
                  className="text-blue-700 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                >
                  <span>Open in workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Structured Intelligence & Evidence Checklist (5 Cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/40 flex flex-col justify-between space-y-5">
              {/* Card 1: Extracted Parameters */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <span className="text-xs font-semibold text-slate-900 block mb-3">
                  Key parameters
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Core issue</span>
                    <strong className="text-slate-900 font-semibold text-sm">
                      {activeCase.extracted.disputedSum}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">
                      Critical timeline
                    </span>
                    <strong className="text-slate-900 font-semibold text-sm text-amber-700">
                      {activeCase.extracted.statutoryDeadline}
                    </strong>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block">Category</span>
                    <span className="text-slate-700 font-medium">
                      {activeCase.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Evidentiary Gap Checklist (Amber) */}
              <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 shadow-2xs">
                <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Missing evidence checklist</span>
                </div>
                <p className="text-xs text-amber-800/90 mb-3 leading-relaxed">
                  Flagged so officers know what proof to request before taking
                  action:
                </p>
                <div className="space-y-2">
                  {activeCase.gaps.map((gap, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 rounded-lg p-2.5 border border-amber-200/80 text-xs text-slate-800"
                    >
                      <strong className="block text-slate-900 font-semibold">
                        {gap.item}
                      </strong>
                      <span className="text-slate-600 text-[11px] leading-snug block mt-0.5">
                        {gap.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Action Firewall Coordination Banner (Blue) */}
              <div className="bg-blue-50/70 rounded-xl border border-blue-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                    <ShieldAlert className="w-4 h-4 text-blue-700" />
                    <span>Sister bureau overlap</span>
                  </div>
                  <span className="text-[11px] font-mono-code text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
                    {activeCase.sisterNotice.sisterRef}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeCase.sisterNotice.conflictText}
                </p>
                <div className="mt-2.5 pt-2 border-t border-blue-200/60 text-xs text-blue-800 font-medium">
                  {activeCase.sisterNotice.actionRec}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Subject to human officer review
                </span>
                <Link
                  to="/investigations/cmp-001"
                  className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs"
                >
                  <span>Review case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
