import { FileText, AlertTriangle, GitMerge, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Preserve the complaint verbatim',
      description:
        'Grievances arrive in the student or parent’s own words. CaseBridge preserves the full submission without alterations, keeping original bureau reference numbers intact.',
      benefit:
        'Original complaint IDs remain sovereign without forced renumbering or merging.',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Surface missing proof early',
      description:
        'Instead of guessing facts, CaseBridge highlights absent documentation—such as missing fee vouchers, unadvertised faculty circulars, or uncorroborated dates.',
      benefit:
        'Officers receive a clear checklist of missing proof before speaking with complainants.',
      icon: AlertTriangle,
    },
    {
      number: '3',
      title: 'Coordinate before sending notices',
      description:
        'Before dispatching an evidence demand or inspection summons, the system checks sister-bureau calendars. If another desk is already investigating the same institution, CaseBridge recommends a joint inquiry.',
      benefit:
        'Prevents contradictory deadlines and reduces duplicate paperwork for institutions.',
      icon: GitMerge,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative bg-white py-20 lg:py-28 border-b border-slate-100"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Direct Section Heading - No Eyebrow Pill */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            From complaint to coordinated action.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-body leading-relaxed">
            How AICTE Public Grievance Redressal Cell and Regional Bureau
            officers move from raw intake to verified next steps.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-8 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-100">
                      {step.number}
                    </div>
                    <Icon
                      className="h-5 w-5 text-blue-700"
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 font-body leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Practical Outcome */}
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-medium text-slate-900">
                    Practical outcome:{' '}
                  </span>
                  <span>{step.benefit}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bureau Queue Routing Link */}
        <div className="mt-12 text-center">
          <Link
            to="/bureau-queue"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
          >
            <span>Review active cases across bureau queues</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
