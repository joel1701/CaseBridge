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
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`relative flex items-center justify-center rounded-lg border transition-transform duration-200 group-hover:scale-105 ${iconSizes[size]} ${
          isLight
            ? 'bg-[#222222] border-[#333333] text-white shadow-sm'
            : 'bg-[#171717] border-[#262626] text-white shadow-sm'
        }`}
      >
        {/* Architectural Bridge and Keystone Glyph */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          {/* Bridge Base Piers */}
          <path
            d="M6 24V19C6 15.6863 8.68629 13 12 13H20C23.3137 13 26 15.6863 26 19V24"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Deck Cable Span */}
          <path
            d="M5 10H27"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Lavender Keystone Pivot */}
          <rect x="13.5" y="7" width="5" height="5" rx="1" fill="#A88BFF" />
          {/* Mint Equilibrium Indicator */}
          <circle cx="16" cy="18" r="2.2" fill="#45E3AE" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-semibold tracking-tight leading-none ${textSizes[size]} ${
              isLight ? 'text-white' : 'text-[#171717]'
            }`}
          >
            Case
            <span className="font-serif-editorial italic font-normal">
              Bridge
            </span>
          </span>
          <span
            className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
              isLight
                ? 'bg-[#2b2b2b] text-[#A88BFF] border border-[#3b3b3b]'
                : 'bg-[#F0EBFF] text-[#5B3EBD] border border-[#D8CEFD]'
            }`}
          >
            v0.1
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] tracking-wider uppercase font-medium mt-0.5 ${
              isLight ? 'text-[#888888]' : 'text-[#666662]'
            }`}
          >
            Intake & Legal-Aid Intelligence
          </span>
        )}
      </div>
    </div>
  );
}
