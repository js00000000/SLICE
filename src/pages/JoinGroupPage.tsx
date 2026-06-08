import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { LoadingView } from '../components/LoadingView';
import { APP_NAME } from '../constants';

export function JoinGroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, authLoading } = useAuth();
  const { handleJoinGroup } = useGroup();
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Manual title fallback
  useEffect(() => {
    if (error) {
      document.title = `${t('common.error')} - ${APP_NAME}`;
    } else {
      document.title = `${t('groups.join')} - ${APP_NAME}`;
    }
  }, [error, t]);

  useEffect(() => {
    // Wait for auth to initialize (handled by App's authLoading check, but safe here too)
    if (authLoading) return;

    if (user && groupId && !isJoining) {
      const join = async () => {
        setIsJoining(true);
        try {
          // handleJoinGroup in GroupContext already navigates to /group/:id on success
          await handleJoinGroup(groupId);
        } catch (err) {
          console.error("Auto-join error:", err);
          toast.error(t('common.error'));
          setError(t('common.error'));
          setIsJoining(false);
        }
      };
      join();
    }
  }, [user, groupId, handleJoinGroup, isJoining, authLoading, t]);

  if (error) {
    return (
      <div className="min-h-screen bg-page-bg flex flex-col items-center justify-center p-6 font-plus-jakarta select-none">
        <Helmet>
          <title>{t('common.error')} - {APP_NAME}</title>
        </Helmet>
        
        <div className="bg-white p-8 rounded-[24px] border-3 border-main-text text-center space-y-6 max-w-sm w-full shadow-[8px_8px_0px_#1A1A2E] animate-in zoom-in duration-200">
          <div className="w-16 h-16 bg-red-50 border-2 border-red-500 rounded-2xl flex items-center justify-center mx-auto rotate-[-4deg] text-red-500 font-nunito font-black text-2xl shadow-[2px_2px_0px_#1A1A2E]">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-nunito font-black text-red-600">{t('common.error')}</h2>
            <p className="text-gray-500 font-medium text-sm">{error}</p>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-accent-orange text-white border-2 border-main-text rounded-xl font-nunito font-black text-sm shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] cursor-pointer"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('groups.join')} - {APP_NAME}</title>
      </Helmet>
      <LoadingView message={t('common.loading')} />
    </>
  );
}
