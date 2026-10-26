import { Link } from 'react-router';
import { BrandMark } from './BrandMark';
import { ArrowUp, Github, ExternalLink } from 'lucide-react';

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden bg-[#171717] text-white pt-20 pb-16">
      {/* Decorative Oversized Lavender Bridge Arch Vector in the Background */}
      <div
        className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 w-[900px] h-[360px] opacity-[0.06] select-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 900 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M50 340 C200 120, 700 120, 850 340"
            stroke="#A88BFF"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            d="M150 340 C280 180, 620 180, 750 340"
            stroke="#A88BFF"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <rect x="420" y="80" width="60" height="60" rx="12" fill="#A88BFF" />
          <line
            x1="250"
            y1="210"
            x2="250"
            y2="340"
            stroke="#A88BFF"
            strokeWidth="8"
          />
          <line
            x1="350"
            y1="165"
            x2="350"
            y2="340"
            stroke="#A88BFF"
            strokeWidth="8"
          />
          <line
            x1="450"
            y1="150"
            x2="450"
            y2="340"
            stroke="#A88BFF"
            strokeWidth="8"
          />
          <line
            x1="550"
            y1="165"
            x2="550"
            y2="340"
            stroke="#A88BFF"
            strokeWidth="8"
          />
          <line
            x1="650"
            y1="210"
            x2="650"
            y2="340"
            stroke="#A88BFF"
            strokeWidth="8"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#2B2B2B]">
          {/* Brand & Description Column */}
          <div className="lg:col-span-5 space-y-5">
            <BrandMark variant="light" size="lg" />
            <p className="text-sm text-[#A8A8A2] font-sans-ui max-w-sm leading-relaxed">
              CaseBridge is an open foundation for authorized cross-bureau
              complaint investigation, explainable matching, and Action Firewall
              coordination. Built for Team Aarohan.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="https://github.com/joel1701/CaseBridge"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#242424] hover:bg-[#333333] border border-[#383838] px-3.5 py-2 text-xs font-semibold text-white transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-[#777777]" />
              </a>
              <span className="text-xs text-[#777777] font-mono">
                SIH26264 · AICTE
              </span>
            </div>
          </div>

          {/* Navigation Links Column */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A88BFF]">
              Overview
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#how-it-works"
                  className="text-[#B5B5B0] hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-[#B5B5B0] hover:text-white transition-colors"
                >
                  Product Showcase
                </a>
              </li>
              <li>
                <a
                  href="#benefits"
                  className="text-[#B5B5B0] hover:text-white transition-colors"
                >
                  Key Capabilities
                </a>
              </li>
              <li>
                <a
                  href="#audiences"
                  className="text-[#B5B5B0] hover:text-white transition-colors"
                >
                  For Caseworkers
                </a>
              </li>
              <li>
                <a
                  href="#trust"
                  className="text-[#B5B5B0] hover:text-white transition-colors"
                >
                  Trust & Oversight
                </a>
              </li>
            </ul>
          </div>

          {/* Application Workspaces Column */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#45E3AE]">
              Workspace Routes
            </span>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/dashboard"
                  className="text-[#B5B5B0] hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Coordination Dashboard</span>
                  <span className="text-[10px] font-mono text-[#666666] group-hover:text-white">
                    /dashboard
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/complaints"
                  className="text-[#B5B5B0] hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Complaints Repository</span>
                  <span className="text-[10px] font-mono text-[#666666] group-hover:text-white">
                    /complaints
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/bureau-queue"
                  className="text-[#B5B5B0] hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Bureau Work Queue</span>
                  <span className="text-[10px] font-mono text-[#666666] group-hover:text-white">
                    /bureau-queue
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/graph/inst-01"
                  className="text-[#B5B5B0] hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Knowledge Graph</span>
                  <span className="text-[10px] font-mono text-[#666666] group-hover:text-white">
                    /graph/:id
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-[#B5B5B0] hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Officer Sign In</span>
                  <span className="text-[10px] font-mono text-[#666666] group-hover:text-white">
                    /login
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Back to top Column */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E8E6DF]">
              Governance
            </span>
            <p className="text-xs text-[#888882] leading-relaxed">
              Human review required before action. No automatic sanctions or
              legal dispositions.
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#383838] bg-[#222222] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#2e2e2e] transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#73736E]">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 CaseBridge · Team Aarohan.</span>
            <span>·</span>
            <span>SIH26264 Prototype Foundation.</span>
            <span>·</span>
            <span className="text-[#8F8F8A]">
              All included sample records are synthetic.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="hover:text-white transition-colors"
            >
              App Portal
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Officer Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
