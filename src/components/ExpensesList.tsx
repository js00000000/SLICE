import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Receipt, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense } from '../types';
import { useGroup } from '../contexts/GroupContext';
import { ExpenseItem } from './ExpenseItem';
import { ExpenseDetailModal } from './ExpenseDetailModal';

interface ExpensesListProps {
  expenses: Expense[];
  members: Member[];
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
  filterPaidBy: string | null;
  onFilterChange: (id: string | null) => void;
}

export function ExpensesList({ expenses, members, onEdit, onDelete, filterPaidBy, onFilterChange }: ExpensesListProps) {
  const { t } = useTranslation();
  const { currentMemberId, isSettled, currentGroup } = useGroup();
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isFilterOpen) return;
    const updatePos = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        filterRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) return;
      setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isFilterOpen]);

  const selectedLabel = filterPaidBy
    ? members.find(m => m.id === filterPaidBy)?.name ?? t('expenses.filter_all')
    : t('expenses.filter_all');
  
  return (
    <div className="bg-white rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] overflow-hidden select-none">
      {/* Header with Filter Dropdown */}
      <div className="px-5 py-4 border-b-3 border-main-text bg-brand-light flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-2 min-w-0">
          <Receipt className="w-5 h-5 text-accent-orange stroke-[3] shrink-0" />
          <h2 className="font-nunito font-black text-lg text-main-text truncate">{t('expenses.title')}</h2>
        </div>

        <div ref={filterRef} className="shrink-0">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsFilterOpen(prev => !prev)}
            className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-xl border-2 border-main-text font-nunito font-black text-xs shadow-[2px_2px_0px_#1A1A2E] transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] ${
              filterPaidBy
                ? 'bg-accent-orange text-white'
                : 'bg-white text-main-text'
            }`}
            aria-haspopup="listbox"
            aria-expanded={isFilterOpen}
          >
            <span className="text-[9px] font-black uppercase tracking-wider opacity-70 shrink-0">
              {t('expenses.paid_by')}
            </span>
            <span className="max-w-[100px] truncate">{selectedLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 stroke-[3] shrink-0 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isFilterOpen && panelPos && createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{ top: panelPos.top, right: panelPos.right }}
            className="fixed z-50 min-w-[180px] max-h-72 overflow-y-auto bg-white border-2 border-main-text rounded-xl shadow-[4px_4px_0px_#1A1A2E] p-1"
          >
            {[{ id: null, name: t('expenses.filter_all') }, ...members.map(m => ({ id: m.id, name: m.name }))].map(opt => {
              const isActive = filterPaidBy === opt.id;
              return (
                <button
                  key={opt.id ?? 'all'}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onFilterChange(opt.id);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-nunito font-black text-sm text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-accent-orange text-white'
                      : 'text-main-text hover:bg-brand-light'
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {isActive && <Check className="w-4 h-4 stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
      </div>

      {expenses.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-[#FFF0EA] border-2 border-main-text rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-[-6deg] shadow-[2px_2px_0px_#1A1A2E]">
            <Receipt className="w-8 h-8 text-accent-orange" />
          </div>
          <h3 className="text-main-text font-nunito font-black text-lg mb-1">
            {filterPaidBy ? t('expenses.no_matching') : t('expenses.no_expenses_recorded')}
          </h3>
          <p className="text-gray-500 font-medium text-sm max-w-xs mx-auto">
            {filterPaidBy ? t('expenses.no_matching_hint') : t('expenses.no_expenses_hint')}
          </p>
        </div>
      ) : (
        <div className="divide-y-2 divide-main-text">
          {expenses.map((exp, idx) => (
            <ExpenseItem
              key={exp.id}
              expense={exp}
              members={members}
              group={currentGroup}
              currentMemberId={currentMemberId}
              filterPaidBy={filterPaidBy}
              onView={setViewingExpense}
              animationDelay={idx * 60}
            />
          ))}
        </div>
      )}

      {viewingExpense && (
        <ExpenseDetailModal
          expense={viewingExpense}
          members={members}
          group={currentGroup}
          currentMemberId={currentMemberId}
          isSettled={isSettled}
          onClose={() => setViewingExpense(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
