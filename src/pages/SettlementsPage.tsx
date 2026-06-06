import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { APP_NAME } from '../constants';
import { BalancesView } from '../components/BalancesView';
import { ProfileModal } from '../components/ProfileModal';
import { BottomNav } from '../components/BottomNav';
import { AppHeader } from '../components/AppHeader';
import { useGroup } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';

export function SettlementsPage() {
  const { t } = useTranslation();
  const { handleLogout, handleDeleteAccount } = useAuth();
  const {
    groupId,
    currentGroup,
    members,
    expenses,
    currentMemberId,
    currentMember,
    handleUpdateProfile,
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
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('balances.title')} - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('balances.title')} - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('balances.title')} - ${APP_NAME}`} />
      </Helmet>
      
      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
      />

      <main className="w-full mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {currentGroup?.name || 'Group Dashboard'}
            </h1>
            <p className="text-sm text-gray-500">
              {t('balances.title')}
            </p>
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/join/${groupId}`;
              navigator.clipboard.writeText(url);
              toast.success(t('groups.link_copied'));
            }}
            className="flex items-center gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shrink-0"
            title={t('common.share')}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden text-sm font-medium">{t('common.share')}</span>
          </button>
        </div>

        <BalancesView members={members} expenses={expenses} currentMemberId={currentMemberId!} />
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
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
