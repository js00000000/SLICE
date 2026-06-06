import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
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
    ? (i18n.language.startsWith('zh') ? '訪客' : 'Guest')
    : (user?.displayName || user?.email || t('common.loading'));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Helmet>
        <title>{t('groups.my_groups') ? `${t('groups.my_groups')} - ${APP_NAME}` : APP_NAME}</title>
      </Helmet>

      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={displayName}
      />

      <main className="w-full max-w-md mx-auto p-4 py-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-8">
          <div className="space-y-6">
            <div className="space-y-4">
              {myGroups.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    {t('groups.my_groups')}
                  </h2>
                  <div className="space-y-2">
                    {myGroups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => navigate(`/group/${g.id}`)}
                        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                      >
                        <div className="flex flex-col items-start min-w-0">
                          <span className="font-medium text-gray-900 truncate">{g.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{g.id.slice(0, 12)}...</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                  <span className="px-2 bg-white text-gray-400">OR</span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-bold text-gray-700">{t('groups.create_new')}</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={t('groups.enter_name')}
                    className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base"
                    maxLength={50}
                  />
                  <button
                    onClick={() => handleCreateGroup(groupName)}
                    disabled={!groupName.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
                  >
                    {t('groups.create')}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h2 className="text-sm font-bold text-gray-700">{t('groups.join_existing')}</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupIdToJoin}
                    onChange={(e) => setGroupIdToJoin(e.target.value)}
                    placeholder={t('groups.enter_id')}
                    className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base font-mono"
                  />
                  <button
                    onClick={() => handleJoinGroup(groupIdToJoin)}
                    disabled={!groupIdToJoin.trim()}
                    className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-50 transition-colors text-sm whitespace-nowrap"
                  >
                    {t('groups.join')}
                  </button>
                </div>
              </div>
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




