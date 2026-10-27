import { useState } from 'react';
import { Link } from 'react-router';
import { ShieldAlert, ArrowRight, AlertTriangle, UserCheck } from 'lucide-react';

export function ActionFirewallSection() {
  const [isCoordinated, setIsCoordinated] = useState(false);

  return (
    <section id="action-firewall" className="relative bg-slate-50 py-20 lg:py-28 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Section Header - Direct, No Eyebrow Pill */}
        <div className="max-w-3xl mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Stop duplicate notices before they reach institutions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-body leading-relaxed">
            When independent bureaus review the same institution, uncoordinated inquiries create confusion and repeated evidence burdens. CaseBridge checks proposed actions across bureau calendars to recommend joint proceedings.
          </p>
        </div>

        {/* Interactive Conflict Resolution Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          
          {/* Top Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Institution under review</span>
                <strong className="text-base font-heading font-bold text-slate-900">
                  Aaravika Institute of Engineering
                </strong>
              </div>
            </div>

            <div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                  isCoordinated
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isCoordinated ? 'Joint notice approved' : 'Duplicate notice detected'}
              </span>
            </div>
          </div>

          {/* 3-Column Visual: Bureau A | Collision Warning | Bureau B */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Bureau 01: PGRC Action */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-900">
                  AICTE Public Grievance Cell
                </span>
                <span className="text-[11px] font-mono-code bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  ACT-001
                </span>
              </div>
              <strong className="text-sm font-semibold text-slate-900 block mb-1">
                Evidence request: Q3 fee ledgers
              </strong>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Requesting complete admission fee accounts for July–September 2026 to verify unapproved cash collections.
              </p>
              <div className="text-[11px] text-slate-500">
                Due: Nov 5, 2026 · Status: In progress
              </div>
            </div>

            {/* Middle: Action Firewall Intercept Engine */}
            <div className="lg:col-span-4 rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white border border-amber-300 flex items-center justify-center mb-3 text-amber-700 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-900 block mb-1">
                Identical evidence requested
              </span>
              <p className="text-xs text-amber-800/90 leading-relaxed mb-4">
                Both bureaus are scheduling requests for the same fee ledgers within 48 hours of each other.
              </p>
              <button
                type="button"
                onClick={() => setIsCoordinated(!isCoordinated)}
                className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                  isCoordinated
                    ? 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {isCoordinated ? 'Reset demonstration' : 'Simulate joint notice approval'}
              </button>
            </div>

            {/* Bureau 02: Regional Bureau Action */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold text-slate-900">
                  AICTE Regional Bureau
                </span>
                <span className="text-[11px] font-mono-code bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  ACT-002
                </span>
              </div>
              <strong className="text-sm font-semibold text-slate-900 block mb-1">
                Evidence request: Q3 fee ledgers
              </strong>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Independent regional notice requesting identical July–September 2026 admission receipts.
              </p>
              <div className="text-[11px] text-slate-500">
                Due: Nov 7, 2026 · Status: Planned
              </div>
            </div>

          </div>

          {/* Outcome Explanation Banner */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-semibold text-slate-900 block">
                  {isCoordinated
                    ? 'Joint notice confirmed'
                    : 'Recommended action: Send a single joint information request'}
                </strong>
                <p className="text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                  {isCoordinated
                    ? 'PGRC and Regional Bureau officers approved a unified notice under ACT-001. A single inquiry is dispatched to Aaravika Institute while keeping independent bureau complaint IDs and case dispositions sovereign.'
                    : 'Instead of sending two conflicting demands, CaseBridge recommends a single joint request. This prevents duplicate paperwork for institutions while keeping human officers in complete command.'}
                </p>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1 shrink-0"
            >
              <span>View active alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
