const HAPTIC_DURATION_MS = 50;
const TACTILE_CLASS_HINT = 'active:translate-x-[1px]';

function isTactileButton(target: EventTarget | null): boolean {
  let el = target as Element | null;
  while (el && el !== document.body) {
    if (el.classList?.contains('btn-bounce')) return true;
    const cls = el.getAttribute?.('class');
    if (cls && cls.includes(TACTILE_CLASS_HINT)) return true;
    el = el.parentElement;
  }
  return false;
}

let installed = false;

export function installGlobalHaptic(): void {
  if (installed) return;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  installed = true;

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'touch') return;
      if (!isTactileButton(event.target)) return;
      navigator.vibrate(HAPTIC_DURATION_MS);
    },
    { passive: true, capture: true },
  );
}
