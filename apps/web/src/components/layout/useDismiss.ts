import { useEffect, type RefObject } from 'react';
// Closes an overlay on Escape or a pointer press outside the given elements.
export function useDismiss(
  open: boolean,
  onClose: () => void,
  inside: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!inside.some((r) => r.current?.contains(t))) onClose();
    };
    // Capture phase: an open menu takes Escape before an enclosing drawer or dialog sees it.
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, onClose, inside]);
}

// Keeps Tab inside a container (modal dialogs and the mobile drawer).
export function trapTab(e: React.KeyboardEvent, container: HTMLElement | null) {
  if (e.key !== 'Tab' || !container) return;
  const items = [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
