import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GroupSelectionView } from '../components/GroupSelectionView';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { useDialog } from '../contexts/DialogContext';

export function GroupSelectionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { confirm } = useDialog();
  const { user, handleGoogleLogin, handleLogout, handleDeleteAccount } = useAuth();
  const { myGroups, handleCreateGroup, handleJoinGroup } = useGroup();

  const onLogout = async () => {
    const isConfirmed = await confirm(t('auth.logout_msg'), {
      title: t('auth.logout'),
      confirmLabel: t('auth.logout'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      await handleLogout();
    }
  };

  const onDeleteAccount = async () => {
    const isConfirmed = await confirm(t('auth.delete_account_msg'), {
      title: t('auth.delete_account'),
      confirmLabel: t('auth.delete_account_confirm'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      await handleDeleteAccount();
    }
  };

  return (
    <GroupSelectionView
      user={user}
      myGroups={myGroups}
      onGoogleLogin={handleGoogleLogin}
      onLogout={onLogout}
      onDeleteAccount={onDeleteAccount}
      onCreateGroup={handleCreateGroup}
      onJoinGroup={handleJoinGroup}
      onSelectGroup={(id) => navigate(`/group/${id}`)}
    />
  );
}
