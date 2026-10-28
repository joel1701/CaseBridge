import { Link } from 'react-router';
import { ArrowRight, ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative bg-white pt-16 pb-16 lg:pt-24 lg:pb-20 border-b border-slate-100">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
        {/* Direct, Natural Heading - No Eyebrow Pill */}
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12] max-w-4xl mx-auto">
          Investigate related complaints in one workspace.
        </h1>

        {/* Supporting Plain-Language Narrative */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-body max-w-3xl mx-auto">
          CaseBridge helps AICTE Public Grievance Redressal Cell and Regional
          Bureau officers review student and faculty grievances, spot missing
          evidence early, and coordinate before sending duplicate notices to
          institutions.
        </p>

        {/* Primary and Secondary Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/investigations/cmp-001"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-6 py-3.5 text-base font-semibold transition-all shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
          >
            <span>Explore Case cmp-001</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span>View Coordination Overview</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>

        {/* Understated Verification Note */}
        <p className="mt-12 text-xs text-slate-500 font-body max-w-2xl mx-auto">
          Evaluated on 25 synthetic AICTE grievances across PGRC and Regional
          Bureau queues. Assistive review only—all regulatory determinations
          remain with authorized officers.
        </p>
      </div>
    </section>
  );
}
