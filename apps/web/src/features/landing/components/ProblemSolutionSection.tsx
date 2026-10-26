export function ProblemSolutionSection() {
  return (
    <section
      id="problem-solution"
      className="relative bg-white py-20 md:py-32 border-b border-[#E8E6DF]"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Section Tag */}
        <div className="text-center mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-[#71706A] bg-[#F3F3F1] border border-[#E5E5E0] px-3.5 py-1 rounded-full">
            The Intake Dilemma & The Bridge
          </span>
        </div>

        {/* Editorial Headline */}
        <h2 className="font-serif-editorial text-3xl sm:text-5xl md:text-6xl text-[#171717] font-normal tracking-tight text-center max-w-4xl mx-auto leading-[1.12]">
          Important details{' '}
          <span className="relative inline-block">
            <span className="bg-[#FFD600] text-[#171717] px-2.5 py-0.5 rounded-none font-normal italic">
              shouldn't get lost
            </span>
          </span>{' '}
          in the paperwork.
        </h2>

        {/* Editorial Text */}
        <div className="mt-8 text-center max-w-3xl mx-auto space-y-4 text-base sm:text-lg text-[#4A4A46] font-sans-ui leading-relaxed">
          <p>
            When students, families, or applicants submit complaints during a
            crisis, their words rarely conform to rigid bureaucratic checkboxes.
            They bring raw, emotional, unstructured narratives spanning multiple
            pages, disparate dates, unreceipted cash transactions, and scattered
            recollections.
          </p>
          <p className="text-[#666662] text-base">
            For overworked intake officers across different bureaus, parsing
            these accounts takes hours. Critical deadlines slip past,
            evidentiary holes go unnoticed until it's too late, and sister
            bureaus independently open duplicate investigations against the same
            institution.
          </p>
        </div>

        {/* Original Line Illustration: Messy Narrative Becoming an Organized Case Record */}
        <div className="mt-14 p-6 sm:p-10 rounded-2xl bg-[#FFFCF0] border border-[#E8E6DF] shadow-xs">
          <div className="text-center mb-8">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8A8983]">
              Figure 1.0 — Verbatim Narrative Normalization Architecture
            </span>
          </div>

          {/* Bespoke Responsive Vector Graphic */}
          <div className="w-full max-w-4xl mx-auto">
            <svg
              viewBox="0 0 860 340"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-xs"
              aria-label="Illustration depicting messy narrative text resolving into structured case record cards"
              role="img"
            >
              {/* Left Column: Unstructured Raw Narrative Cluster */}
              <g id="unstructured-input">
                <rect
                  x="20"
                  y="30"
                  width="240"
                  height="280"
                  rx="12"
                  fill="#FFFFFF"
                  stroke="#DCDAD0"
                  strokeWidth="1.5"
                />
                <rect
                  x="36"
                  y="46"
                  width="70"
                  height="14"
                  rx="4"
                  fill="#F3F3F1"
                />
                <text
                  x="42"
                  y="57"
                  fill="#71706A"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  RAW NARRATIVE
                </text>

                {/* Chaotic, tangled narrative lines & notes */}
                <path
                  d="M36 80 C80 75, 110 92, 170 82 C200 78, 220 85, 238 80"
                  stroke="#B0AEA5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M36 102 C60 106, 120 95, 160 105 C190 112, 210 98, 238 102"
                  stroke="#171717"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M36 124 C90 130, 140 115, 210 126 C225 128, 235 122, 238 124"
                  stroke="#B0AEA5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Highlighted Emotional Snippets in messy box */}
                <rect
                  x="36"
                  y="142"
                  width="186"
                  height="42"
                  rx="6"
                  fill="#FFF9ED"
                  stroke="#FFE0A3"
                  strokeWidth="1"
                />
                <text
                  x="44"
                  y="158"
                  fill="#8A4F00"
                  fontSize="9"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  "demanded ₹45,000 cash... no receipt..."
                </text>
                <text
                  x="44"
                  y="172"
                  fill="#A86800"
                  fontSize="8"
                  fontFamily="sans-serif"
                >
                  verbal threat of admission cancellation
                </text>

                {/* Tangled connecting strands spilling out */}
                <path
                  d="M36 200 C80 205, 130 195, 238 202"
                  stroke="#B0AEA5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M36 222 C70 218, 140 230, 200 220"
                  stroke="#B0AEA5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M36 244 C90 250, 150 240, 238 245"
                  stroke="#171717"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <circle cx="210" cy="275" r="3" fill="#FF5A0A" />
                <text
                  x="40"
                  y="278"
                  fill="#8C8B85"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  Missing dates & unverified slips
                </text>
              </g>

              {/* Center Transition: The CaseBridge Transformation Prism */}
              <g id="transformation-funnel">
                {/* Flow lines converging into prism */}
                <path
                  d="M260 110 C310 110, 330 140, 360 150"
                  stroke="#A88BFF"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <path
                  d="M260 170 C300 170, 320 170, 355 170"
                  stroke="#171717"
                  strokeWidth="2"
                />
                <path
                  d="M260 230 C310 230, 330 200, 360 190"
                  stroke="#45E3AE"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Central Bridge Prism Hexagon */}
                <rect
                  x="365"
                  y="105"
                  width="130"
                  height="130"
                  rx="16"
                  fill="#171717"
                  stroke="#333333"
                  strokeWidth="2"
                />
                <rect
                  x="385"
                  y="125"
                  width="90"
                  height="20"
                  rx="4"
                  fill="#A88BFF"
                />
                <text
                  x="400"
                  y="138"
                  fill="#171717"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  CASEBRIDGE
                </text>

                <text
                  x="382"
                  y="165"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  Semantic Parser
                </text>
                <text
                  x="382"
                  y="180"
                  fill="#45E3AE"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  + Gap Surfacing
                </text>
                <text
                  x="382"
                  y="195"
                  fill="#B3B0A6"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  + Action Firewall
                </text>

                <circle cx="430" cy="216" r="4" fill="#45E3AE" />

                {/* Radiating structured paths toward the right */}
                <path
                  d="M495 140 C525 140, 545 80, 580 80"
                  stroke="#171717"
                  strokeWidth="2"
                />
                <path
                  d="M495 160 C530 160, 545 150, 580 150"
                  stroke="#A88BFF"
                  strokeWidth="2"
                />
                <path
                  d="M495 180 C530 180, 545 220, 580 220"
                  stroke="#FFD600"
                  strokeWidth="2"
                />
                <path
                  d="M495 200 C525 200, 545 280, 580 280"
                  stroke="#45E3AE"
                  strokeWidth="2"
                />
              </g>

              {/* Right Column: Clean Structured Reviewable Cards */}
              <g id="structured-output">
                {/* Card 1: Key Issue & Category */}
                <rect
                  x="585"
                  y="45"
                  width="250"
                  height="58"
                  rx="8"
                  fill="#FFFFFF"
                  stroke="#DCDAD0"
                  strokeWidth="1.5"
                />
                <rect
                  x="597"
                  y="55"
                  width="46"
                  height="13"
                  rx="3"
                  fill="#F0EBFF"
                />
                <text
                  x="602"
                  y="64"
                  fill="#5B3EBD"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  FEES
                </text>
                <text
                  x="650"
                  y="64"
                  fill="#71706A"
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  Unapproved Caution Money
                </text>
                <text
                  x="597"
                  y="86"
                  fill="#171717"
                  fontSize="10.5"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  ₹45,000 Unauthorised Deposit
                </text>

                {/* Card 2: Dates & Parties */}
                <rect
                  x="585"
                  y="115"
                  width="250"
                  height="58"
                  rx="8"
                  fill="#FFFFFF"
                  stroke="#DCDAD0"
                  strokeWidth="1.5"
                />
                <rect
                  x="597"
                  y="125"
                  width="60"
                  height="13"
                  rx="3"
                  fill="#EAEAEA"
                />
                <text
                  x="602"
                  y="134"
                  fill="#171717"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  OCT 1, 2026
                </text>
                <text
                  x="664"
                  y="134"
                  fill="#71706A"
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  Aaravika Institute (inst-01)
                </text>
                <text
                  x="597"
                  y="156"
                  fill="#171717"
                  fontSize="10.5"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  30 Complainants · Preserved Bureau ID
                </text>

                {/* Card 3: Explicit Information Gaps */}
                <rect
                  x="585"
                  y="185"
                  width="250"
                  height="58"
                  rx="8"
                  fill="#FFFBF0"
                  stroke="#FFE0A3"
                  strokeWidth="1.5"
                />
                <rect
                  x="597"
                  y="195"
                  width="76"
                  height="13"
                  rx="3"
                  fill="#FFEABF"
                />
                <text
                  x="602"
                  y="204"
                  fill="#8A4F00"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  MISSING FACTS
                </text>
                <text
                  x="597"
                  y="226"
                  fill="#8A4F00"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  ⚠ No official fee receipt attached
                </text>

                {/* Card 4: Action Firewall Recommendation */}
                <rect
                  x="585"
                  y="255"
                  width="250"
                  height="58"
                  rx="8"
                  fill="#F0FAF6"
                  stroke="#BCEEDB"
                  strokeWidth="1.5"
                />
                <rect
                  x="597"
                  y="265"
                  width="90"
                  height="13"
                  rx="3"
                  fill="#45E3AE"
                />
                <text
                  x="602"
                  y="274"
                  fill="#0A3D2B"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ACTION FIREWALL
                </text>
                <text
                  x="597"
                  y="296"
                  fill="#0A3D2B"
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  ✓ Coordinate with sister bureau RB
                </text>
              </g>
            </svg>
          </div>

          {/* Editorial Three-Step Summary Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-8 border-t border-[#E8E6DF]">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#171717] text-white flex items-center justify-center text-xs font-mono font-bold">
                1
              </span>
              <div>
                <h4 className="text-sm font-semibold text-[#171717]">
                  Preserves Every Word
                </h4>
                <p className="mt-1 text-xs text-[#555550] leading-normal">
                  The original statement is sealed and immutable. Caseworkers
                  can verify every extracted field directly against the
                  applicant's raw text.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#A88BFF] text-[#171717] flex items-center justify-center text-xs font-mono font-bold">
                2
              </span>
              <div>
                <h4 className="text-sm font-semibold text-[#171717]">
                  Explicitly Surfaces Gaps
                </h4>
                <p className="mt-1 text-xs text-[#555550] leading-normal">
                  Instead of hallucinating missing receipts or assuming dates,
                  CaseBridge highlights unanswered questions for the caseworker
                  to ask.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#45E3AE] text-[#171717] flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>
              <div>
                <h4 className="text-sm font-semibold text-[#171717]">
                  Action Firewall Protection
                </h4>
                <p className="mt-1 text-xs text-[#555550] leading-normal">
                  Prevents duplicate inquiries and conflicting notices across
                  separate bureaus before formal institutional communications
                  are issued.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
