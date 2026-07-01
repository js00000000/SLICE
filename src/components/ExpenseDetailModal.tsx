import { X, Edit2, Trash2, Lock, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { calculateEvenSplit } from '../utils/split';
import { useScrollLock } from '../hooks/useScrollLock';

interface ExpenseDetailModalProps {
  expense: Expense;
  members: Member[];
  currentMemberId: string | null;
  isSettled: boolean;
  onClose: () => void;
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
}

export function ExpenseDetailModal({
  expense: exp,
  members,
  currentMemberId,
  isSettled,
  onClose,
  onEdit,
  onDelete,
}: ExpenseDetailModalProps) {
  useScrollLock();
  const { t, i18n } = useTranslation();

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');

  const amountNum = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;

  // Penny-accurate even split, so the UI matches the settlement ledger exactly.
  const evenSplits = calculateEvenSplit(amountNum, exp.splitAmong);
  const shareFor = (memberId: string): number | undefined => {
    const custom = exp.splits?.find(s => s.memberId === memberId)?.amount;
    if (custom !== undefined) return custom;
    return evenSplits.find(s => s.memberId === memberId)?.amount;
  };

  // Normalize payers across the legacy single-payer and v2 multi-payer shapes.
  const payers = exp.payments && exp.payments.length > 0
    ? exp.payments
    : exp.paidBy
      ? [{ memberId: exp.paidBy, amount: amountNum }]
      : [];

  // Shared row used by both the "Paid By" and "Split Details" breakdowns.
  const memberRow = (memberId: string, amount: number) => {
    const isMe = memberId === currentMemberId;
    return (
      <div
        key={memberId}
        className={`flex items-center justify-between p-2.5 rounded-xl border border-main-text/10 ${
          isMe ? 'bg-brand-light border-accent-orange/30 font-bold' : 'bg-white'
        }`}
      >
        <span className={`truncate text-sm ${isMe ? 'text-accent-orange font-black' : 'text-main-text'}`}>
          {getMemberName(memberId)} {isMe && `(${t('common.me') || 'Me'})`}
        </span>
        <span className="font-nunito font-bold text-main-text shrink-0 ml-2">
          {formatCurrency(amount)}
        </span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-main-text/40 backdrop-blur-sm z-50 flex items-end justify-center pt-16 sm:pt-20 px-0 pb-0 animate-in fade-in duration-200 select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md rounded-t-[24px] border-t-3 border-x-3 border-main-text shadow-[0_-12px_40px_rgba(26,26,46,0.15)] flex flex-col max-h-[calc(100dvh-4rem)] sm:max-h-[calc(100dvh-5rem)] overflow-hidden animate-slide-up">

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b-3 border-main-text shrink-0 bg-brand-light">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-nunito font-black text-main-text truncate">{exp.description}</h2>
            <div className="flex items-center gap-1 mt-1 text-xs text-main-text/50 font-bold">
              <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
              {formatDate(exp.createdAt, i18n.language)}
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
        <div className="@container p-6 overflow-y-auto flex-1 space-y-5 font-plus-jakarta">
          {/* Total */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/60">
              {t('expenses.amount')}
            </span>
            <span className="font-nunito font-black text-2xl text-main-text">
              {formatCurrency(exp.amount)}
            </span>
          </div>

          {payers.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <div className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
                <h4 className="text-xs font-black font-nunito text-main-text uppercase tracking-wider">
                  {t('expenses.paid_by') || 'Paid By'}
                </h4>
              </div>
              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
                {payers.map((p) => memberRow(p.memberId, p.amount))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1 mb-2">
              <div className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
              <h4 className="text-xs font-black font-nunito text-main-text uppercase tracking-wider">
                {t('expenses.split_among') || 'Split Details'}
              </h4>
            </div>
            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
              {exp.splitAmong.map((memberId) => memberRow(memberId, shareFor(memberId) ?? 0))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t-3 border-main-text bg-white shrink-0">
          {isSettled ? (
            <div className="flex items-center justify-center gap-2 py-3 text-main-text/50 font-nunito font-black">
              <Lock className="w-4 h-4 stroke-[2.5]" />
              {t('settle.locked_msg')}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onEdit(exp);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-main-text rounded-xl font-nunito font-black border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
              >
                <Edit2 className="w-4 h-4 stroke-[2.5]" />
                {t('common.edit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(exp);
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 text-white rounded-xl font-nunito font-black border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A2E] transition-all duration-150 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
