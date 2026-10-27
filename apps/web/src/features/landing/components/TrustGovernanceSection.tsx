import { ShieldCheck, UserCheck, AlertCircle, Database } from 'lucide-react';

export function TrustGovernanceSection() {
  const principles = [
    {
      title: 'Human officers make every decision',
      description:
        'CaseBridge provides assistive summaries and conflict alerts. It never makes automated legal determinations, issues regulatory sanctions, or closes complaints without authorized human approval.',
      icon: UserCheck,
    },
    {
      title: 'Bureaus keep independent jurisdiction',
      description:
        'Complaints are never forcibly merged or transferred between bureaus. PGRC and Regional Bureau retain their sovereign complaint IDs, independent timelines, and dedicated officer queues.',
      icon: ShieldCheck,
    },
    {
      title: 'Flags missing facts instead of guessing',
      description:
        'When receipts, dates, or circulars are missing, CaseBridge explicitly highlights what is absent rather than guessing or inferring certainty, preventing premature conclusions.',
      icon: AlertCircle,
    },
    {
      title: 'Tested on verified synthetic cases',
      description:
        'The platform is evaluated against 25 categorized synthetic grievances, 10 fictional institutions, and 5 documented benchmark scenarios to ensure explainable linking and false-positive rejection.',
      icon: Database,
    },
  ];

  return (
    <section id="governance" className="relative bg-white py-20 lg:py-28 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Section Header - Direct, No Eyebrow Pill */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Built for officer discretion, not automated decisions.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-body leading-relaxed">
            Regulatory reviews carry high legal stakes. CaseBridge is strictly designed as an assistive tool that keeps human officers in control.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-blue-700 shadow-2xs shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
                      {p.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-body">
                      {p.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
