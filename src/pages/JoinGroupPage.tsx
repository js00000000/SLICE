import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { LoadingView } from '../components/LoadingView';
import { APP_NAME } from '../constants';

const pendingJoins = new Set<string>();

export function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const { handleJoinGroup } = useGroup();

  // Manual title fallback
  useEffect(() => {
    document.title = `${t('groups.join')} - ${APP_NAME}`;
  }, [t]);

  useEffect(() => {
    // Wait for auth to initialize (handled by App's authLoading check, but safe here too)
    if (authLoading) return;

    if (user && groupId && !pendingJoins.has(groupId)) {
      pendingJoins.add(groupId);
      const join = async () => {
        try {
          // handleJoinGroup in GroupContext already navigates to /group/:id on success
          await handleJoinGroup(groupId);
        } catch (err) {
          console.error("Auto-join error:", err);
          navigate('/', { replace: true });
        } finally {
          pendingJoins.delete(groupId);
        }
      };
      join();
    }
  }, [user, groupId, handleJoinGroup, authLoading, navigate]);

  return (
    <>
      <Helmet>
        <title>{t('groups.join')} - {APP_NAME}</title>
      </Helmet>
      <LoadingView message={t('common.loading')} />
    </>
  );
}
