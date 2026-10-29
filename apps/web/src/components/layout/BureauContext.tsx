import { createContext, useContext, useState, type ReactNode } from 'react';

export const BUREAUS = [
  { value: 'ALL', label: 'All bureaus' },
  { value: 'RB', label: 'RB' },
  { value: 'PGRC', label: 'PGRC' },
  { value: 'OTHER', label: 'Other' },
] as const;
export type BureauFilter = (typeof BUREAUS)[number]['value'];

const KEY = 'setu.bureau';
const BureauContext = createContext<{
  bureau: BureauFilter;
  setBureau: (b: BureauFilter) => void;
} | null>(null);

function initial(): BureauFilter {
  try {
    const v = sessionStorage.getItem(KEY);
    if (BUREAUS.some((b) => b.value === v)) return v as BureauFilter;
  } catch {
    // storage unavailable
  }
  return 'ALL';
}

// Bureau scope chosen in the header. Pages read it with useBureau(); nothing filters on it yet.
export function BureauProvider({ children }: { children: ReactNode }) {
  const [bureau, setState] = useState<BureauFilter>(initial);
  const setBureau = (b: BureauFilter) => {
    setState(b);
    try {
      sessionStorage.setItem(KEY, b);
    } catch {
      // storage unavailable
    }
  };
  return (
    <BureauContext.Provider value={{ bureau, setBureau }}>
      {children}
    </BureauContext.Provider>
  );
}

export function useBureau() {
  const ctx = useContext(BureauContext);
  if (!ctx) throw new Error('useBureau must be used inside BureauProvider');
  return ctx;
}
