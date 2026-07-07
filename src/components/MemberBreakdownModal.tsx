import { X, Calendar, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense, Group } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { calculateEvenSplit } from '../utils/split';
import { isForeignExpense, getExpenseRate } from '../utils/currency';
import { useScrollLock } from '../hooks/useScrollLock';

interface MemberBreakdownModalProps {
  member: Member;
  // 'paid' lists expenses the member paid for; 'share' lists expenses the member participates in.
  mode: 'paid' | 'share';
  expenses: Expense[];
  group?: Group | null;
  onClose: () => void;
}

export function MemberBreakdownModal({ member, mode, expenses, group = null, onClose }: MemberBreakdownModalProps) {
  useScrollLock();
  const { t, i18n } = useTranslation();

  // Per-expense amount for this member in the expense's own currency, handling
  // both legacy (paidBy/splitAmong) and v2 (payments/splits) expense shapes —
  // same precedence as settlement.ts.
  const amountFor = (exp: Expense): number => {
    const total = parseFloat(exp.amount.toString());
    if (mode === 'paid') {
      if (exp.payments && exp.payments.length > 0) {
        return exp.payments.find(p => p.memberId === member.id)?.amount ?? 0;
      }
      return exp.paidBy === member.id ? total : 0;
    }
    if (exp.splits && exp.splits.length > 0) {
      return exp.splits.find(s => s.memberId === member.id)?.amount ?? 0;
    }
    return calculateEvenSplit(total, exp.splitAmong).find(s => s.memberId === member.id)?.amount ?? 0;
  };

  // Rows show the original expense-currency amount; the header total is in the
  // group default currency so it lines up with the dashboard figures.
  const rows = expenses
    .map(exp => {
      const amount = amountFor(exp);
      return {
        exp,
        amount,
        converted: amount * getExpenseRate(exp, group),
        foreign: isForeignExpense(exp, group),
      };
    })
    .filter(r => r.amount > 0);
  const total = rows.reduce((sum, r) => sum + Math.round(r.converted * 100), 0) / 100;

  const title = mode === 'paid'
    ? t('expenses.paid_breakdown_title', { name: member.name })
    : t('expenses.share_breakdown_title', { name: member.name });

  return (
    <div
      className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200 select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md rounded-[24px] border-3 border-main-text shadow-[6px_6px_0px_#1A1A2E] flex flex-col h-[min(600px,80dvh)] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-nunito font-black text-main-text truncate">{title}</h2>
            <div className="flex items-center gap-1 mt-1 text-xs text-main-text/50 font-bold">
              <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
              {rows.length} {t('expenses.title')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-main-text hover:text-accent-orange p-1.5 rounded-lg border-2 border-transparent hover:border-main-text hover:bg-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 font-plus-jakarta">
          {/* Total */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/60">
              {mode === 'paid' ? t('expenses.total_paid') : t('expenses.total_share')}
            </span>
            <span className="font-nunito font-black text-2xl text-main-text">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="space-y-2">
            {rows.map(({ exp, amount, converted, foreign }, index) => (
              <div
                key={exp.id}
                className="stagger-item flex items-center justify-between gap-3 p-3.5 border-2 border-main-text rounded-xl bg-white"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-nunito font-black text-sm text-main-text truncate">{exp.description}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-main-text/50 font-bold">
                    <Calendar className="w-3 h-3 stroke-[2.5]" />
                    {formatDate(exp.createdAt, i18n.language)}
                    <span className="text-main-text/30">·</span>
                    {formatCurrency(exp.amount, foreign ? exp.currency : undefined)}
                  </div>
                </div>
                {foreign ? (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-nunito font-black text-xl text-accent-orange whitespace-nowrap leading-none">
                      {formatCurrency(amount, exp.currency)}
                    </span>
                    <span className="text-[11px] font-bold text-main-text/50 whitespace-nowrap">
                      ≈ {formatCurrency(converted)}
                    </span>
                  </div>
                ) : (
                  <span className="font-nunito font-black text-xl text-accent-orange whitespace-nowrap shrink-0 leading-none">
                    {formatCurrency(amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t-3 border-main-text bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-main-text rounded-xl font-nunito font-black border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
