import { useState } from 'react';
import { Link } from 'react-router';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Building,
  User,
  Layers,
  Sparkles,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

interface ScenarioData {
  id: string;
  originalId: string;
  bureau: string;
  category: string;
  title: string;
  status: string;
  overlapReviewStatus: string;
  institution: string;
  rawNarrative: string;
  keyIssue: string;
  extractedSignals: {
    label: string;
    value: string;
    type: 'neutral' | 'warning' | 'info';
  }[];
  datesAmountsParties: {
    dates: string;
    amount: string;
    parties: string;
    bureauOwnership: string;
  };
  missingInfo: string[];
  openQuestions: string[];
  operationalNextStep: {
    headline: string;
    description: string;
    actionFirewallFlag: string;
  };
  humanReviewStatus: {
    officer: string;
    state: string;
    bureau: string;
  };
}

const scenarios: ScenarioData[] = [
  {
    id: 'cmp-001',
    originalId: 'PGRC-DEMO-001',
    bureau: 'PGRC',
    category: 'FEES',
    title: 'Unapproved admission fees & caution collection',
    status: 'RECEIVED',
    overlapReviewStatus: 'PENDING OFFICER REVIEW',
    institution: 'Aaravika Institute of Engineering (inst-01)',
    rawNarrative:
      "I am lodging this report on behalf of my son and 30 second-year transfer applicants at Aaravika Institute. On October 1, 2026, when reporting to the admissions desk, the finance counter refused to finalize enrollment without a mandatory cash deposit of Rs. 45,000 titled 'Institutional Infrastructure Development'. This sum was never listed in the official AICTE approved prospectus or state fee schedule. The counter staff refused to issue a formal stamped voucher, providing only an unnumbered yellow carbon slip with no registration stamp. Several families were told their admission would lapse if unsubmitted by October 15. We have reached out to the dean's office twice by phone with no callback.",
    keyIssue:
      'Unauthorised collection of supplementary ₹45,000 cash fees without stamped receipt; threat of admission forfeiture.',
    extractedSignals: [
      {
        label: 'Category',
        value: 'FEES (Academic / Admission)',
        type: 'neutral',
      },
      {
        label: 'Institution ID',
        value: 'inst-01 · Aaravika Institute',
        type: 'neutral',
      },
      {
        label: 'Cross-Bureau Link',
        value: 'Match candidate RB-DEMO-002 (88% overlap)',
        type: 'warning',
      },
      {
        label: 'Firewall Flag',
        value: 'Overlapping inspection notice in progress',
        type: 'warning',
      },
    ],
    datesAmountsParties: {
      dates: 'Incident: Oct 1, 2026 · Admission Cutoff: Oct 15, 2026',
      amount: '₹45,000 (Mandatory cash demand beyond approved schedule)',
      parties:
        'Complainant: Parent & Student Cohort · Respondent: Aaravika Finance Counter',
      bureauOwnership:
        'Public Grievance Redressal Cell (PGRC) · Preserved ID PGRC-DEMO-001',
    },
    missingInfo: [
      'Official signed fee schedule or written circular cited by counter staff',
      'Digital scan or photo of the unnumbered handwritten yellow carbon slip',
      'Name or employee badge number of the finance counter officer',
    ],
    openQuestions: [
      'Has the complainant group formally notified the State Fee Regulatory Committee?',
      'Did any students pay via netbanking / UPI, creating traceable bank records?',
    ],
    operationalNextStep: {
      headline: 'Action Firewall Preview: Coordinate with Regional Bureau (RB)',
      description:
        'A sister complaint (RB-DEMO-002) is active for the same institution under Regional Bureau. To prevent conflicting evidentiary requests or duplicate institutional inquiries, CaseBridge recommends a joint record request rather than an isolated second notice.',
      actionFirewallFlag:
        'Recommended: Joint Information Request before formal notice issuance',
    },
    humanReviewStatus: {
      officer: 'Officer Pritika (Reviewing Caseworker)',
      state: 'Awaiting Officer Confirmation',
      bureau: 'PGRC Bureau Queue',
    },
  },
  {
    id: 'cmp-004',
    originalId: 'RB-DEMO-004',
    bureau: 'RB',
    category: 'FACULTY',
    title: 'Teaching post vacancies across core engineering terms',
    status: 'ESCALATED',
    overlapReviewStatus: 'PENDING OFFICER REVIEW',
    institution: 'Aaravika Institute of Engineering (inst-01)',
    rawNarrative:
      'During our department committee audit in early October 2026, students submitted signatures noting that core third-semester lectures in Mechanical and Computer Science have been combined into single auditorium batches because 6 designated professor posts remain unfilled since August. Faculty attendance records verify that multiple prerequisite lab sessions were marked held without assigned instructional staff. Dean verbally claimed recruitment is underway, but no recruitment advertisement or gazette posting has been published.',
    keyIssue:
      'Substantial instructional deficit with 6 unfilled core faculty posts, leading to combined auditorium lectures and unattended laboratory schedules.',
    extractedSignals: [
      {
        label: 'Category',
        value: 'FACULTY (Staffing & Compliance)',
        type: 'neutral',
      },
      {
        label: 'Institution ID',
        value: 'inst-01 · Aaravika Institute',
        type: 'neutral',
      },
      {
        label: 'Cross-Bureau Link',
        value: 'High correlation with PGRC-DEMO-005',
        type: 'warning',
      },
      {
        label: 'Evidence Scope',
        value: '6 Professorial vacancies across 2 departments',
        type: 'info',
      },
    ],
    datesAmountsParties: {
      dates: 'Term Start: August 2026 · Audit Signatures: Oct 4, 2026',
      amount: 'N/A · Statutory faculty cadre deficiency (6 vacancies)',
      parties:
        'Complainant: Department Student Committee · Respondent: Dean & Academic Council',
      bureauOwnership: 'Regional Bureau (RB) · Preserved ID RB-DEMO-004',
    },
    missingInfo: [
      'Copy of verified department biometric or logbook attendance registers',
      'Official syllabus completion percentage for current semester',
      'Written response from Head of Department regarding vacancy recruitment',
    ],
    openQuestions: [
      'Are ad-hoc or adjunct lecturers currently assigned but unrecorded in the roster?',
      'Has the institution submitted its mandatory Annual AICTE Faculty Disclosure for 2026-27?',
    ],
    operationalNextStep: {
      headline: 'Action Firewall Preview: Shared Staffing Review with PGRC',
      description:
        'PGRC has received complaint PGRC-DEMO-005 on identical faculty attendance deficits. CaseBridge alerts the caseworker to combine the physical inspection notice under ACT-004, saving institutional response cycles.',
      actionFirewallFlag:
        'Action Firewall: Overlapping Inspection Notice detected',
    },
    humanReviewStatus: {
      officer: 'Officer Vishwak (Inspecting Officer)',
      state: 'Awaiting Cross-Bureau Endorsement',
      bureau: 'Regional Bureau Inspection Desk',
    },
  },
];

export function ProductShowcase() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'split' | 'narrative' | 'summary'>(
    'split',
  );

  const currentScenario = scenarios[selectedScenarioIndex];

  return (
    <section id="features" className="relative bg-[#FFFCF0] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD0] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#171717] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#A88BFF]" />
            Live Product Interface Mockup
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-[#171717] tracking-tight">
            See how raw intake narratives become{' '}
            <span className="bg-[#A88BFF] px-2 py-0.5 text-[#171717] font-normal italic">
              structured case records
            </span>
            .
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#555550] font-sans-ui">
            CaseBridge does not make automatic legal decisions. It organizes
            intricate statements into consistent facts, flags evidentiary gaps,
            and highlights cross-bureau coordination points for qualified
            officers.
          </p>
        </div>

        {/* Case Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 bg-[#F3F3F1] p-1.5 rounded-lg border border-[#E5E5E0] w-full sm:w-auto">
            {scenarios.map((sc, idx) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenarioIndex(idx)}
                className={`flex-1 sm:flex-initial text-xs sm:text-sm font-medium px-4 py-2 rounded-md transition-all text-left sm:text-center ${
                  selectedScenarioIndex === idx
                    ? 'bg-white text-[#171717] font-semibold shadow-xs border border-[#E0DED7]'
                    : 'text-[#666662] hover:text-[#171717]'
                }`}
              >
                <span className="font-mono text-[11px] opacity-75 mr-1.5">
                  {sc.originalId}
                </span>
                <span>{sc.category}</span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#F3F3F1] p-1 rounded-lg border border-[#E5E5E0] self-end sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-white text-[#171717] shadow-2xs font-semibold'
                  : 'text-[#666662] hover:text-[#171717]'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setViewMode('narrative')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'narrative'
                  ? 'bg-white text-[#171717] shadow-2xs font-semibold'
                  : 'text-[#666662] hover:text-[#171717]'
              }`}
            >
              Raw Narrative
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewMode === 'summary'
                  ? 'bg-white text-[#171717] shadow-2xs font-semibold'
                  : 'text-[#666662] hover:text-[#171717]'
              }`}
            >
              Structured Summary
            </button>
          </div>
        </div>

        {/* Master Showcase Frame with Lavender Accent Background */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#F3F0FF] via-[#EFEBFF] to-[#FAF8F5] p-3 sm:p-5 md:p-8 border border-[#D5CDF7] shadow-xl">
          {/* Subtle Lavender Architectural Grid Pattern */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(to right, #A88BFF 1px, transparent 1px), linear-gradient(to bottom, #A88BFF 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
            aria-hidden="true"
          />

          {/* Main White Mockup Canvas */}
          <div className="relative bg-white rounded-xl border border-[#DCDAD0] shadow-sm overflow-hidden">
            {/* Mock Window Top Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#E8E6DF] bg-[#FAFAF8] px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E5E5E0]" />
                  <div className="w-3 h-3 rounded-full bg-[#E5E5E0]" />
                  <div className="w-3 h-3 rounded-full bg-[#E5E5E0]" />
                </div>
                <div className="h-4 w-[1px] bg-[#E0DED7] hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#171717]">
                    casebridge.internal/investigations/{currentScenario.id}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-[#EAE6FD] text-[#5533BD] px-2 py-0.5 text-[10px] font-semibold uppercase">
                    <span>Authorized Review</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <span className="text-xs text-[#73726C] hidden md:inline">
                  Bureau Origin:{' '}
                  <strong className="text-[#171717]">
                    {currentScenario.bureau}
                  </strong>
                </span>
                <Link
                  to={`/investigations/${currentScenario.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#5B3EBD] bg-white border border-[#DCDAD0] px-3 py-1.5 rounded-md hover:border-[#171717] transition-all"
                >
                  <span>Open in Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Case Header Strip */}
            <div className="border-b border-[#E8E6DF] bg-white px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-[#171717] bg-[#F3F3F1] px-2 py-0.5 rounded">
                    {currentScenario.originalId}
                  </span>
                  <span className="text-xs font-medium text-[#73726C]">·</span>
                  <span className="text-xs font-semibold text-[#285A48] bg-[#E8FAF4] px-2.5 py-0.5 rounded-full border border-[#BCEEDB]">
                    {currentScenario.category}
                  </span>
                  <span className="text-xs font-semibold text-[#8F4700] bg-[#FFF5E6] px-2.5 py-0.5 rounded-full border border-[#FFE0B2]">
                    {currentScenario.status}
                  </span>
                  <span className="text-xs font-semibold text-[#5B3EBD] bg-[#F0EBFF] px-2.5 py-0.5 rounded-full border border-[#D8CEFD]">
                    {currentScenario.overlapReviewStatus}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#171717]">
                  {currentScenario.title}
                </h3>
                <p className="text-xs text-[#6B6A65] mt-0.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#888882]" />
                  <span>
                    Respondent Institution: {currentScenario.institution}
                  </span>
                </p>
              </div>

              {/* Caseworker Review Status Pill */}
              <div className="bg-[#F8F8F6] border border-[#E8E6DF] rounded-lg p-3 text-left md:text-right shrink-0">
                <div className="flex items-center md:justify-end gap-1.5 text-xs font-semibold text-[#171717]">
                  <span className="w-2 h-2 rounded-full bg-[#FFD600] animate-pulse" />
                  <span>{currentScenario.humanReviewStatus.officer}</span>
                </div>
                <p className="text-[11px] text-[#6B6A65] mt-0.5">
                  {currentScenario.humanReviewStatus.state}
                </p>
              </div>
            </div>

            {/* Mock Body: Split View or Individual Views */}
            <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAF8]">
              <div
                className={`grid gap-6 ${
                  viewMode === 'split'
                    ? 'lg:grid-cols-12'
                    : 'grid-cols-1 max-w-4xl mx-auto'
                }`}
              >
                {/* Left Side: Original Unstructured Narrative */}
                {(viewMode === 'split' || viewMode === 'narrative') && (
                  <div
                    className={`${
                      viewMode === 'split' ? 'lg:col-span-5' : 'w-full'
                    } flex flex-col`}
                  >
                    <div className="rounded-xl border border-[#DCDAD0] bg-white p-5 sm:p-6 shadow-2xs flex-1 flex flex-col">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EFEA]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#171717]" />
                          <h4 className="text-sm font-bold text-[#171717] tracking-tight">
                            Original Intake Narrative
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-[#8C8B85] bg-[#F5F5F3] px-2 py-0.5 rounded">
                          Verbatim Record
                        </span>
                      </div>

                      <div className="rounded-lg bg-[#FFFDF7] border border-[#ECE8DC] p-4 text-xs sm:text-sm text-[#383733] leading-relaxed font-sans-ui flex-1 relative">
                        <div className="absolute top-2 right-2 text-[10px] font-mono text-[#9C9A93] uppercase">
                          Intake Entry
                        </div>
                        <p className="whitespace-pre-line pr-6">
                          {currentScenario.rawNarrative}
                        </p>
                      </div>

                      {/* Verbatim Preservation Note */}
                      <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-[11px] text-[#71706A]">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#285A48]" />
                          <span>
                            Original narrative preserved without lossy
                            truncation
                          </span>
                        </span>
                        <span className="font-mono text-[10px]">
                          SHA-256 Verified
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Side: Structured Reviewable Case Summary */}
                {(viewMode === 'split' || viewMode === 'summary') && (
                  <div
                    className={`${
                      viewMode === 'split' ? 'lg:col-span-7' : 'w-full'
                    } flex flex-col gap-5`}
                  >
                    {/* Key Issue & Extracted Signals */}
                    <div className="rounded-xl border border-[#DCDAD0] bg-white p-5 sm:p-6 shadow-2xs">
                      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#F0EFEA]">
                        <Sparkles className="w-4 h-4 text-[#5B3EBD]" />
                        <h4 className="text-sm font-bold text-[#171717] tracking-tight">
                          Key Issue & Extracted Signals
                        </h4>
                      </div>

                      <div className="rounded-md bg-[#F8F7FF] border border-[#E4DDFF] p-3.5 mb-4">
                        <span className="text-[11px] font-semibold text-[#5B3EBD] uppercase tracking-wider block mb-1">
                          Primary Allegation
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-[#171717] leading-snug">
                          {currentScenario.keyIssue}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentScenario.extractedSignals.map((sig, i) => (
                          <div
                            key={i}
                            className={`rounded-md border p-2.5 text-xs ${
                              sig.type === 'warning'
                                ? 'bg-[#FFF9EE] border-[#FFE2B3] text-[#7A4B00]'
                                : 'bg-[#FAFAF8] border-[#E8E6DF] text-[#333330]'
                            }`}
                          >
                            <span className="block text-[10px] uppercase font-bold text-[#71706A]">
                              {sig.label}
                            </span>
                            <span className="font-medium mt-0.5 block">
                              {sig.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relevant Dates, Amounts & Parties */}
                    <div className="rounded-xl border border-[#DCDAD0] bg-white p-5 sm:p-6 shadow-2xs">
                      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#F0EFEA]">
                        <Layers className="w-4 h-4 text-[#171717]" />
                        <h4 className="text-sm font-bold text-[#171717] tracking-tight">
                          Relevant Dates, Amounts & Parties
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[#71706A] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Timeline & Deadlines</span>
                          </span>
                          <p className="font-medium text-[#171717]">
                            {currentScenario.datesAmountsParties.dates}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase text-[#71706A]">
                            Disputed Financial Amount
                          </span>
                          <p className="font-medium text-[#171717]">
                            {currentScenario.datesAmountsParties.amount}
                          </p>
                        </div>

                        <div className="space-y-1 sm:col-span-2 pt-2 border-t border-[#F0EFEA]">
                          <span className="text-[10px] font-bold uppercase text-[#71706A] flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Parties & Representation</span>
                          </span>
                          <p className="font-medium text-[#171717]">
                            {currentScenario.datesAmountsParties.parties}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Missing Information & Open Questions (Gap Analysis) */}
                    <div className="rounded-xl border border-[#FFE0A3] bg-[#FFFBF0] p-5 sm:p-6 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F4E0B8]">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#B36B00]" />
                          <h4 className="text-sm font-bold text-[#8A4F00] tracking-tight">
                            Identified Information Gaps & Questions
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold bg-[#FFEABF] text-[#8A4F00] px-2 py-0.5 rounded-full uppercase">
                          Needs Caseworker Follow-Up
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-[11px] font-bold text-[#8A4F00] uppercase block mb-1.5">
                            Evidentiary Records Not Attached:
                          </span>
                          <ul className="space-y-1.5">
                            {currentScenario.missingInfo.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-[#523500]"
                              >
                                <span className="text-[#D98200] font-bold">
                                  ✕
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-[#F2DEB5]">
                          <span className="text-[11px] font-bold text-[#8A4F00] uppercase block mb-1.5 flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Clarification Inquiries for Applicant:</span>
                          </span>
                          <ul className="space-y-1.5">
                            {currentScenario.openQuestions.map((q, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-xs text-[#523500]"
                              >
                                <span className="text-[#5B3EBD] font-bold">
                                  ?
                                </span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Operational Next Step & Action Firewall */}
                    <div className="rounded-xl border border-[#C5B4F8] bg-[#F7F4FF] p-5 sm:p-6 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DFD5FD]">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-[#5B3EBD]" />
                          <h4 className="text-sm font-bold text-[#3B1F9E] tracking-tight">
                            Operational Next Step · Action Firewall
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold bg-[#45E3AE] text-[#0A3D2B] px-2 py-0.5 rounded uppercase">
                          Coordination Ready
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-[#171717] mb-1">
                        {currentScenario.operationalNextStep.headline}
                      </p>
                      <p className="text-xs text-[#4F4B66] leading-relaxed">
                        {currentScenario.operationalNextStep.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-[#DFD5FD] flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[11px] font-mono font-medium text-[#5B3EBD]">
                          {
                            currentScenario.operationalNextStep
                              .actionFirewallFlag
                          }
                        </span>
                        <Link
                          to={`/investigations/${currentScenario.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#171717] text-white px-3.5 py-1.5 rounded-md hover:bg-[#333333] transition-colors"
                        >
                          <span>Review Coordination Option</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Bar: Human-Review Guarantee */}
            <div className="bg-[#FAF8F5] border-t border-[#E8E6DF] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B6A65]">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#45E3AE]" />
                <span className="font-semibold text-[#171717]">
                  Human Oversight Policy:
                </span>
                <span>
                  CaseBridge outputs are non-dispositive drafts subject to
                  officer endorsement.
                </span>
              </div>
              <Link
                to="/complaints"
                className="font-semibold text-[#171717] hover:underline flex items-center gap-1"
              >
                <span>Browse All 25 Sample Complaints</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
