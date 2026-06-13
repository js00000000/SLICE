import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { firebaseService } from './lib/firebaseService';
import { LoadingView } from './components/LoadingView';
import { LoginView } from './components/LoginView';
import { AuthGuard } from './components/ProtectedRoute';
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
import { LegalPage } from './pages/LegalPage';

// Import Hooks
import { useAuth } from './contexts/AuthContext';
import { useGroup } from './contexts/GroupContext';
import { useDialog } from './contexts/DialogContext';
import { isWebview } from './utils/webview';

const isValidRoute = (pathname: string): boolean => {
  if (pathname === '/' || pathname === '') return true;
  if (pathname === '/privacy' || pathname === '/terms') return true;
  if (/^\/join\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/expenses\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/settlements\/?$/.test(pathname)) return true;
  if (/^\/group\/[^/]+\/members\/?$/.test(pathname)) return true;
  return false;
};

const WEBVIEW_WARNED_KEY = 'slice_webview_warned';

export default function App() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { alert } = useDialog();
  const {
    user, authLoading, googleLoading, guestLoading, isSoftLoggedOut,
    handleGoogleLogin, handleGuestLogin, handleQuickStart
  } = useAuth();
  const { currentMemberId, currentMember, isLoading } = useGroup();

  const [invalidUrlGroup, setInvalidUrlGroup] = useState<string | null>(null);
  const [checkingUrlGroup, setCheckingUrlGroup] = useState(false);

  useEffect(() => {
    if (!isWebview()) return;
    if (sessionStorage.getItem(WEBVIEW_WARNED_KEY)) return;
    sessionStorage.setItem(WEBVIEW_WARNED_KEY, '1');
    alert(t('webview.message'), { title: t('webview.title'), confirmLabel: t('common.confirm') });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if a group exists before letting unauthenticated users stay on protected URLs.
  // For /join/:joinId we resolve the public join token. For /group/:groupId we still
  // do an existence check (the in-app membership gate lives in GroupContext).
  useEffect(() => {
    // Wait until auth state is known. Otherwise we may start the check as an
    // anonymous user, then have the effect re-run when auth completes — the
    // early-return path below would leave `checkingUrlGroup` stuck at true.
    if (authLoading) return;

    if (user && !isSoftLoggedOut) {
      setInvalidUrlGroup(null);
      setCheckingUrlGroup(false);
      return;
    }

    const joinMatch = location.pathname.match(/^\/join\/([^/]+)/);
    const groupMatch = location.pathname.match(/^\/group\/([^/]+)/);
    const urlToken = joinMatch ? joinMatch[1] : groupMatch ? groupMatch[1] : null;

    if (!urlToken) {
      setInvalidUrlGroup(null);
      setCheckingUrlGroup(false);
      return;
    }

    let isMounted = true;
    setCheckingUrlGroup(true);

    const checkGroup = async () => {
      try {
        let exists = false;
        if (joinMatch) {
          const resolvedGroupId = await firebaseService.resolveJoinId(urlToken);
          exists = resolvedGroupId !== null;
        } else {
          const docSnap = await getDoc(doc(db, 'groups', urlToken));
          exists = docSnap.exists();
        }
        if (isMounted) {
          if (!exists) {
            setInvalidUrlGroup(urlToken);
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
  }, [location.pathname, user, isSoftLoggedOut, authLoading, t]);

  // Manual title fallback for login and loading states
  useEffect(() => {
    if (authLoading) {
      document.title = APP_NAME;
    } else if (!user || isSoftLoggedOut) {
      document.title = t('common.seo_title') || APP_NAME;
    }
  }, [user, isSoftLoggedOut, authLoading, t]);

  // Legal pages render regardless of auth state, ahead of the loading gate.
  if (location.pathname === '/privacy') return <LegalPage kind="privacy" />;
  if (location.pathname === '/terms') return <LegalPage kind="terms" />;

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
            <meta name="title" content={t('common.seo_title')} />
            <meta name="description" content={t('common.seo_description')} />
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
          <meta name="title" content={t('common.seo_title')} />
          <meta name="description" content={t('common.seo_description')} />
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
        <meta name="title" content={t('common.seo_title') || APP_NAME} />
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
            <Route path="/join/:joinId" element={<JoinGroupPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}
