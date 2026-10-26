import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function WhoItsForSection() {
  const audiences = [
    {
      title: 'Legal Aid Organizations',
      role: 'Intended Audience 01',
      badge: 'Intake Triage',
      badgeColor: 'bg-[#F0EBFF] text-[#5B3EBD] border-[#D8CEFD]',
      description:
        'Organize high-volume incoming requests for review. Triage distressing or poorly documented initial intakes with standardized summaries and auditable fact logs.',
      points: [
        'Rapid initial triage without discarding applicant context',
        'Standardized intake memos for pro-bono attorneys',
        'Audit-ready record keeping with immutable source text',
      ],
      illustration: (
        <svg
          viewBox="0 0 320 160"
          fill="none"
          className="w-full h-auto"
          aria-hidden="true"
        >
          {/* Background grid */}
          <rect width="320" height="160" rx="8" fill="#FAF9F5" />
          <path
            d="M0 40H320M0 80H320M0 120H320"
            stroke="#EAE8E0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Main Case Dossier Card */}
          <rect
            x="30"
            y="25"
            width="260"
            height="110"
            rx="6"
            fill="#FFFFFF"
            stroke="#DCDAD0"
            strokeWidth="1.2"
          />
          {/* Dossier Header */}
          <rect x="45" y="40" width="70" height="12" rx="3" fill="#A88BFF" />
          <rect x="125" y="42" width="60" height="8" rx="2" fill="#E8E6DF" />
          <circle cx="270" cy="46" r="5" fill="#45E3AE" />
          {/* Narrative Line items */}
          <rect x="45" y="65" width="230" height="6" rx="2" fill="#171717" />
          <rect x="45" y="78" width="180" height="6" rx="2" fill="#B0AEA5" />
          <rect x="45" y="91" width="210" height="6" rx="2" fill="#B0AEA5" />
          {/* Triage Stamp */}
          <rect
            x="180"
            y="108"
            width="95"
            height="16"
            rx="3"
            fill="#F3F3F1"
            stroke="#D5D3CB"
          />
          <text
            x="188"
            y="119"
            fill="#171717"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            TRIAGE: REVIEWED
          </text>
        </svg>
      ),
    },
    {
      title: 'Caseworkers & Intake Teams',
      role: 'Intended Audience 02',
      badge: 'Frontline Practice',
      badgeColor: 'bg-[#E8FAF4] text-[#1B664B] border-[#BCEEDB]',
      description:
        'Identify key details and unresolved questions before the interview. Spot deadlines, disputed sums, and missing documents before sitting down with the applicant.',
      points: [
        'Pre-interview gap checklist surfaces what proof is missing',
        'Extracts statutory timelines and imminent expiry dates',
        'Reduces repeated intake appointments for missing papers',
      ],
      illustration: (
        <svg
          viewBox="0 0 320 160"
          fill="none"
          className="w-full h-auto"
          aria-hidden="true"
        >
          <rect width="320" height="160" rx="8" fill="#FAF9F5" />
          {/* Caseworker Checklist Clipboard */}
          <rect
            x="40"
            y="20"
            width="150"
            height="120"
            rx="6"
            fill="#FFFFFF"
            stroke="#DCDAD0"
            strokeWidth="1.2"
          />
          {/* Clip */}
          <rect x="95" y="14" width="40" height="12" rx="3" fill="#171717" />
          {/* Checklist items */}
          <circle cx="58" cy="45" r="4" fill="#45E3AE" />
          <rect x="70" y="42" width="100" height="6" rx="2" fill="#171717" />
          <circle cx="58" cy="65" r="4" fill="#45E3AE" />
          <rect x="70" y="62" width="80" height="6" rx="2" fill="#171717" />
          <circle cx="58" cy="85" r="4" fill="#FFD600" />
          <rect x="70" y="82" width="90" height="6" rx="2" fill="#71706A" />
          <circle cx="58" cy="105" r="4" fill="#FF5A0A" />
          <rect x="70" y="102" width="70" height="6" rx="2" fill="#71706A" />
          {/* Gap Indicator Card Floating on Right */}
          <rect
            x="205"
            y="45"
            width="85"
            height="70"
            rx="6"
            fill="#FFF9ED"
            stroke="#FFE0A3"
            strokeWidth="1"
          />
          <text
            x="215"
            y="62"
            fill="#8A4F00"
            fontSize="8"
            fontFamily="sans-serif"
            fontWeight="bold"
          >
            GAP DETECTED
          </text>
          <text
            x="215"
            y="76"
            fill="#A86800"
            fontSize="7"
            fontFamily="sans-serif"
          >
            Missing Fee Receipt
          </text>
          <rect x="215" y="88" width="65" height="14" rx="3" fill="#FFD600" />
          <text
            x="221"
            y="98"
            fill="#171717"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            ASK APPLICANT
          </text>
        </svg>
      ),
    },
    {
      title: 'Community Support Services',
      role: 'Intended Audience 03',
      badge: 'Inter-Agency Referral',
      badgeColor: 'bg-[#FFF9EE] text-[#8A4F00] border-[#FFE2B3]',
      description:
        'Prepare clearer, more consistent handoffs when referring clients to specialized legal clinics, public ombudsmen, or regulatory oversight bodies.',
      points: [
        'Eliminates garbled second-hand referrals and lost facts',
        'Standardized handoff structure respected across partner agencies',
        'Prevents applicants from having to recount trauma repeatedly',
      ],
      illustration: (
        <svg
          viewBox="0 0 320 160"
          fill="none"
          className="w-full h-auto"
          aria-hidden="true"
        >
          <rect width="320" height="160" rx="8" fill="#FAF9F5" />
          {/* Two Nodes connected by a bridge */}
          <rect
            x="25"
            y="45"
            width="85"
            height="70"
            rx="6"
            fill="#FFFFFF"
            stroke="#DCDAD0"
            strokeWidth="1.2"
          />
          <text
            x="35"
            y="65"
            fill="#71706A"
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            COMMUNITY
          </text>
          <rect x="35" y="75" width="65" height="5" rx="2" fill="#171717" />
          <rect x="35" y="86" width="50" height="5" rx="2" fill="#B0AEA5" />

          {/* Central Connecting Bridge Span */}
          <path
            d="M110 80 H210"
            stroke="#171717"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
          <circle cx="160" cy="80" r="14" fill="#A88BFF" />
          <path
            d="M155 76L164 80L155 84"
            stroke="#171717"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Receiving Agency Node */}
          <rect
            x="210"
            y="45"
            width="85"
            height="70"
            rx="6"
            fill="#FFFFFF"
            stroke="#DCDAD0"
            strokeWidth="1.2"
          />
          <text
            x="220"
            y="65"
            fill="#71706A"
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            LEGAL AID
          </text>
          <rect x="220" y="75" width="65" height="5" rx="2" fill="#45E3AE" />
          <rect x="220" y="86" width="55" height="5" rx="2" fill="#171717" />
          <text
            x="220"
            y="103"
            fill="#285A48"
            fontSize="6.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            CLEAN HANDOFF
          </text>
        </svg>
      ),
    },
  ];

  return (
    <section
      id="audiences"
      className="relative bg-[#FFFCF0] py-20 md:py-32 border-b border-[#E8E6DF]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD0] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#171717] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#A88BFF]" />
            Intended Audiences
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-[#171717] tracking-tight">
            Who CaseBridge Is Built For
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#555550] font-sans-ui">
            Tailored for organizations managing high-stakes client narratives
            where accuracy, transparency, and human discretion are paramount.
          </p>
        </div>

        {/* 3-Column Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {audiences.map((aud, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[#DCDAD0] bg-white p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Visual Header */}
                <div className="rounded-xl overflow-hidden border border-[#EAE8E0] mb-6">
                  {aud.illustration}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-[#8C8B85] uppercase tracking-wider">
                    {aud.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${aud.badgeColor}`}
                  >
                    {aud.badge}
                  </span>
                </div>

                <h3 className="font-serif-editorial text-2xl font-normal text-[#171717]">
                  {aud.title}
                </h3>

                <p className="mt-3 text-sm text-[#4A4A46] font-sans-ui leading-relaxed">
                  {aud.description}
                </p>

                <ul className="mt-5 space-y-2 text-xs text-[#5E5D57] border-t border-[#F0EFEA] pt-4">
                  {aud.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#171717] font-bold mt-0.5">✓</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[#F0EFEA]">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#171717] hover:text-[#5B3EBD] group"
                >
                  <span>Explore Workflow</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Explanatory Footer Pill */}
        <div className="mt-12 text-center text-xs text-[#71706A]">
          <span>
            Note: Listed above as target public interest applications; not an
            endorsement or formal contract with named entities.
          </span>
        </div>
      </div>
    </section>
  );
}
