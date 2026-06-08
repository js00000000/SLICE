import { useMemo } from 'react';
import { DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Member, Expense } from '../types';
import { calculateBalancesAndSettlements } from '../lib/settlement';
import { formatCurrency } from '../utils/format';
import { CountUp } from './CountUp';

interface BalancesViewProps {
  members: Member[];
  expenses: Expense[];
  currentMemberId: string;
}

export function BalancesView({ members, expenses, currentMemberId }: BalancesViewProps) {
  const { t } = useTranslation();
  const { balances, settlements } = useMemo(() => {
    const { balances: map, settlements: transactions } = calculateBalancesAndSettlements(members, expenses);

    // Sort settlements: current member as payer first
    transactions.sort((a, b) => {
      if (a.from === currentMemberId) return -1;
      if (b.from === currentMemberId) return 1;
      return 0;
    });

    return { balances: map, settlements: transactions }; 
  }, [members, expenses, currentMemberId]);

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
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {settlements.map((s, idx) => (
                <SettlementRow key={idx} settlement={s} members={members} currentMemberId={currentMemberId} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettlementRow({ settlement, members, currentMemberId, index }: { 
  settlement: { from: string, to: string, amount: number }, 
  members: Member[], 
  currentMemberId: string,
  index: number
}) {
  const { t } = useTranslation();
  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || t('common.loading');
  const isPayer = settlement.from === currentMemberId;
  const isReceiver = settlement.to === currentMemberId;

  return (
    <div 
      className="p-3.5 border-2 border-main-text rounded-xl bg-white shadow-[2px_2px_0px_#1A1A2E] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
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
  );
}
