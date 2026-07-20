import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface OptionSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

/**
 * The app's tactile dropdown: bordered trigger with offset shadow and rotating
 * chevron, plus a portaled option panel (orange active row with check mark).
 * Same design as the payer select in the expense modal and the paid-by filter.
 */
export function OptionSelect({ value, options, onChange, size = 'sm', disabled = false }: OptionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePos = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const selected = options.find(o => o.id === value);
  const triggerPadding = size === 'md' ? 'px-4 py-3' : 'px-3 py-2';

  return (
    <div className="flex-1 min-w-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-base font-bold text-main-text ${triggerPadding} border-2 border-main-text rounded-xl bg-white shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] transition-all ${disabled ? 'opacity-50 cursor-not-allowed shadow-none active:transform-none' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left">{selected?.label ?? ''}</span>
        <ChevronDown className={`w-4 h-4 stroke-[3] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && panelPos && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
          className="fixed z-[60] max-h-72 overflow-y-auto bg-white border-2 border-main-text rounded-xl shadow-[4px_4px_0px_#1A1A2E] p-1"
        >
          {options.map(o => {
            const isActive = o.id === value;
            const isDisabled = !isActive && !!o.disabled;
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={isDisabled}
                onClick={() => {
                  onChange(o.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-nunito font-black text-sm text-left transition-colors ${
                  isDisabled
                    ? 'text-main-text/30 cursor-not-allowed'
                    : isActive
                      ? 'bg-accent-orange text-white cursor-pointer'
                      : 'text-main-text hover:bg-brand-light cursor-pointer'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isActive && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
