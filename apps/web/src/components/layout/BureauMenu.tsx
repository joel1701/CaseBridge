import { Check, ChevronDown } from 'lucide-react';
import { BUREAUS, useBureau } from './BureauContext';
import { Menu, menuItemClass } from './Menu';

export function BureauMenu() {
  const { bureau, setBureau } = useBureau();
  const current = BUREAUS.find((b) => b.value === bureau)!;
  return (
    <Menu
      label={`Bureau: ${current.label}`}
      align="start"
      trigger={
        <>
          <span className="wide text-xs text-subtle">Bureau</span>
          <span>{current.label}</span>
          <ChevronDown size={14} aria-hidden="true" className="text-subtle" />
        </>
      }
    >
      {(close) =>
        BUREAUS.map((b) => (
          <button
            key={b.value}
            type="button"
            role="menuitemradio"
            aria-checked={b.value === bureau}
            onClick={() => {
              setBureau(b.value);
              close();
            }}
            className={menuItemClass}
          >
            <Check
              size={16}
              aria-hidden="true"
              className={b.value === bureau ? 'text-indigo-hi' : 'invisible'}
            />
            {b.label}
          </button>
        ))
      }
    </Menu>
  );
}
