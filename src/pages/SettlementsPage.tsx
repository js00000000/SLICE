import { useState, useEffect } from 'react';
import { Share2, Lock, CheckCircle2, Undo2, Link } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { APP_NAME } from '../constants';
import { BalancesView } from '../components/BalancesView';
import { SettledCTACard } from '../components/SettledCTACard';
import { ProfileModal } from '../components/ProfileModal';
import { shareGroup, copyGroupLink } from '../utils/shareGroup';
import { BottomNav } from '../components/BottomNav';
import { AppHeader } from '../components/AppHeader';
import { useGroup } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';

export function SettlementsPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.resolvedLanguage?.startsWith('zh') ?? false;
  const { user, handleDeleteAccount } = useAuth();
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
    handleSettleGroup,
    handleUnsettleGroup,
    handleMarkSettlementPaid,
    handleUnmarkSettlement,
  } = useGroup();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Manual title fallback
  useEffect(() => {
    const title = currentGroup?.name 
      ? `${currentGroup.name} - ${APP_NAME}` 
      : `${t('balances.title')} - ${APP_NAME}`;
    document.title = title;
  }, [currentGroup?.name, t]);

  if (!currentMember || !groupId) return null;

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta pb-28 flex flex-col justify-start">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('balances.title')} - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('balances.title')} - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('balances.title')} - ${APP_NAME}`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
        showGroups
      />

      <main className="w-full mx-auto px-5 py-6 space-y-6 flex-1">
        
        {/* Header Dashboard section */}
        <div className="stagger-item flex items-center justify-between gap-4 p-5 bg-white border-3 border-main-text rounded-[24px] shadow-[4px_4px_0px_#1A1A2E]" style={{ animationDelay: '0ms' }}>
          <div className="min-w-0 flex-1">
            <h1 className="text-2.5xl font-nunito font-black text-main-text truncate leading-tight">
              {currentGroup?.name || 'Group Dashboard'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-accent-orange rounded-full" />
              <span className="text-xs font-black font-nunito uppercase tracking-wider text-main-text/60">
                {t('balances.title') || 'Settlements'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyGroupLink({ joinId: currentGroup?.joinId || currentGroup?.id, groupId, isZh, copiedToastMsg: t('groups.link_copied') })}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-main-text rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer hover:bg-brand-light transition-all shrink-0"
              title={t('common.copy_link')}
            >
              <Link className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">{t('common.copy_link')}</span>
            </button>

            <button
              onClick={() => shareGroup({ groupName: currentGroup?.name, joinId: currentGroup?.joinId || currentGroup?.id, groupId, isZh })}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer hover:bg-white transition-all shrink-0"
              title={t('common.share')}
            >
              <Share2 className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">{t('common.share') || 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Settled banner / Settle Up action */}
        {isSettled ? (
          <div
            className="stagger-item p-5 bg-success-light border-3 border-success-green rounded-[24px] shadow-[4px_4px_0px_#1A1A2E] flex items-center justify-between gap-4"
            style={{ animationDelay: '40ms' }}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 bg-white border-2 border-main-text rounded-xl flex items-center justify-center rotate-[-4deg] shrink-0 shadow-[2px_2px_0px_#1A1A2E]">
                <CheckCircle2 className="w-5 h-5 text-success-green stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-nunito font-black text-main-text leading-tight">
                  {t('settle.settled_title')}
                </p>
                <p className="text-xs font-bold text-main-text/70 mt-1">
                  {currentGroup?.settledAt
                    ? t('settle.settled_on', {
                        date: currentGroup.settledAt.toDate().toLocaleDateString(i18n.resolvedLanguage),
                      })
                    : t('settle.settled_subtitle')}
                </p>
              </div>
            </div>
            {isHost && (
              <button
                onClick={handleUnsettleGroup}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white text-main-text rounded-xl font-nunito font-black text-sm border-2 border-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer hover:bg-page-bg transition-all shrink-0"
              >
                <Undo2 className="w-4 h-4 stroke-[2.5]" />
                <span>{t('settle.undo_action')}</span>
              </button>
            )}
          </div>
        ) : (
          isHost && (
            <button
              onClick={handleSettleGroup}
              disabled={expenses.length === 0}
              className="stagger-item w-full flex items-center justify-center gap-2 px-5 py-4 bg-accent-orange text-white rounded-[20px] font-nunito font-black text-base border-3 border-main-text shadow-[4px_4px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] hover:bg-[#ff7b4b] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-orange"
              style={{ animationDelay: '40ms' }}
            >
              <Lock className="w-5 h-5 stroke-[2.75]" />
              <span>{t('settle.action')}</span>
            </button>
          )
        )}

        {/* Growth-loop CTAs for settled groups */}
        {isSettled && <SettledCTACard isHost={isHost} animationDelay="60ms" />}

        {/* Balances component */}
        <BalancesView
          members={members}
          expenses={expenses}
          currentMemberId={currentMemberId!}
          group={currentGroup}
          completedSettlements={completedSettlements}
          canUnmark={(record) => !!user && (record.completedBy === user.uid || isHost)}
          onMarkPaid={isSettled ? handleMarkSettlementPaid : undefined}
          onUnmark={handleUnmarkSettlement}
        />
      </main>

      <BottomNav
        activeTab="settlements"
        groupId={groupId}
      />

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
