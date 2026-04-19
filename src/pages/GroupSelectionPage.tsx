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
  const { user, handleGoogleLogin, handleLogout } = useAuth();
  const { myGroups, handleCreateGroup, handleJoinGroup } = useGroup();

  const onLogout = async () => {
    const isConfirmed = await confirm(t('auth.abandon_guest_msg'), {
      title: t('auth.logout'),
      confirmLabel: t('auth.logout'),
      cancelLabel: t('common.cancel')
    });
    if (isConfirmed) {
      await handleLogout();
    }
  };

  return (
    <GroupSelectionView
      user={user}
      myGroups={myGroups}
      onGoogleLogin={handleGoogleLogin}
      onLogout={onLogout}
      onCreateGroup={handleCreateGroup}
      onJoinGroup={handleJoinGroup}
      onSelectGroup={(id) => navigate(`/group/${id}`)}
    />
  );
}
