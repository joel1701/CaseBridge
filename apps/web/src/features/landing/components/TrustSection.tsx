import {
  ShieldCheck,
  Eye,
  FileSearch,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export function TrustSection() {
  const pillars = [
    {
      icon: Eye,
      title: 'Reviewable Structured Outputs',
      description:
        'Every extracted date, institution entity, and category is linked directly back to citations in the underlying narrative. Caseworkers can hover and inspect the source testimony at any time.',
      highlight: 'Every claim grounded in text',
    },
    {
      icon: AlertTriangle,
      title: 'Explicit Visibility into Missing Info',
      description:
        'Rather than synthesizing probable dates or assuming fees were paid, CaseBridge flags absence with yellow gap indicators—preventing premature decisions built on unverified assumptions.',
      highlight: 'Zero speculative hallucinations',
    },
    {
      icon: FileSearch,
      title: 'Preservation of the Original Narrative',
      description:
        'The original intake narrative is never overwritten, compressed, or discarded. Both the raw source document and the structured summary live side-by-side throughout the case lifecycle.',
      highlight: 'Source record remains immutable',
    },
    {
      icon: UserCheck,
      title: 'Strict Human-in-the-Loop Governance',
      description:
        'CaseBridge includes no automated sanctions, penalty decisions, or case dispositions. The Action Firewall alerts officers to cross-bureau conflicts, but every coordination decision requires an authorized human officer.',
      highlight: 'Human caseworker holds final authority',
    },
  ];

  return (
    <section
      id="trust"
      className="relative bg-[#F3F3F1] py-20 md:py-32 border-b border-[#E8E6DF]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDAD0] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#171717] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#171717]" />
            Human-in-the-Loop Architecture
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-normal text-[#171717] tracking-tight">
            Trust, Transparency, and Human Oversight
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#555550] font-sans-ui">
            Legal-aid decisions impact lives. CaseBridge is strictly designed as
            an assistive review instrument—not an autonomous arbiter.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-[#DCDAD0] bg-white p-7 sm:p-8 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-[#F8F7F3] border border-[#E5E5E0] text-[#171717]">
                      <Icon className="w-5 h-5 text-[#171717]" />
                    </div>
                    <span className="text-[11px] font-mono text-[#5B3EBD] bg-[#F0EBFF] px-2.5 py-1 rounded-md font-semibold">
                      {pillar.highlight}
                    </span>
                  </div>

                  <h3 className="font-serif-editorial text-2xl font-normal text-[#171717]">
                    {pillar.title}
                  </h3>

                  <p className="mt-3 text-sm text-[#4A4A46] font-sans-ui leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F0EFEA] flex items-center justify-between text-xs text-[#71706A]">
                  <span className="font-mono text-[10px]">
                    Guaranteed In Architecture
                  </span>
                  <span className="text-[#285A48] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#285A48]" />
                    Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Boundary Disclosure */}
        <div className="mt-12 rounded-xl bg-[#FAF9F5] border border-[#E5E2D8] p-6 text-xs text-[#5E5D57] leading-relaxed max-w-4xl mx-auto">
          <strong className="text-[#171717] font-semibold block mb-1">
            System Tenancy & Boundary Notice:
          </strong>
          CaseBridge operates strictly within authorized bureau scopes (OFFICER,
          BUREAU_HEAD, and ADMIN roles). Cross-bureau visibility is an explicit,
          audited operational policy, not a default side-effect of login. No
          live evidence uploads or autonomous court filings are conducted by
          this service.
        </div>
      </div>
    </section>
  );
}
