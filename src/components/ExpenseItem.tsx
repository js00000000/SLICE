import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense, Group } from '../types';
import { formatDate, formatCurrency } from '../utils/format';
import { getPayers, resolvePayerDisplay } from '../utils/payers';
import { isForeignExpense, getExpenseRate, convertToDefault } from '../utils/currency';

interface ExpenseItemProps {
  expense: Expense;
  members: Member[];
  group?: Group | null;
  currentMemberId: string | null;
  /** Active "paid by" filter, if any — surfaced as the primary payer. */
  filterPaidBy: string | null;
  /** Open the detail modal for this expense. */
  onView: (exp: Expense) => void;
  /** Stagger animation delay in ms applied via animationDelay. */
  animationDelay?: number;
}

export function ExpenseItem({
  expense: exp,
  members,
  group = null,
  currentMemberId,
  filterPaidBy,
  onView,
  animationDelay = 0,
}: ExpenseItemProps) {
  const { t, i18n } = useTranslation();

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');

  const payers = getPayers(exp);
  const { displayPayerIds, overflowCount } = resolvePayerDisplay(payers, currentMemberId, filterPaidBy);

  // Foreign-currency expenses show the original amount plus the converted
  // default-currency value; default-currency expenses render as before.
  const foreign = isForeignExpense(exp, group);

  return (
    <div
      onClick={() => onView(exp)}
      className="stagger-item p-5 hover:bg-page-bg/50 active:scale-[0.99] transition-all duration-150 cursor-pointer"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-nunito font-black text-md text-main-text truncate">{exp.description}</h3>

          {/* Datetime under the description */}
          <div className="flex items-center gap-1 mt-1 text-xs text-main-text/40 font-bold">
            <Calendar className="w-3 h-3 stroke-[2.5]" />
            {formatDate(exp.createdAt, i18n.language)}
          </div>

          {/* Who paid — all names when ≤2 payers, else primary + "+N" */}
          {displayPayerIds.length > 0 && (
            <div className="mt-1.5 text-xs font-bold text-main-text/60 truncate">
              {displayPayerIds.map((id, i) => (
                <span key={id}>
                  {i > 0 && <span className="text-main-text">, </span>}
                  <span className={`font-black ${id === currentMemberId ? 'text-accent-orange' : 'text-main-text'}`}>
                    {getMemberName(id)}
                  </span>
                </span>
              ))}
              {overflowCount > 0 && <span className="text-main-text">, +{overflowCount}</span>}{' '}
              <span>{t('expenses.paid_action')}</span>
            </div>
          )}
        </div>

        {foreign ? (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="font-nunito font-black text-2xl text-accent-orange whitespace-nowrap leading-none">
              {formatCurrency(exp.amount, exp.currency)}
            </div>
            <div className="text-xs font-bold text-main-text/50 whitespace-nowrap">
              ≈ {formatCurrency(convertToDefault(exp.amount, getExpenseRate(exp, group)))}
            </div>
          </div>
        ) : (
          <div className="font-nunito font-black text-2xl text-accent-orange whitespace-nowrap shrink-0 leading-none">
            {formatCurrency(exp.amount)}
          </div>
        )}
      </div>
    </div>
  );
}
