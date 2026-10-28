interface BrandMarkProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function BrandMark({
  variant = 'dark',
  size = 'md',
  showSubtitle = true,
}: BrandMarkProps) {
  const isLight = variant === 'light';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Friendly Geometric Coordinate Bridge Icon */}
      <div
        className={`flex items-center justify-center rounded-lg border transition-colors ${iconSizes[size]} ${
          isLight
            ? 'bg-slate-800 border-slate-700 text-blue-400'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          aria-hidden="true"
        >
          {/* Bridge arch */}
          <path
            d="M4 18V14C4 10.6863 6.68629 8 10 8H14C17.3137 8 20 10.6863 20 14V18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Deck baseline */}
          <path
            d="M3 18H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Central coordination pivot */}
          <circle cx="12" cy="8" r="2.5" fill="#2563EB" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-heading tracking-tight leading-none ${textSizes[size]} ${
              isLight ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span className="font-extrabold text-slate-900 dark:text-white">
              Case
            </span>
            <span className="font-bold text-blue-700">Bridge</span>
          </span>
          <span
            className={`text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded ${
              isLight
                ? 'bg-slate-800 text-blue-300 border border-slate-700'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            AICTE Demo
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[11px] font-body tracking-normal mt-0.5 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            AICTE grievance coordination
          </span>
        )}
      </div>
    </div>
  );
}
