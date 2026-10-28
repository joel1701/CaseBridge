import { Link } from 'react-router';
import { BrandMark } from './BrandMark';
import { Github, ExternalLink, ArrowUp } from 'lucide-react';

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Mission Briefing (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <BrandMark variant="light" size="md" />
            <p className="text-xs text-slate-400 leading-relaxed font-body max-w-sm mt-3">
              CaseBridge helps AICTE Public Grievance Redressal Cell and
              Regional Bureau officers review complex student complaints,
              identify missing evidence, and coordinate pre-notice actions.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://github.com/joel1701/CaseBridge"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 text-xs rounded-lg transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <span className="text-xs text-slate-400 font-medium">
                Team Aarohan · SIH26264
              </span>
            </div>
          </div>

          {/* Working Workspace Screens (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-semibold text-white block font-heading">
              Workspace screens
            </span>
            <ul className="space-y-2 text-xs font-body">
              <li>
                <Link
                  to="/investigations/cmp-001"
                  className="hover:text-white transition-colors flex items-center justify-between py-1 border-b border-slate-800"
                >
                  <span>Investigation workspace (cmp-001)</span>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    /investigations/cmp-001
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-white transition-colors flex items-center justify-between py-1 border-b border-slate-800"
                >
                  <span>Coordination dashboard</span>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    /dashboard
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/graph/inst-01"
                  className="hover:text-white transition-colors flex items-center justify-between py-1 border-b border-slate-800"
                >
                  <span>Knowledge graph (inst-01)</span>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    /graph/inst-01
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/bureau-queue"
                  className="hover:text-white transition-colors flex items-center justify-between py-1 border-b border-slate-800"
                >
                  <span>Bureau triage queue</span>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    /bureau-queue
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Regulatory Bureau Governance (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-semibold text-white block font-heading">
              Participating bureaus
            </span>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2 font-body">
              <span className="font-semibold text-white block">
                AICTE Desks:
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                • Public Grievance Redressal Cell (PGRC)
                <br />• Regional Bureau (RB)
              </p>
              <div className="pt-2 border-t border-slate-700 text-[11px] text-blue-400 font-medium">
                Mandatory human officer authorization
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400 font-body text-center sm:text-left">
            CaseBridge · Team Aarohan. Assistive regulatory triage prototype;
            all determinations remain with authorized officers.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            aria-label="Scroll to top of page"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
