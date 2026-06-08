import { useState } from 'react';
import { Receipt, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { useGroup } from '../contexts/GroupContext';
import { CountUp } from './CountUp';

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
  const { currentMemberId } = useGroup();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };
  
  return (
    <div className="bg-white rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] overflow-hidden select-none">
      {/* Header with Filter Selection */}
      <div className="px-5 py-4 border-b-3 border-main-text bg-brand-light flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-accent-orange stroke-[3]" />
          <h2 className="font-nunito font-black text-lg text-main-text">{t('expenses.title')}</h2>
        </div>
        
        {/* Filter Selection Dropdown - min-size 16px to prevent zoom */}
        <div className="flex items-center gap-2">
          <label htmlFor="payer-filter" className="text-xs font-black text-main-text/60 font-nunito uppercase tracking-wider">
            {t('expenses.paid_by')}:
          </label>
          <select
            id="payer-filter"
            value={filterPaidBy || ''}
            onChange={(e) => onFilterChange(e.target.value || null)}
            className="text-base font-bold bg-white border-2 border-main-text rounded-xl px-2 py-1 focus:ring-2 focus:ring-accent-orange outline-none shadow-[2px_2px_0px_#1A1A2E] cursor-pointer"
          >
            <option value="">{t('expenses.filter_all')}</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
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
                              <CountUp value={exp.amount} formatter={formatCurrency} />
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`font-bold ${exp.paidBy === currentMemberId ? 'text-accent-orange font-black' : 'text-main-text'}`}>
                              {getMemberName(exp.paidBy)}
                            </span> 
                            <span className="text-gray-400 text-xs">{t('expenses.paid_action')}</span>
                            <span className="font-nunito font-black text-main-text whitespace-nowrap bg-brand-light px-2 py-0.5 rounded border border-main-text/10">
                              <CountUp value={exp.amount} formatter={formatCurrency} />
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Share displaying with custom animation */}
                  <div className="flex flex-col items-end justify-between shrink-0 h-12">
                    <div className="flex items-center gap-1.5">
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
                      <span className="text-gray-300 ml-0.5">
                        {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />}
                      </span>
                    </div>

                    {myShare !== null && myShare > 0 && (
                      <div className="text-xs font-black text-accent-orange font-nunito bg-[#FFF0EA] px-2 py-0.5 rounded-full border border-accent-orange/30">
                        {t('expenses.my_share') || 'My Share'}: <CountUp value={myShare} formatter={formatCurrency} className="font-black" />
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
