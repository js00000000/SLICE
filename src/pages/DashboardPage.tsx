import { useState, useMemo, useEffect, useCallback } from 'react';
import { Share2, DollarSign, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { APP_NAME } from '../constants';
import { ExpenseModal } from '../components/ExpenseModal';
import { ProfileModal } from '../components/ProfileModal';
import { MemberBreakdownModal } from '../components/MemberBreakdownModal';
import type { Member } from '../types';
import { BottomNav } from '../components/BottomNav';
import { AppHeader } from '../components/AppHeader';
import { SettledCTACard } from '../components/SettledCTACard';
import { useGroup } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateBalancesAndSettlements } from '../lib/settlement';
import { buildRateMap } from '../utils/currency';
import { CountUp } from '../components/CountUp';
import { formatCurrency } from '../utils/format';

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleDeleteAccount } = useAuth();
  const {
    groupId,
    currentGroup,
    members,
    expenses,
    completedSettlements,
    currentMemberId,
    currentMember,
    isHost,
    isSettled,
    handleUpdateProfile,
    handleAddExpense,
    handleUpdateExpense,
  } = useGroup();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<{ member: Member; mode: 'paid' | 'share' } | null>(null);

  // Manual title fallback
  useEffect(() => {
    const title = currentGroup?.name 
      ? `${currentGroup.name} - ${APP_NAME}` 
      : `${t('common.dashboard')} - ${APP_NAME}`;
    document.title = title;
  }, [currentGroup?.name, t]);

  // code → rate lookup for converting foreign-currency expenses into the
  // group default currency (all dashboard totals are in default currency).
  const rates = useMemo(() => buildRateMap(currentGroup), [currentGroup]);
  const expenseRate = useCallback(
    (exp: { currency?: string }) => (exp.currency !== undefined ? (rates[exp.currency] ?? 1) : 1),
    [rates],
  );

  const totalSpend = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()) * expenseRate(exp), 0);
  }, [expenses, expenseRate]);

  const { balances } = useMemo(() => {
    return calculateBalancesAndSettlements(members, expenses, completedSettlements, rates);
  }, [members, expenses, completedSettlements, rates]);

  const currentMemberBalance = currentMemberId ? (balances[currentMemberId] || 0) : 0;

  const memberPaidTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    members.forEach(m => totals[m.id] = 0);
    expenses.forEach(exp => {
      const rate = expenseRate(exp);
      const amount = parseFloat(exp.amount.toString()) * rate;
      if (exp.payments && exp.payments.length > 0) {
        exp.payments.forEach(p => {
          if (totals[p.memberId] !== undefined) {
            totals[p.memberId] += parseFloat(p.amount.toString()) * rate;
          }
        });
      } else if (totals[exp.paidBy] !== undefined) {
        totals[exp.paidBy] += amount;
      }
    });
    return totals;
  }, [members, expenses, expenseRate]);

  // Each member's total expense (their share of what was consumed), computed in
  // cents to stay penny-accurate and mirror the split logic in settlement.ts.
  const memberExpenseTotals = useMemo(() => {
    const cents: Record<string, number> = {};
    members.forEach(m => cents[m.id] = 0);
    expenses.forEach(exp => {
      const rate = expenseRate(exp);
      const totalCents = Math.round(parseFloat(exp.amount.toString()) * rate * 100);
      if (exp.splits && exp.splits.length > 0) {
        exp.splits.forEach(s => {
          if (cents[s.memberId] !== undefined) {
            cents[s.memberId] += Math.round(parseFloat(s.amount.toString()) * rate * 100);
          }
        });
      } else if (exp.splitAmong && exp.splitAmong.length > 0) {
        const count = exp.splitAmong.length;
        const baseCents = Math.floor(totalCents / count);
        const remainderCents = totalCents % count;
        exp.splitAmong.forEach((mId, index) => {
          const shareCents = baseCents + (index < remainderCents ? 1 : 0);
          if (cents[mId] !== undefined) cents[mId] += shareCents;
        });
      }
    });
    const totals: Record<string, number> = {};
    Object.entries(cents).forEach(([id, c]) => { totals[id] = c / 100; });
    return totals;
  }, [members, expenses, expenseRate]);

  const openAddModal = () => {
    if (isSettled) {
      toast.error(t('settle.locked_msg'));
      return;
    }
    setIsExpenseModalOpen(true);
  };

  if (!currentMember || !groupId) return null;

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta pb-28 flex flex-col justify-start">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.dashboard')} - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.dashboard')} - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.dashboard')} - ${APP_NAME}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
        showGroups
      />

      <main className="w-full mx-auto px-5 py-6 space-y-6 flex-1">
        
        {/* Header Dashboard section - Group Name & Share */}
        <div className="stagger-item flex items-center justify-between gap-4 p-5 bg-white border-3 border-main-text rounded-[24px] shadow-[4px_4px_0px_#1A1A2E]" style={{ animationDelay: '0ms' }}>
          <div className="min-w-0 flex-1">
            <h1 className="text-2.5xl font-nunito font-black text-main-text truncate leading-tight">
              {currentGroup?.name || 'Group Dashboard'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-accent-orange rounded-full" />
              <span className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60">
                {expenses.length} {t('expenses.title')}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => {
              const url = `${window.location.origin}/join/${currentGroup?.joinId || groupId}`;
              navigator.clipboard.writeText(url);
              toast.success(t('groups.link_copied'));
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer hover:bg-white transition-all shrink-0"
            title={t('common.share')}
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">{t('common.share') || 'Share'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 stagger-item" style={{ animationDelay: '60ms' }}>
            {/* Total Spending */}
            <div className="bg-white rounded-[20px] border-3 border-main-text p-4.5 shadow-[3px_3px_0px_#1A1A2E] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-accent-orange stroke-[2.5]" />
                  {t('common.total_spend')}
                </span>
                <CountUp value={totalSpend} formatter={formatCurrency} className="text-2.5xl font-nunito font-black text-main-text block mt-1.5 leading-none" />
              </div>
            </div>

            {/* Your Balance */}
            <div className="bg-white rounded-[20px] border-3 border-main-text p-4.5 shadow-[3px_3px_0px_#1A1A2E] flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase font-nunito tracking-wider text-main-text/50 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${currentMemberBalance > 0 ? 'bg-success-green' : currentMemberBalance < 0 ? 'bg-accent-orange' : 'bg-gray-400'}`} />
                  {currentMemberBalance > 0 ? t('common.owed_to_you') : currentMemberBalance < 0 ? t('common.you_owe') : t('common.all_settled')}
                </span>
                <CountUp value={Math.abs(currentMemberBalance)} formatter={formatCurrency} className={`text-2.5xl font-nunito font-black block mt-1.5 leading-none ${currentMemberBalance > 0 ? 'text-success-green' : currentMemberBalance < 0 ? 'text-accent-orange' : 'text-main-text'}`} />
              </div>
            </div>
          </div>

          {/* Growth-loop CTAs — Dashboard is the default landing tab for a
              group, so settled visitors see this even if they never open
              Balances. Same card/conditions as SettlementsPage. */}
          {isSettled && <SettledCTACard isHost={isHost} animationDelay="120ms" />}

          {/* Member Contribution Breakdown */}
          <div className="stagger-item bg-white rounded-[24px] border-3 border-main-text p-5 shadow-[4px_4px_0px_#1A1A2E] space-y-4" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-1.5 border-b-2 border-dashed border-main-text/10 pb-2.5">
              <span className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
              <h2 className="font-nunito font-black text-sm text-main-text uppercase tracking-wider">
                {t('common.member_balances')}
              </h2>
            </div>
            <div className="space-y-3">
              {members.filter(member => (memberPaidTotals[member.id] || 0) > 0).length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 bg-brand-light border-2 border-main-text rounded-2xl flex items-center justify-center mx-auto mb-3 rotate-[-6deg] shadow-[2px_2px_0px_#1A1A2E]">
                    <DollarSign className="w-7 h-7 text-accent-orange stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold font-nunito text-main-text/80">{t('expenses.no_expenses_recorded')}</p>
                </div>
              ) : (
                members
                  .filter(member => (memberPaidTotals[member.id] || 0) > 0)
                  .map(member => {
                    const paid = memberPaidTotals[member.id] || 0;
                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => setBreakdown({ member, mode: 'paid' })}
                        className="w-full flex items-center justify-between p-3.5 border-2 border-main-text rounded-xl hover:bg-page-bg/40 transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-nunito font-black text-sm text-main-text truncate">{member.name}</span>
                          {member.id === currentGroup?.createdBy && (
                            <span className="text-[9px] bg-brand-light text-accent-orange border border-accent-orange/20 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-nunito">{t('common.host')}</span>
                          )}
                          {member.id === currentMemberId && (
                            <span className="text-[9px] bg-success-light text-success-green border border-success-green/20 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-nunito">{t('common.me')}</span>
                          )}
                        </div>
                        <span className="font-nunito font-black text-2xl text-accent-orange whitespace-nowrap shrink-0 leading-none">
                          {formatCurrency(paid)}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Member Expense Breakdown — each member's total share of expenses */}
          <div className="stagger-item bg-white rounded-[24px] border-3 border-main-text p-5 shadow-[4px_4px_0px_#1A1A2E] space-y-4" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center gap-1.5 border-b-2 border-dashed border-main-text/10 pb-2.5">
              <span className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
              <h2 className="font-nunito font-black text-sm text-main-text uppercase tracking-wider">
                {t('common.member_expenses')}
              </h2>
            </div>
            <div className="space-y-3">
              {members.filter(member => (memberExpenseTotals[member.id] || 0) > 0).length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 bg-brand-light border-2 border-main-text rounded-2xl flex items-center justify-center mx-auto mb-3 rotate-[-6deg] shadow-[2px_2px_0px_#1A1A2E]">
                    <Receipt className="w-7 h-7 text-accent-orange stroke-[2.5]" />
                  </div>
                  <p className="text-sm font-bold font-nunito text-main-text/80">{t('expenses.no_expenses_recorded')}</p>
                  <p className="text-xs text-main-text/50 font-medium mt-1">{t('expenses.no_expenses_hint_dashboard')}</p>
                </div>
              ) : (
                members
                  .filter(member => (memberExpenseTotals[member.id] || 0) > 0)
                  .map(member => {
                    const share = memberExpenseTotals[member.id] || 0;
                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => setBreakdown({ member, mode: 'share' })}
                        className="w-full flex items-center justify-between p-3.5 border-2 border-main-text rounded-xl hover:bg-page-bg/40 transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-nunito font-black text-sm text-main-text truncate">{member.name}</span>
                          {member.id === currentGroup?.createdBy && (
                            <span className="text-[9px] bg-brand-light text-accent-orange border border-accent-orange/20 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-nunito">{t('common.host')}</span>
                          )}
                          {member.id === currentMemberId && (
                            <span className="text-[9px] bg-success-light text-success-green border border-success-green/20 font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-nunito">{t('common.me')}</span>
                          )}
                        </div>
                        <span className="font-nunito font-black text-2xl text-accent-orange whitespace-nowrap shrink-0 leading-none">
                          {formatCurrency(share)}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav
        activeTab="dashboard"
        groupId={groupId}
        onAddClick={openAddModal}
      />

      {isExpenseModalOpen && (
        <ExpenseModal
          members={members}
          currentMemberId={currentMemberId!}
          group={currentGroup}
          initialData={null}
          onClose={() => {
            setIsExpenseModalOpen(false);
          }}
          onSave={async (data, id) => {
            if (id) {
              await handleUpdateExpense(id, data);
              toast.success(t('expenses.updated'));
            } else {
              await handleAddExpense(data);
              toast.success(t('expenses.added'));
              navigate(`/group/${groupId}/expenses`);
            }
            setIsExpenseModalOpen(false);
          }}
        />
      )}

      {breakdown && (
        <MemberBreakdownModal
          member={breakdown.member}
          mode={breakdown.mode}
          expenses={expenses}
          group={currentGroup}
          onClose={() => setBreakdown(null)}
        />
      )}

      {isProfileModalOpen && (
        <ProfileModal
          currentMember={currentMember}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={async (data) => {
            await handleUpdateProfile(data);
            setIsProfileModalOpen(false);
          }}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
