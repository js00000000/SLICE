import { useMemo } from 'react';
import { DollarSign, CheckCircle2, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense, SettlementRecord } from '../types';
import { calculateBalancesAndSettlements } from '../lib/settlement';
import { formatCurrency, formatDate } from '../utils/format';
import { CountUp } from './CountUp';

interface BalancesViewProps {
  members: Member[];
  expenses: Expense[];
  currentMemberId: string;
  completedSettlements?: SettlementRecord[];
  canUnmark?: (record: SettlementRecord) => boolean;
  onMarkPaid?: (settlement: { from: string; to: string; amount: number }) => void;
  onUnmark?: (settlementId: string) => void;
}

export function BalancesView({
  members,
  expenses,
  currentMemberId,
  completedSettlements = [],
  canUnmark,
  onMarkPaid,
  onUnmark,
}: BalancesViewProps) {
  const { t, i18n } = useTranslation();
  const { balances, settlements } = useMemo(() => {
    const { balances: map, settlements: transactions } = calculateBalancesAndSettlements(
      members,
      expenses,
      completedSettlements,
    );

    // Sort settlements: current member as payer first
    transactions.sort((a, b) => {
      if (a.from === currentMemberId) return -1;
      if (b.from === currentMemberId) return 1;
      return 0;
    });

    return { balances: map, settlements: transactions };
  }, [members, expenses, completedSettlements, currentMemberId]);

  const myBalance = balances[currentMemberId] || 0;

  return (
    <div className="space-y-6 font-plus-jakarta select-none">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5">

        {/* Net Balance Overview Card */}
        <div className="bg-white p-6 rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60">{t('balances.net_balance')}</p>
            {Math.abs(myBalance) < 0.01 ? (
              <p className="text-2xl font-nunito font-black text-success-green bg-success-light border border-success-green/20 px-3 py-1 rounded-full text-center inline-block">
                {t('members.settled')}
              </p>
            ) : myBalance > 0 ? (
              <div className="flex flex-col">
                <span className="text-2xl font-nunito font-black text-success-green">
                  {t('members.receivable_label') || 'To Receive'}
                </span>
                <span className="text-3.5xl font-nunito font-black text-success-green leading-none">
                  +<CountUp value={myBalance} formatter={formatCurrency} />
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-2xl font-nunito font-black text-accent-orange">
                  {t('members.owe_label') || 'Owe'}
                </span>
                <span className="text-3.5xl font-nunito font-black text-accent-orange leading-none">
                  -<CountUp value={Math.abs(myBalance)} formatter={formatCurrency} />
                </span>
              </div>
            )}
          </div>
          <div className="w-14 h-14 bg-brand-light border-3 border-main-text rounded-2xl flex items-center justify-center rotate-[4deg] shadow-[2px_2px_0px_#1A1A2E] shrink-0">
            <DollarSign className="w-7 h-7 text-accent-orange stroke-[2.5]" />
          </div>
        </div>

        {/* settlements list card */}
        <div className="bg-white p-6 rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E]">
          <p className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60 mb-4">{t('balances.settlements')}</p>
          {settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="w-12 h-12 bg-success-light border-2 border-success-green/20 rounded-full flex items-center justify-center text-success-green">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-sm font-bold text-main-text/80">{t('balances.no_expenses')}</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {settlements.map((s, idx) => (
                <SettlementRow
                  key={idx}
                  settlement={s}
                  members={members}
                  currentMemberId={currentMemberId}
                  index={idx}
                  onMarkPaid={onMarkPaid}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed payments card */}
        {completedSettlements.length > 0 && (
          <div className="bg-white p-6 rounded-[20px] border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E]">
            <p className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60 mb-4">
              {t('settle.completed_title')}
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {completedSettlements.map((record, idx) => (
                <CompletedRow
                  key={record.id}
                  record={record}
                  members={members}
                  currentMemberId={currentMemberId}
                  index={idx}
                  locale={i18n.resolvedLanguage || 'en'}
                  canUnmark={canUnmark ? canUnmark(record) : false}
                  onUnmark={onUnmark}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettlementRow({ settlement, members, currentMemberId, index, onMarkPaid }: {
  settlement: { from: string, to: string, amount: number },
  members: Member[],
  currentMemberId: string,
  index: number,
  onMarkPaid?: (settlement: { from: string; to: string; amount: number }) => void,
}) {
  const { t } = useTranslation();
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');
  const isPayer = settlement.from === currentMemberId;
  const isReceiver = settlement.to === currentMemberId;
  const canMarkPaid = !!onMarkPaid && (isPayer || isReceiver);

  return (
    <div
      className="p-3.5 border-2 border-main-text rounded-xl bg-white shadow-[2px_2px_0px_#1A1A2E] flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-xs font-black truncate px-2 py-1 rounded-lg border-2 border-main-text ${
            isPayer
              ? 'bg-[#FFF0EA] text-accent-orange'
              : 'bg-white text-main-text'
          }`}>
            {getMemberName(settlement.from)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-main-text/60 stroke-[3.5] shrink-0" />
          <span className={`text-xs font-black truncate px-2 py-1 rounded-lg border-2 border-main-text ${
            isReceiver
              ? 'bg-success-light text-success-green'
              : 'bg-white text-main-text'
          }`}>
            {getMemberName(settlement.to)}
          </span>
        </div>
        <span className="font-nunito font-black text-sm text-main-text bg-page-bg/60 border border-main-text/10 px-2 py-0.5 rounded-md whitespace-nowrap">
          <CountUp value={settlement.amount} formatter={formatCurrency} />
        </span>
      </div>
      {canMarkPaid && (
        <button
          onClick={() => onMarkPaid?.(settlement)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-success-green text-white rounded-lg font-nunito font-black text-xs border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] hover:bg-success-green/90 transition-all cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{t('settle.mark_paid_action')}</span>
        </button>
      )}
    </div>
  );
}

function CompletedRow({ record, members, currentMemberId, index, locale, canUnmark, onUnmark }: {
  record: SettlementRecord,
  members: Member[],
  currentMemberId: string,
  index: number,
  locale: string,
  canUnmark: boolean,
  onUnmark?: (settlementId: string) => void,
}) {
  const { t } = useTranslation();
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');
  const isPayer = record.from === currentMemberId;
  const isReceiver = record.to === currentMemberId;

  return (
    <div
      className="p-3.5 border-2 border-success-green/40 rounded-xl bg-success-light/40 shadow-[2px_2px_0px_#1A1A2E] flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-success-green stroke-[2.5] shrink-0" />
          <span className={`text-xs font-black truncate px-2 py-1 rounded-lg border-2 border-main-text ${
            isPayer ? 'bg-[#FFF0EA] text-accent-orange' : 'bg-white text-main-text'
          }`}>
            {getMemberName(record.from)}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-main-text/60 stroke-[3.5] shrink-0" />
          <span className={`text-xs font-black truncate px-2 py-1 rounded-lg border-2 border-main-text ${
            isReceiver ? 'bg-success-light text-success-green' : 'bg-white text-main-text'
          }`}>
            {getMemberName(record.to)}
          </span>
        </div>
        <span className="font-nunito font-black text-sm text-success-green bg-white border border-success-green/30 px-2 py-0.5 rounded-md whitespace-nowrap">
          {formatCurrency(record.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-main-text/60">
        <span>{record.completedAt ? formatDate(record.completedAt, locale) : ''}</span>
        {canUnmark && onUnmark && (
          <button
            onClick={() => onUnmark(record.id)}
            className="inline-flex items-center gap-1 px-2 py-1 text-main-text bg-white rounded-md font-nunito font-black border-2 border-main-text shadow-[1px_1px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-page-bg transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 stroke-[3]" />
            <span>{t('settle.unmark_action')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
