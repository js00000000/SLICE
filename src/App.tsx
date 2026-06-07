import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { LoadingView } from './components/LoadingView';
import { LoginView } from './components/LoginView';
import { AuthGuard } from './components/ProtectedRoute';
import { APP_NAME } from './constants';

// Import Pages
import { GroupSelectionPage } from './pages/GroupSelectionPage';
import { MemberSelectionPage } from './pages/MemberSelectionPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { MemberManagementPage } from './pages/MemberManagementPage';
import { JoinGroupPage } from './pages/JoinGroupPage';

// Import Hooks
import { useAuth } from './contexts/AuthContext';
import { useGroup } from './contexts/GroupContext';

export default function App() {
  const { t, i18n } = useTranslation();
  const { 
    user, authLoading, googleLoading, guestLoading, isSoftLoggedOut, 
    handleGoogleLogin, handleGuestLogin, handleQuickStart
  } = useAuth();
  const { currentMemberId, currentMember, isLoading } = useGroup();

  // Manual title fallback for login and loading states
  useEffect(() => {
    if (authLoading) {
      document.title = APP_NAME;
    } else if (!user || isSoftLoggedOut) {
      document.title = t('common.seo_title') || APP_NAME;
    }
  }, [user, isSoftLoggedOut, authLoading, t]);

  if (authLoading) return (
    <div className="mobile-container">
      <Helmet>
        <title>{APP_NAME}</title>
      </Helmet>
      <LoadingView />
    </div>
  );
  
  if (!user || isSoftLoggedOut) return (
    <div className="mobile-container">
      <Helmet>
        <html lang={i18n.language || 'en'} />
        <title>{t('common.seo_title')}</title>
      </Helmet>
      <LoginView
        onGoogleLogin={handleGoogleLogin}
        onGuestLogin={handleGuestLogin}
        onQuickStart={handleQuickStart}
        showQuickStart={!isSoftLoggedOut && window.location.pathname === '/'}
        isGoogleLoading={googleLoading}
        isGuestLoading={guestLoading}
      />
    </div>
  );

  return (
    <div className="mobile-container">
      <Helmet>
        <html lang={i18n.language || 'en'} />
        <title>{APP_NAME}</title>
        <meta name="description" content={t('common.seo_description')} />
        <meta property="og:title" content={t('common.seo_title') || APP_NAME} />
        <meta property="og:description" content={t('common.seo_description')} />
        <meta property="twitter:title" content={t('common.seo_title') || APP_NAME} />
        <meta property="twitter:description" content={t('common.seo_description')} />
      </Helmet>
      
      {isLoading ? (
        <LoadingView />
      ) : (
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/" element={<GroupSelectionPage />} />

            <Route path="/group/:groupId" element={
              !currentMemberId || !currentMember ? (
                <MemberSelectionPage />
              ) : (
                <ExpensesPage />
              )
            } />
            <Route path="/group/:groupId/settlements" element={
              !currentMemberId || !currentMember ? (
                <MemberSelectionPage />
              ) : (
                <SettlementsPage />
              )
            } />

            <Route path="/group/:groupId/members" element={<MemberManagementPage />} />
            <Route path="/join/:groupId" element={<JoinGroupPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}
