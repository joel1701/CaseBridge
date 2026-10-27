import { Link } from 'react-router';
import { ArrowRight, Search, LayoutDashboard, Network, ShieldCheck } from 'lucide-react';

export function ExploreWorkspaceCta() {
  return (
    <section className="relative bg-white py-16 lg:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Soft Blue Card Container */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-8 sm:p-12 lg:p-16 text-center shadow-xs">
          
          <div className="max-w-3xl mx-auto">
            {/* Headline - Direct, No Eyebrow Pill */}
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Explore the working prototype.
            </h2>

            {/* Description */}
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-body leading-relaxed max-w-2xl mx-auto">
              Open the active casework workspace to examine complaint <strong className="font-mono-code text-slate-800">cmp-001</strong> (Aaravika Institute), review sister-bureau matches, and test action coordination.
            </p>

            {/* 3 Clear Route Action Cards */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
              
              {/* Route 1: Active Investigation */}
              <Link
                to="/investigations/cmp-001"
                className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <strong className="text-base font-heading font-bold text-slate-900 block mb-1 group-hover:text-blue-700 transition-colors">
                    Investigation workspace
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed font-body">
                    Inspect case cmp-001 narrative, extracted parameters, and sister-bureau overlap.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                  <span>Open case cmp-001</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Route 2: Bureau Dashboard */}
              <Link
                to="/dashboard"
                className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <strong className="text-base font-heading font-bold text-slate-900 block mb-1 group-hover:text-blue-700 transition-colors">
                    Coordination dashboard
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed font-body">
                    Review total complaint volume, pending overlap reviews, and ongoing actions.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                  <span>Open dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              {/* Route 3: Knowledge Graph */}
              <Link
                to="/graph/inst-01"
                className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Network className="w-5 h-5" />
                  </div>
                  <strong className="text-base font-heading font-bold text-slate-900 block mb-1 group-hover:text-blue-700 transition-colors">
                    Institution graph
                  </strong>
                  <p className="text-xs text-slate-600 leading-relaxed font-body">
                    Explore multi-bureau complaint relationships for Aaravika Institute (inst-01).
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                  <span>View graph</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

            </div>

            {/* Bottom Reassurance Banner */}
            <div className="mt-10 pt-6 border-t border-blue-200/60 flex items-center justify-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Demonstration mode with verified AICTE synthetic cases</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
