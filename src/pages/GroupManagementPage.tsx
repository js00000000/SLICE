import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Users, Shield, X, Plus, Copy, Trash2, Share2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { BottomNav } from '../components/BottomNav';
import { AppHeader } from '../components/AppHeader';
import { ProfileModal } from '../components/ProfileModal';
import { useGroup } from '../contexts/GroupContext';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { APP_NAME } from '../constants';
import { calculateBalancesAndSettlements } from '../lib/settlement';
import type { Member } from '../types';

export function GroupManagementPage() {
  const { t, i18n } = useTranslation();
  const { groupId } = useParams();
  const { confirm } = useDialog();
  const { handleLogout, handleDeleteAccount } = useAuth();
  const { 
    members, expenses, currentMember, currentGroup, 
    handleUpdateProfile, handleDeleteMember, handleUpdateGroupName, handleDeleteGroup,
    handleCreateMemberByHost, handleLeaveGroup
  } = useGroup();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newName, setNewName] = useState(currentGroup?.name || '');
  const [newMemberName, setNewMemberName] = useState('');
  const { balances } = useMemo(() => calculateBalancesAndSettlements(members, expenses), [members, expenses]);

  // Sync newName state when currentGroup loads
  const [prevGroupName, setPrevGroupName] = useState(currentGroup?.name);
  if (currentGroup?.name !== prevGroupName) {
    setPrevGroupName(currentGroup?.name);
    setNewName(currentGroup?.name || '');
  }

  // Manual title fallback
  useEffect(() => {
    const title = currentGroup?.name 
      ? `${currentGroup.name} - ${APP_NAME}` 
      : `${t('common.settings')} - ${APP_NAME}`;
    document.title = title;
  }, [currentGroup?.name, t]);

  const handleSaveGroupName = async () => {
    if (newName.trim() && newName !== currentGroup?.name) {
      await handleUpdateGroupName(newName.trim());
      toast.success(t('common.success'));
    }
  };

  const handleDeleteMemberByHost = async (member: Member) => {
    const balance = balances[member.id] || 0;
    if (Math.abs(balance) > 0.01) {
      const balanceStr = balance > 0 
        ? t('members.receivable', { amount: balance.toFixed(0) }) 
        : t('members.owe', { amount: Math.abs(balance).toFixed(0) });
      toast.error(t('members.error_unsettled', { name: member.name, balance: balanceStr }));
      return;
    }
    const isConfirmed = await confirm(t('members.delete_member_msg', { name: member.name }));
    if (isConfirmed) {
      await handleDeleteMember(member.id);
      toast.success(t('common.success'));
    }
  };

  const handleAddMember = async () => {
    if (newMemberName.trim()) {
      await handleCreateMemberByHost(newMemberName.trim());
      setNewMemberName('');
      toast.success(t('common.success'));
    }
  };

  if (!currentMember || !groupId) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24">
      <Helmet>
        <title>{currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.settings')} - ${APP_NAME}`}</title>
        <meta property="og:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.settings')} - ${APP_NAME}`} />
        <meta property="twitter:title" content={currentGroup?.name ? `${currentGroup.name} - ${APP_NAME}` : `${t('common.settings')} - ${APP_NAME}`} />
      </Helmet>

      <AppHeader
        showProfile
        onProfileClick={() => setIsProfileModalOpen(true)}
        currentMemberName={currentMember.name}
      />

      <main className="w-full mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {t('common.settings')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('members.count', { count: members.length })}
            </p>
          </div>
        </div>

        {/* Group Info Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 px-1">
            <Settings className="w-4 h-4 text-indigo-600" /> {t('groups.group_info')}
          </h2>
          <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-500">{t('groups.group_name')}</span>
              {currentMember.isHost ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-base"
                  />
                  <button
                    onClick={handleSaveGroupName}
                    disabled={!newName.trim() || newName === currentGroup?.name}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                  >
                    {t('common.save')}
                  </button>
                </div>
              ) : (
                <span className="text-sm font-medium">{currentGroup?.name}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('groups.group_id')}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{currentGroup?.id}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentGroup?.id || '');
                    toast.success(t('groups.id_copied'));
                  }}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title={t('common.copy')}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">{t('common.share')}</span>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/join/${currentGroup?.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success(t('groups.link_copied'));
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {t('groups.share_link')}
              </button>
            </div>
          </div>
        </section>

        {/* Members Section */}
        <section className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> {t('members.list')}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden divide-y divide-gray-100">
            {members.map(m => {
              const balance = balances[m.id] || 0;
              const canDelete = Math.abs(balance) < 0.01 && m.id !== currentMember.id;
              const isClaimedByOthers = m.userId && m.userId !== currentMember.userId;

              return (
                <div key={m.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                      {m.name[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        {m.name}
                        {m.id === currentMember.id && <span className="text-[10px] text-indigo-500 font-normal">({t('members.you')})</span>}
                        {m.isHost && <Shield className="w-3 h-3 text-amber-500" />}
                      </span>
                      <span className={`text-xs ${Math.abs(balance) < 0.01 ? 'text-green-500' : balance > 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                        {Math.abs(balance) < 0.01 
                          ? t('members.settled') 
                          : balance > 0 
                            ? t('members.receivable', { amount: balance.toFixed(0) }) 
                            : t('members.owe', { amount: Math.abs(balance).toFixed(0) })
                        }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isClaimedByOthers && <div className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('members.claimed')}</div>}
                    {m.id !== currentMember.id && currentMember.isHost && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMemberByHost(m)}
                        disabled={!canDelete}
                        className={`p-2 rounded-lg transition-colors ${canDelete
                          ? 'text-red-500 hover:bg-red-50'
                          : 'text-gray-300 cursor-not-allowed'
                          }`}
                        title={!canDelete ? (i18n.language.startsWith('zh') ? "餘額未結清" : "Balance not settled") : t('members.delete_member')}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {currentMember.isHost && (
            <div className="bg-white rounded-2xl border shadow-sm p-4 mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('members.enter_name')}
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                  className="flex-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base"
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  {t('common.add')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Danger Zone Section */}
        <section className="space-y-4 pt-4 border-t">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-amber-500" /> {t('groups.danger_zone')}
          </h2>
          <div className="bg-white rounded-2xl border border-red-100 p-6 space-y-4">
            {currentMember.isHost ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-red-600">{t('groups.delete_group')}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t('groups.delete_group_msg', { name: currentGroup?.name })}</p>
                </div>
                <button type="button" onClick={handleDeleteGroup}
                  className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {t('groups.delete_group')}
                </button>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-red-600">{t('groups.leave_group')}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t('groups.leave_group_msg', { name: currentGroup?.name })}</p>
                </div>
                <button type="button" onClick={handleLeaveGroup}
                  className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  {t('groups.leave_group')}
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      <BottomNav
        activeTab="members"
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
