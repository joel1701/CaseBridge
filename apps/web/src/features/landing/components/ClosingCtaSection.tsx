import { Link } from 'react-router';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function ClosingCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#FFFCF0] py-24 md:py-36 border-b border-[#E8E6DF]">
      {/* Decorative Editorial Border Frame */}
      <div className="relative mx-auto max-w-5xl px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl border border-[#DCDAD0] bg-white p-8 sm:p-14 md:p-20 shadow-lg overflow-hidden">
          {/* Subtle lavender background glow in the corners */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#A88BFF]/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#45E3AE]/15 blur-3xl"
            aria-hidden="true"
          />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD0] bg-[#FAF9F5] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#171717] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#45E3AE]" />
            Begin With Structured Clarity
          </div>

          {/* Headline */}
          <h2 className="font-serif-editorial text-3xl sm:text-5xl md:text-6xl font-normal text-[#171717] tracking-tight leading-[1.12] max-w-3xl mx-auto">
            Make every intake{' '}
            <span className="relative inline-block">
              <span className="bg-[#45E3AE] text-[#171717] px-3 py-0.5 rounded-none font-normal italic">
                easier to review
              </span>
            </span>
            .
          </h2>

          {/* Supporting Copy */}
          <p className="mt-6 text-base sm:text-xl text-[#4A4A46] font-sans-ui max-w-2xl mx-auto leading-relaxed">
            Bring clarity to complex narratives and give caseworkers a more
            structured starting point.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 rounded-md bg-[#171717] px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-[#2b2b2b] hover:shadow-lg active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#171717]"
            >
              <span>Try CaseBridge</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-[#C5C3BA] bg-white px-7 py-4 text-base font-medium text-[#171717] hover:bg-[#F3F3F1] hover:border-[#171717] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]"
            >
              <span>Explore How It Works</span>
              <ArrowRight className="w-4 h-4 text-[#71706A]" />
            </a>
          </div>

          {/* Supporting Highlights */}
          <div className="mt-12 pt-8 border-t border-[#ECEAE3] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#5E5D57]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#285A48]" />
              <span>Verbatim narrative preserved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#285A48]" />
              <span>Transparent evidentiary gap detection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#285A48]" />
              <span>Zero automated legal dispositions</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

