import { Link } from 'react-router';
import { ArrowRight, ChevronDown, UserCheck } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#FFFCF0] pt-16 pb-16 md:pt-24 md:pb-24 border-b border-[#E8E6DF]">
      {/* Subtle grid pattern with very low opacity */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(#171717 1px, transparent 1px), radial-gradient(#171717 1px, #FFFCF0 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8 text-center">
        {/* Editorial Subtitle Pill */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-[#DCDAD0] bg-white px-4 py-1.5 shadow-2xs mb-8">
          <span className="flex h-2 w-2 rounded-full bg-[#45E3AE]" />
          <span className="text-xs font-semibold tracking-wider text-[#171717] uppercase">
            Human-in-the-Loop Intake Intelligence
          </span>
          <span className="text-[#C2C0B8]">·</span>
          <span className="text-xs text-[#6B6A65] font-medium hidden sm:inline">
            Designed for Legal Aid & Regulatory Bureaus
          </span>
        </div>

        {/* High-Contrast Editorial Headline */}
        <h1 className="font-serif-editorial text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal tracking-tight text-[#171717] leading-[1.08] sm:leading-[1.06] max-w-4xl mx-auto">
          Turn{' '}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10 bg-[#A88BFF] text-[#171717] px-2.5 sm:px-3 py-0.5 rounded-none font-normal italic">
              complex stories
            </span>
          </span>{' '}
          into{' '}
          <span className="relative inline-block whitespace-nowrap">
            <span className="relative z-10 bg-[#45E3AE] text-[#171717] px-2.5 sm:px-3 py-0.5 rounded-none font-normal">
              clearer next steps
            </span>
          </span>
          .
        </h1>

        {/* Supporting Copy */}
        <p className="mt-8 text-lg sm:text-xl text-[#4A4A46] font-sans-ui max-w-3xl mx-auto leading-relaxed font-normal">
          CaseBridge transforms unstructured legal-aid intake narratives into
          organized, reviewable case summaries—helping caseworkers identify key
          details, spot missing information, and prepare for informed human
          decisions.
        </p>

        {/* Dual CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 rounded-md bg-[#171717] px-7 py-3.5 text-base font-semibold text-white shadow-md hover:bg-[#2b2b2b] hover:shadow-lg active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#171717]"
          >
            <span>Try CaseBridge</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-[#C5C3BA] bg-white px-6 py-3.5 text-base font-medium text-[#171717] hover:bg-[#F3F3F1] hover:border-[#171717] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
          >
            <span>See How It Works</span>
            <ChevronDown className="w-4 h-4 text-[#666662]" />
          </a>
        </div>

        {/* Trust Statement */}
        <div className="mt-12 pt-8 border-t border-[#E8E6DF]/80 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-[#5E5D57]">
          <div className="flex items-center gap-2 text-[#171717] font-semibold">
            <UserCheck className="w-4 h-4 text-[#171717]" />
            <span>Human Review Grounded</span>
          </div>
          <span className="hidden sm:inline text-[#C2C0B8]">·</span>
          <p className="text-center sm:text-left">
            Supports qualified caseworker review and professional
            discretion—never replaces legal judgment or automates case
            dispositions.
          </p>
        </div>
      </div>
    </section>
  );
}
