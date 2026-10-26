import {
  FileText,
  ScanEye,
  GitMerge,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router';

export function KeyBenefitsSection() {
  const benefits = [
    {
      title: 'Structured Intake',
      description:
        'Turn lengthy narratives into readable case summaries without losing critical nuances, applicant quotes, or timestamps.',
      detail:
        'Converts complex multi-page submissions into a clean, indexed record where dates, financial amounts, and institutional respondents are immediately accessible.',
      icon: FileText,
      accentColor: 'bg-[#A88BFF]',
      tag: 'Triage & Clarity',
    },
    {
      title: 'Visible Information Gaps',
      description:
        'Surface missing facts, unverified assertions, and unresolved questions rather than assuming certainty.',
      detail:
        'Explicitly lists missing fee receipts, unsigned forms, or absent circulars—giving caseworkers an exact checklist for applicant follow-up.',
      icon: ScanEye,
      accentColor: 'bg-[#FFD600]',
      tag: 'Evidentiary Precision',
    },
    {
      title: 'Consistent Handoffs',
      description:
        'Present information in a predictable, standardized structure across departments and bureaus.',
      detail:
        'Maintains uniform summaries across separate regulatory desks (PGRC, Regional Bureau) while preserving original complaint identifiers and bureau boundaries.',
      icon: GitMerge,
      accentColor: 'bg-[#45E3AE]',
      tag: 'Cross-Bureau Coordination',
    },
    {
      title: 'Human-Controlled Decisions',
      description:
        'Keep review, coordination, and final regulatory judgment strictly with authorized human officers.',
      detail:
        'The Action Firewall alerts officers to overlapping inspections or duplicate evidence requests, leaving all final determinations to human discretion.',
      icon: UserCheck,
      accentColor: 'bg-[#12C7E8]',
      tag: 'Human Governance',
    },
  ];

  return (
    <section
      id="benefits"
      className="relative bg-white py-20 md:py-32 border-b border-[#E8E6DF]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD0] bg-[#FFFCF0] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#171717] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#171717]" />
            Core Capabilities
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-[#171717] tracking-tight">
            Key Benefits for Caseworkers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#555550] font-sans-ui">
            Engineered to reduce administrative overhead and improve
            investigative clarity without overstepping into automated
            decision-making.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative rounded-xl border border-[#E5E5E0] bg-[#FFFCF0] p-6 hover:bg-white hover:border-[#171717] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-2.5 rounded-lg bg-white border border-[#E5E5E0] text-[#171717] shadow-2xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-[#171717]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-[#E0DED7] text-[#555550]">
                      {benefit.tag}
                    </span>
                  </div>

                  <h3 className="font-serif-editorial text-xl font-medium text-[#171717] group-hover:text-[#171717]">
                    {benefit.title}
                  </h3>

                  <p className="mt-2.5 text-xs text-[#171717] font-medium leading-relaxed">
                    {benefit.description}
                  </p>

                  <p className="mt-3 text-xs text-[#6B6A65] leading-relaxed border-t border-[#ECEAE3] pt-3">
                    {benefit.detail}
                  </p>
                </div>

                <div className="mt-6 pt-3 flex items-center justify-between text-xs text-[#71706A]">
                  <span className="font-mono text-[10px]">
                    Pillar 0{index + 1}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${benefit.accentColor}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout Strip */}
        <div className="mt-12 rounded-xl bg-[#F8F7F3] border border-[#E0DDD5] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#45E3AE]" />
            <p className="text-xs sm:text-sm text-[#383733]">
              <strong>Responsible Engineering Guarantee:</strong> CaseBridge
              does not score legal merit, compute probability of liability, or
              auto-dispatch penalties.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="shrink-0 text-xs font-semibold text-[#171717] hover:text-[#5B3EBD] flex items-center gap-1.5 underline"
          >
            <span>View Live Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
