import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, PlusCircle, Link } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { ProfileModal } from '../components/ProfileModal';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { APP_NAME } from '../constants';
import type { Member } from '../types';

export function GroupSelectionPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, handleLogout, handleDeleteAccount } = useAuth();
  const { myGroups, handleCreateGroup, handleJoinGroup } = useGroup();

  const [groupName, setGroupName] = useState('');
  const [groupIdToJoin, setGroupIdToJoin] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Manual title fallback
  useEffect(() => {
    document.title = `${t('groups.my_groups')} - ${APP_NAME}`;
  }, [t]);

  const isAnonymous = user?.isAnonymous;
  const displayName = isAnonymous
    ? (i18n.resolvedLanguage?.startsWith('zh') ? '訪客' : 'Guest')
    : (user?.displayName || user?.email || t('common.loading'));

  return (
    <div className="min-h-screen bg-page-bg text-main-text selection:bg-brand-light font-plus-jakarta flex flex-col pb-10">
      <Helmet>
        <title>{t('groups.my_groups') ? `${t('groups.my_groups')} - ${APP_NAME}` : APP_NAME}</title>
      </Helmet>

      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={displayName}
      />

      <main className="w-full max-w-md mx-auto p-5 py-6 space-y-6 flex-1 flex flex-col justify-start">
        
        {/* Welcome Section */}
        <div className="stagger-item space-y-1 py-2 text-center" style={{ animationDelay: '0ms' }}>
          <h1 className="text-3xl font-nunito font-black text-main-text tracking-tight">
            {t('groups.my_groups') || 'My Groups'}
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            {i18n.resolvedLanguage?.startsWith('zh') ? '輕鬆、快速、朋友聚餐旅遊分帳首選！' : 'Split expenses easily with your friends!'}
          </p>
        </div>

        {/* Existing Groups Card */}
        {myGroups.length > 0 && (
          <div className="stagger-item bg-white rounded-[24px] border-3 border-main-text p-6 shadow-[4px_4px_0px_#1A1A2E] space-y-4" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-1.5 border-b-2 border-dashed border-main-text/10 pb-2">
              <span className="w-1.5 h-3 bg-accent-orange rotate-[15deg] rounded-sm" />
              <h2 className="font-nunito font-black text-md text-main-text uppercase tracking-wider">
                {t('groups.active_groups') || 'Active Groups'}
              </h2>
            </div>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {myGroups.map(g => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/group/${g.id}`)}
                  className="w-full flex items-center justify-between p-4 border-2 border-main-text rounded-xl bg-white hover:bg-brand-light transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#1A1A2E] shadow-[3px_3px_0px_#1A1A2E] group cursor-pointer"
                >
                  <div className="flex flex-col items-start min-w-0 pr-2">
                    <span className="font-nunito font-black text-base text-main-text truncate group-hover:text-accent-orange transition-colors">{g.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">{g.id.slice(0, 12)}...</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-light border border-main-text/15 flex items-center justify-center group-hover:bg-accent-orange group-hover:text-white transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create and Join Controls Card */}
        <div className="stagger-item bg-white rounded-[24px] border-3 border-main-text p-6 shadow-[4px_4px_0px_#1A1A2E] space-y-6" style={{ animationDelay: '120ms' }}>
          
          {/* Create Group */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <PlusCircle className="w-4.5 h-4.5 text-accent-orange stroke-[2.5]" />
              <h2 className="font-nunito font-black text-sm text-main-text uppercase tracking-wider">{t('groups.create_new')}</h2>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t('groups.enter_name')}
                className="w-full px-4 py-3 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white"
                maxLength={50}
              />
              <button
                onClick={() => handleCreateGroup(groupName)}
                disabled={!groupName.trim()}
                className="w-full py-3 bg-accent-orange text-white rounded-xl font-nunito font-black text-md border-2 border-main-text shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer"
              >
                {t('groups.create')}
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="flex-grow border-t-2 border-dashed border-gray-100"></div>
            <span className="flex-shrink mx-3 text-[10px] font-black text-gray-300 font-nunito uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t-2 border-dashed border-gray-100"></div>
          </div>

          {/* Join Group */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Link className="w-4.5 h-4.5 text-accent-orange stroke-[2.5]" />
              <h2 className="font-nunito font-black text-sm text-main-text uppercase tracking-wider">{t('groups.join_existing')}</h2>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={groupIdToJoin}
                onChange={(e) => setGroupIdToJoin(e.target.value)}
                placeholder={t('groups.enter_id')}
                className="w-full px-4 py-3 border-2 border-main-text rounded-xl focus:ring-2 focus:ring-accent-orange focus:outline-none text-base font-bold bg-white font-mono"
              />
              <button
                onClick={() => handleJoinGroup(groupIdToJoin)}
                disabled={!groupIdToJoin.trim()}
                className="w-full py-3 bg-brand-light text-accent-orange rounded-xl font-nunito font-black text-md border-2 border-main-text shadow-[3px_3px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer"
              >
                {t('groups.join')}
              </button>
            </div>
          </div>

        </div>
      </main>

      {isProfileModalOpen && (
        <ProfileModal
          currentMember={{ name: displayName, isHost: false } as Member}
          onClose={() => setIsProfileModalOpen(false)}
          onSave={() => setIsProfileModalOpen(false)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
}
