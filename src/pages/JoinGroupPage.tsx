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
  const { joinId } = useParams<{ joinId: string }>();
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

    if (user && joinId && !pendingJoins.has(joinId)) {
      pendingJoins.add(joinId);
      const join = async () => {
        try {
          // handleJoinGroup resolves the joinId to a groupId and navigates
          // to /group/:groupId on success.
          await handleJoinGroup(joinId);
        } catch (err) {
          console.error("Auto-join error:", err);
          navigate('/', { replace: true });
        } finally {
          pendingJoins.delete(joinId);
        }
      };
      join();
    }
  }, [user, joinId, handleJoinGroup, authLoading, navigate]);

  return (
    <>
      <Helmet>
        <title>{t('groups.join')} - {APP_NAME}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <LoadingView message={t('common.loading')} />
    </>
  );
}
