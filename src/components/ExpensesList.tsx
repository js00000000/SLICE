import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Receipt, Edit2, Trash2, ChevronDown, ChevronUp, Lock, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { useGroup } from '../contexts/GroupContext';

interface ExpensesListProps {
  expenses: Expense[];
  members: Member[];
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
  filterPaidBy: string | null;
  onFilterChange: (id: string | null) => void;
}

export function ExpensesList({ expenses, members, onEdit, onDelete, filterPaidBy, onFilterChange }: ExpensesListProps) {
  const { t, i18n } = useTranslation();
  const { currentMemberId, isSettled } = useGroup();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

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
          {expenses.map((exp, idx) => {
            const isExpanded = expandedId === exp.id;
            const myShare = (() => {
              if (!currentMemberId) return null;
              if (exp.splits && exp.splits.length > 0) {
                return exp.splits.find(s => s.memberId === currentMemberId)?.amount || 0;
              }
              if (exp.splitAmong.includes(currentMemberId)) {
                const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
                return amount / exp.splitAmong.length;
              }
              return 0;
            })();

            return (
              <div 
                key={exp.id} 
                className="stagger-item hover:bg-page-bg/50 transition-all duration-150 relative cursor-pointer"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Main Row Content */}
                <div 
                  onClick={() => toggleExpand(exp.id)}
                  className="p-5 flex items-start justify-between gap-3 active:scale-[0.99] transition-transform"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-nunito font-black text-md text-main-text truncate">{exp.description}</h3>
                      <span className="text-[10px] bg-brand-light text-accent-orange font-black px-2 py-0.5 rounded-full border border-main-text/10 shrink-0">
                        {formatDate(exp.createdAt, i18n.language)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1 space-y-0.5 font-medium">
                      <div className="flex items-center gap-1 flex-wrap">
                        {exp.payments && exp.payments.length > 1 ? (
                          <>
                            {exp.payments.map((p, pIdx, arr) => (
                              <span key={p.memberId} className="whitespace-nowrap">
                                <span className={`font-bold ${p.memberId === currentMemberId ? 'text-accent-orange font-black' : 'text-main-text'}`}>
                                  {getMemberName(p.memberId)}
                                </span>
                                <span className="text-gray-400 text-[10px] ml-0.5 font-nunito font-bold">({formatCurrency(p.amount)})</span>
                                {pIdx < arr.length - 1 && <span className="mr-1">,</span>}
                              </span>
                            ))}
                            <span className="text-gray-400 text-xs">{t('expenses.paid_action')}</span>
                            <span className="font-nunito font-black text-main-text whitespace-nowrap bg-brand-light px-2 py-0.5 rounded border border-main-text/10">
                              {formatCurrency(exp.amount)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`font-bold ${exp.paidBy === currentMemberId ? 'text-accent-orange font-black' : 'text-main-text'}`}>
                              {getMemberName(exp.paidBy)}
                            </span> 
                            <span className="text-gray-400 text-xs">{t('expenses.paid_action')}</span>
                            <span className="font-nunito font-black text-main-text whitespace-nowrap bg-brand-light px-2 py-0.5 rounded border border-main-text/10">
                              {formatCurrency(exp.amount)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Share displaying with custom animation */}
                  <div className="flex flex-col items-end justify-between shrink-0 h-12">
                    <div className="flex items-center gap-1.5">
                      {isSettled ? (
                        <span
                          className="text-main-text/40 p-1.5 rounded-lg border border-transparent"
                          title={t('settle.locked_msg')}
                        >
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(exp);
                            }}
                            className="text-main-text/60 hover:text-accent-orange p-1.5 rounded-lg hover:bg-brand-light border border-transparent hover:border-main-text transition-all duration-150 cursor-pointer"
                            title={t('common.edit')}
                          >
                            <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(exp);
                            }}
                            className="text-main-text/60 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-main-text transition-all duration-150 cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </>
                      )}
                      <span className="text-gray-300 ml-0.5">
                        {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                      </span>
                    </div>

                    {myShare !== null && myShare > 0 && (
                      <div className="text-xs font-black text-accent-orange font-nunito bg-[#FFF0EA] px-2 py-0.5 rounded-full border border-accent-orange/30">
                        {t('expenses.my_share') || 'My Share'}: <span className="font-black">{formatCurrency(myShare)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slices Concept: Diagonal Separator Detail inside Expanded Detail Box */}
                {isExpanded && (
                  <div className="bg-[#FFF8F5] px-5 py-4 border-t-2 border-dashed border-main-text/20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
                      <h4 className="text-xs font-black font-nunito text-main-text uppercase tracking-wider">
                        {t('expenses.split_among') || 'Split Details'}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {exp.splitAmong.map((memberId) => {
                        const isMe = memberId === currentMemberId;
                        const customSplitAmt = exp.splits?.find(s => s.memberId === memberId)?.amount;
                        const individualShare = customSplitAmt !== undefined 
                          ? customSplitAmt 
                          : exp.amount / exp.splitAmong.length;

                        return (
                          <div 
                            key={memberId} 
                            className={`flex items-center justify-between p-2 rounded-xl border border-main-text/10 ${
                              isMe ? 'bg-brand-light border-accent-orange/30 font-bold' : 'bg-white'
                            }`}
                          >
                            <span className={`truncate ${isMe ? 'text-accent-orange font-black' : 'text-main-text'}`}>
                              {getMemberName(memberId)} {isMe && `(${t('common.me') || 'Me'})`}
                            </span>
                            <span className="font-nunito font-bold text-main-text">
                              {formatCurrency(individualShare)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
