import { Link } from 'react-router';
import {
  FileText,
  Search,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Capture the Story',
      badge: 'Unstructured Intake',
      highlightColor: 'bg-[#A88BFF]',
      headline: 'Start with an unstructured intake narrative.',
      description:
        'Applicants describe grievances in their own words. CaseBridge ingests multi-page submissions, handwritten transcripts, and transcribed interviews verbatim—preserving the raw source text alongside immutable timestamps, cryptographic checksums, and original bureau identifier tags.',
      bullets: [
        'Preserves original complaint IDs without forced cross-bureau renumbering',
        'Maintains complete applicant testimony for legal and evidentiary integrity',
        'Operates with authorized bureau tenancy and role-scoped access control',
      ],
      linkText: 'Explore Bureau Queue',
      linkTo: '/bureau-queue',
      visual: (
        <div className="rounded-xl border border-[#DCDAD0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#171717]" />
              <span className="text-xs font-mono font-bold text-[#171717]">
                INTAKE RECORD · PGRC-DEMO-001
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#E8FAF4] text-[#285A48] px-2 py-0.5 rounded font-bold">
              VERBATIM
            </span>
          </div>

          <div className="bg-[#FAF9F5] border border-[#ECE9DF] rounded-lg p-3.5 text-xs text-[#333330] leading-relaxed font-sans-ui">
            <p className="italic text-[#6B6A65] mb-2 font-serif-editorial text-sm">
              "On October 1st, when my daughter and 30 others reported to the
              admissions counter, the registrar demanded ₹45,000 cash for
              'Institutional Development'..."
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DF] text-[10px] text-[#71706A]">
              <span>Source: Transcribed Grievance Form</span>
              <span>Length: 2,140 chars · 342 words</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#F3F3F1] p-2 rounded border border-[#E5E5E0]">
              <span className="block text-[9px] font-mono text-[#71706A] uppercase">
                Bureau Ownership
              </span>
              <strong className="text-[#171717]">PGRC (Grievance Cell)</strong>
            </div>
            <div className="bg-[#F3F3F1] p-2 rounded border border-[#E5E5E0]">
              <span className="block text-[9px] font-mono text-[#71706A] uppercase">
                Access Boundary
              </span>
              <strong className="text-[#171717]">
                Authorized Officers Only
              </strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '02',
      title: 'Structure the Details',
      badge: 'Signal Extraction',
      highlightColor: 'bg-[#45E3AE]',
      headline:
        'Organize relevant issues, dates, amounts, parties, and key signals.',
      description:
        'CaseBridge indexes the unstructured account against verified institution records and statutory categories. It extracts key parameters—financial figures, statutory deadlines, respondent entities, and candidate related cases across sister bureaus—without obscuring contextual nuances.',
      bullets: [
        'Normalized category mapping (Fees, Faculty, Infrastructure, Academic)',
        'Calibrated semantic matching between related cases across independent bureaus',
        'Preserved relationships mapped in an authorized institution knowledge graph',
      ],
      linkText: 'Inspect Knowledge Graph',
      linkTo: '/graph/inst-01',
      visual: (
        <div className="rounded-xl border border-[#DCDAD0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#5B3EBD]" />
              <span className="text-xs font-mono font-bold text-[#171717]">
                STRUCTURED ENTITY INDEX
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#F0EBFF] text-[#5B3EBD] px-2 py-0.5 rounded font-bold">
              CALIBRATED
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] text-xs">
              <span className="text-[#71706A]">Disputed Amount</span>
              <span className="font-mono font-bold text-[#171717] bg-white px-2 py-0.5 rounded border border-[#E0DED7]">
                ₹45,000 cash demand
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF9F5] border border-[#E8E6DF] text-xs">
              <span className="text-[#71706A]">Institution Identity</span>
              <span className="font-semibold text-[#171717]">
                Aaravika Institute (inst-01)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F8F7FF] border border-[#DFD7FF] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#5B3EBD]">
                  Cross-Bureau Overlap Candidate
                </span>
                <span className="font-mono text-[10px] font-bold text-[#5B3EBD]">
                  RB-DEMO-002
                </span>
              </div>
              <p className="text-[11px] text-[#4F4B66]">
                Identified similar fee complaint filed independently under
                Regional Bureau.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '03',
      title: "Identify What's Missing",
      badge: 'Transparent Uncertainty',
      highlightColor: 'bg-[#FFD600]',
      headline:
        'Surface open questions and missing information instead of inventing answers.',
      description:
        'Generic AI platforms hallucinate confident answers when facts are ambiguous. CaseBridge takes the opposite approach: it explicitly flags what is absent—missing payment slips, unverified dates, omitted witness references, and necessary legal prerequisites—guiding caseworkers to the right follow-up inquiries.',
      bullets: [
        'Explicit evidentiary gap detection highlights missing supporting records',
        'Curates specific, targeted follow-up questions for complainant interviews',
        'Separates verified documentary facts from uncorroborated allegations',
      ],
      linkText: 'Review Alerts & Gaps',
      linkTo: '/alerts',
      visual: (
        <div className="rounded-xl border border-[#FFE0A3] bg-[#FFFBF0] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#F4E0B8] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B36B00]" />
              <span className="text-xs font-mono font-bold text-[#8A4F00]">
                EVIDENTIARY GAP AUDIT
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#FFEABF] text-[#8A4F00] px-2 py-0.5 rounded uppercase">
              Action Required
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-white p-2.5 rounded border border-[#F2DEB5] flex items-start gap-2">
              <span className="text-[#D98200] font-bold">✕</span>
              <div>
                <strong className="text-[#171717] block">
                  No Official Fee Receipt
                </strong>
                <span className="text-[#6B6A65] text-[11px]">
                  Applicant only holds an unnumbered yellow carbon slip without
                  stamp.
                </span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-[#F2DEB5] flex items-start gap-2">
              <span className="text-[#D98200] font-bold">✕</span>
              <div>
                <strong className="text-[#171717] block">
                  Missing Dean's Response
                </strong>
                <span className="text-[#6B6A65] text-[11px]">
                  Verbal refusal reported; no written institutional circular
                  attached.
                </span>
              </div>
            </div>

            <div className="bg-[#FAF6EA] p-2.5 rounded border border-[#E8DCBD] text-[11px] text-[#523500]">
              <strong className="font-semibold block mb-0.5">
                Caseworker Interview Prompt:
              </strong>
              "Request bank statement proving date/amount of cash withdrawal or
              UPI payment."
            </div>
          </div>
        </div>
      ),
    },
    {
      number: '04',
      title: 'Prepare for Human Review',
      badge: 'Action Firewall & Handoff',
      highlightColor: 'bg-[#A88BFF]',
      headline:
        'Present a structured handoff that a qualified human can evaluate before taking action.',
      description:
        'Before an officer issues an inquiry, summons, or audit notice, CaseBridge runs its Action Firewall. It checks whether another bureau has already scheduled an inspection or requested identical evidence, presenting a coordination recommendation rather than making an automatic determination.',
      bullets: [
        'Action Firewall previews conflicting or duplicate institutional inquiries',
        'Independent status lifecycles preserved for each bureau without forced merges',
        'Officers and Bureau Heads record explicit rationale for every coordination step',
      ],
      linkText: 'Open Investigation Workspace',
      linkTo: '/investigations/cmp-001',
      visual: (
        <div className="rounded-xl border border-[#C5B4F8] bg-[#F7F4FF] p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DFD5FD] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#5B3EBD]" />
              <span className="text-xs font-mono font-bold text-[#3B1F9E]">
                ACTION FIREWALL CHECK
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#45E3AE] text-[#0A3D2B] px-2 py-0.5 rounded uppercase">
              Notice Safeguard
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-[#DFD5FD] mb-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#171717]">
                Overlapping Proposed Action: ACT-001
              </span>
              <span className="text-[10px] font-mono text-[#71706A]">
                Regional Bureau
              </span>
            </div>
            <p className="text-[11px] text-[#555550]">
              Sister bureau RB has already initiated evidence collection for
              Aaravika Institute.
            </p>
          </div>

          <div className="bg-[#EFEAFF] p-3 rounded-lg border border-[#D5C7FC] text-xs">
            <span className="font-semibold text-[#5B3EBD] block mb-1 text-[11px] uppercase tracking-wider">
              Recommended Coordination:
            </span>
            <p className="text-[11px] text-[#332E4C] leading-normal">
              Combine document demands into a single coordinated notice to
              prevent duplicate regulatory burden.
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#DFD5FD] text-[11px]">
            <span className="text-[#5B3EBD] font-semibold">
              Officer Review: Required
            </span>
            <span className="text-[#71706A]">Final Decision: Human</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative bg-[#F3F3F1] py-20 md:py-32 border-b border-[#E8E6DF]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD0] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#171717] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#45E3AE]" />
            Workflow & Method
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-[#171717] tracking-tight">
            How CaseBridge Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#555550] font-sans-ui">
            Four intentional steps engineered to transform complex narratives
            into reviewable case files—while preserving complete human
            authority.
          </p>
        </div>

        {/* Steps: Alternating Layout */}
        <div className="space-y-16 md:space-y-24">
          {steps.map((step, index) => {
            const isEven = index % 2 === 1;
            return (
              <div
                key={step.number}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center"
              >
                {/* Text Column */}
                <div
                  className={`lg:col-span-6 ${
                    isEven ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-[#171717] tracking-tight">
                      {step.number}
                    </span>
                    <span className="h-4 w-[1px] bg-[#DCDAD0]" />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded ${step.highlightColor} text-[#171717]`}
                    >
                      {step.title}
                    </span>
                  </div>

                  <h3 className="font-serif-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-[#171717] leading-snug tracking-tight">
                    {step.headline}
                  </h3>

                  <p className="mt-4 text-base text-[#4A4A46] font-sans-ui leading-relaxed">
                    {step.description}
                  </p>

                  <ul className="mt-5 space-y-2 text-sm text-[#555550]">
                    {step.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-[#171717] font-bold mt-0.5">
                          ·
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-[#E0DED7]">
                    <Link
                      to={step.linkTo}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#171717] hover:text-[#5B3EBD] transition-colors group"
                    >
                      <span>{step.linkText}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Visual Mockup Column */}
                <div
                  className={`lg:col-span-6 ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div className="relative rounded-2xl bg-white p-3 sm:p-5 border border-[#DCDAD0] shadow-md hover:shadow-lg transition-shadow">
                    {/* Step Visual */}
                    {step.visual}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
