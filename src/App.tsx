import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { LoadingView } from './components/LoadingView';
import { LoginView } from './components/LoginView';
import { AuthGuard } from './components/ProtectedRoute';
import { WebviewWarning } from './components/WebviewWarning';
import { detectWebview } from './utils/webview';
import { APP_NAME } from './constants';

// Import Pages
import { GroupSelectionPage } from './pages/GroupSelectionPage';
import { MemberSelectionPage } from './pages/MemberSelectionPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { GroupManagementPage } from './pages/GroupManagementPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import { LandingPage } from './pages/LandingPage';

// Import Hooks
import { useAuth } from './contexts/AuthContext';
import { useGroup } from './contexts/GroupContext';

const isValidRoute = (pathname: string): boolean => {
  if (pathname === '/' || pathname === '') return true;
  if (/^\/join\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/expenses\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/settlements\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/members\/?$/.test(pathname)) return true;
  return false;
};

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const webviewInfo = useMemo(() => detectWebview(), []);
  const { 
    user, authLoading, googleLoading, guestLoading, isSoftLoggedOut, 
    handleGoogleLogin, handleGuestLogin, handleQuickStart
  } = useAuth();
  const { currentMemberId, currentMember, isLoading } = useGroup();

  const [invalidUrlGroup, setInvalidUrlGroup] = useState<string | null>(null);
  const [checkingUrlGroup, setCheckingUrlGroup] = useState(false);

  // Check if a group exists before letting unauthenticated users stay on protected URLs
  useEffect(() => {
    if (user && !isSoftLoggedOut) {
      setInvalidUrlGroup(null);
      return;
    }

    const match = location.pathname.match(/^\/(join|group)\/([^/]+)/);
    const urlGroupId = match ? match[2] : null;

    if (!urlGroupId) {
      setInvalidUrlGroup(null);
      return;
    }

    let isMounted = true;
    setCheckingUrlGroup(true);

    const checkGroup = async () => {
      try {
        const groupRef = doc(db, 'groups', urlGroupId);
        const docSnap = await getDoc(groupRef);
        if (isMounted) {
          if (!docSnap.exists()) {
            setInvalidUrlGroup(urlGroupId);
            toast.error(t('common.error_group_not_found'));
          } else {
            setInvalidUrlGroup(null);
          }
          setCheckingUrlGroup(false);
        }
      } catch (err) {
        console.error("Error checking group existence:", err);
        if (isMounted) {
          setCheckingUrlGroup(false);
        }
      }
    };

    checkGroup();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, user, isSoftLoggedOut, t]);

  // Manual title fallback for login and loading states
  useEffect(() => {
    if (authLoading) {
      document.title = APP_NAME;
    } else if (!user || isSoftLoggedOut) {
      document.title = t('common.seo_title') || APP_NAME;
    }
  }, [user, isSoftLoggedOut, authLoading, t]);

  if (webviewInfo.isWebview) {
    return <WebviewWarning brand={webviewInfo.brand} os={webviewInfo.os} />;
  }

  if (authLoading || checkingUrlGroup) return (
    <div className="mobile-container">
      <Helmet>
        <title>{APP_NAME}</title>
      </Helmet>
      <LoadingView />
    </div>
  );
  
  if (!user || isSoftLoggedOut) {
    if (invalidUrlGroup) {
      return <Navigate to="/" replace />;
    }

    if (!isValidRoute(location.pathname)) {
      return <Navigate to="/" replace />;
    }

    const isRootPath = location.pathname === '/';
    
    if (isRootPath) {
      return (
        <>
          <Helmet>
            <html lang={i18n.resolvedLanguage || i18n.language || 'en'} />
            <title>{t('common.seo_title')}</title>
            <meta property="og:title" content={t('common.seo_title')} />
            <meta property="og:description" content={t('common.seo_description')} />
            <meta property="og:locale" content={i18n.resolvedLanguage?.startsWith('zh') ? 'zh_TW' : 'en_US'} />
            <meta property="twitter:title" content={t('common.seo_title')} />
            <meta property="twitter:description" content={t('common.seo_description')} />
          </Helmet>
          <LandingPage
            onGoogleLogin={handleGoogleLogin}
            onQuickStart={handleQuickStart}
            isGoogleLoading={googleLoading}
            isGuestLoading={guestLoading}
          />
        </>
      );
    }

    return (
      <div className="mobile-container">
        <Helmet>
          <html lang={i18n.resolvedLanguage || i18n.language || 'en'} />
          <title>{t('common.seo_title')}</title>
        </Helmet>
        <LoginView
          onGoogleLogin={handleGoogleLogin}
          onGuestLogin={handleGuestLogin}
          onQuickStart={handleQuickStart}
          showQuickStart={false}
          isGoogleLoading={googleLoading}
          isGuestLoading={guestLoading}
        />
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <Helmet>
        <html lang={i18n.resolvedLanguage || i18n.language || 'en'} />
        <title>{APP_NAME}</title>
        <meta name="description" content={t('common.seo_description')} />
        <meta property="og:title" content={t('common.seo_title') || APP_NAME} />
        <meta property="og:description" content={t('common.seo_description')} />
        <meta property="og:locale" content={i18n.resolvedLanguage?.startsWith('zh') ? 'zh_TW' : 'en_US'} />
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
                <DashboardPage />
              )
            } />
            <Route path="/group/:groupId/expenses" element={
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

            <Route path="/group/:groupId/members" element={<GroupManagementPage />} />
            <Route path="/join/:groupId" element={<JoinGroupPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}
