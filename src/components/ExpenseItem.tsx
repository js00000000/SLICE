import { Edit2, Trash2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { calculateEvenSplit } from '../utils/split';

interface ExpenseItemProps {
  expense: Expense;
  members: Member[];
  currentMemberId: string | null;
  isSettled: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
  /** Stagger animation delay in ms applied via animationDelay. */
  animationDelay?: number;
}

export function ExpenseItem({
  expense: exp,
  members,
  currentMemberId,
  isSettled,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  animationDelay = 0,
}: ExpenseItemProps) {
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

  const myShare = currentMemberId ? (shareFor(currentMemberId) ?? 0) : null;

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
        className={`flex items-center justify-between p-2 rounded-xl border border-main-text/10 ${
          isMe ? 'bg-brand-light border-accent-orange/30 font-bold' : 'bg-white'
        }`}
      >
        <span className={`truncate ${isMe ? 'text-accent-orange font-black' : 'text-main-text'}`}>
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
      className="stagger-item hover:bg-page-bg/50 transition-all duration-150 relative cursor-pointer"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Main Row Content */}
      <div
        onClick={() => onToggleExpand(exp.id)}
        className="p-5 flex items-start justify-between gap-3 active:scale-[0.99] transition-transform"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-nunito font-black text-md text-main-text truncate">{exp.description}</h3>
            <span className="text-[10px] bg-page-bg text-main-text/50 font-bold px-2 py-0.5 rounded-full border border-main-text/10 shrink-0">
              {formatDate(exp.createdAt, i18n.language)}
            </span>
          </div>

          <div className="text-sm text-main-text/60 mt-1 space-y-0.5 font-medium">
            <div className="flex items-center gap-1 flex-wrap">
              {exp.payments && exp.payments.length > 1 ? (
                <>
                  {exp.payments.map((p, pIdx, arr) => (
                    <span key={p.memberId} className="whitespace-nowrap">
                      <span className={`font-bold ${p.memberId === currentMemberId ? 'text-accent-orange font-black' : 'text-main-text'}`}>
                        {getMemberName(p.memberId)}
                      </span>
                      {pIdx < arr.length - 1 && <span className="mr-1">,</span>}
                    </span>
                  ))}
                  <span className="text-main-text/50 text-xs">{t('expenses.paid_action')}</span>
                  <span className="font-nunito font-black text-main-text whitespace-nowrap bg-brand-light px-2 py-0.5 rounded border border-main-text/10">
                    {formatCurrency(exp.amount)}
                  </span>
                </>
              ) : (
                <>
                  <span className={`font-bold ${exp.paidBy === currentMemberId ? 'text-accent-orange font-black' : 'text-main-text'}`}>
                    {getMemberName(exp.paidBy)}
                  </span>
                  <span className="text-main-text/50 text-xs">{t('expenses.paid_action')}</span>
                  <span className="font-nunito font-black text-main-text whitespace-nowrap bg-brand-light px-2 py-0.5 rounded border border-main-text/10">
                    {formatCurrency(exp.amount)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions & Share displaying with custom animation */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            {isSettled ? (
              <span
                className="text-main-text/40 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-transparent"
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
                  className="text-main-text/60 hover:text-accent-orange flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-brand-light border border-transparent hover:border-main-text transition-all duration-150 cursor-pointer"
                  title={t('common.edit')}
                >
                  <Edit2 className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(exp);
                  }}
                  className="text-main-text/60 hover:text-red-500 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-red-50 border border-transparent hover:border-main-text transition-all duration-150 cursor-pointer"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                </button>
              </>
            )}
            <span className="text-main-text/40 flex items-center justify-center min-w-[32px] min-h-[44px]">
              {isExpanded ? <ChevronUp className="w-5 h-5 stroke-[2.5]" /> : <ChevronDown className="w-5 h-5 stroke-[2.5]" />}
            </span>
          </div>

          {myShare !== null && myShare > 0 && (
            <div className="text-xs font-black text-accent-orange font-nunito bg-brand-light px-2 py-0.5 rounded-full border border-accent-orange/30">
              {t('expenses.my_share') || 'My Share'}: <span className="font-black">{formatCurrency(myShare)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Slices Concept: Diagonal Separator Detail inside Expanded Detail Box */}
      {isExpanded && (
        <div className="@container bg-brand-light/40 px-5 py-4 border-t-2 border-dashed border-main-text/20 animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
          {/* Total cost */}
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-main-text/15">
            <span className="text-xs font-black font-nunito text-main-text uppercase tracking-wider">
              {t('expenses.amount') || 'Total'}
            </span>
            <span className="font-nunito font-black text-base text-main-text bg-brand-light px-3 py-1 rounded-lg border border-main-text/10">
              {formatCurrency(amountNum)}
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
              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2 text-xs">
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

            <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2 text-xs">
              {exp.splitAmong.map((memberId) => memberRow(memberId, shareFor(memberId) ?? 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
