import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthErrorView } from './components/AuthErrorView';
import { LoadingView } from './components/LoadingView';
import { LoginView } from './components/LoginView';

// Import Pages
import { GroupSelectionPage } from './pages/GroupSelectionPage';
import { MemberSelectionPage } from './pages/MemberSelectionPage';
import { GroupDashboard } from './pages/GroupDashboard';
import { MemberManagementPage } from './pages/MemberManagementPage';
import { JoinGroupPage } from './pages/JoinGroupPage';

// Import Hooks
import { useAuth } from './contexts/AuthContext';
import { useGroup } from './contexts/GroupContext';

export default function App() {
  const { user, authLoading, authError, handleGoogleLogin, handleGuestLogin } = useAuth();
  const { currentMemberId, currentMember, isLoading } = useGroup();

  if (authError) return <AuthErrorView error={authError} />;
  if (authLoading) return <LoadingView />;
  if (!user) return <LoginView onGoogleLogin={handleGoogleLogin} onGuestLogin={handleGuestLogin} />;
  if (isLoading) return <LoadingView />;

  return (
    <Routes>
      <Route path="/" element={<GroupSelectionPage />} />
      
      <Route path="/group/:groupId" element={
        !currentMemberId || !currentMember ? (
          <MemberSelectionPage />
        ) : (
          <GroupDashboard />
        )
      } />

      <Route path="/group/:groupId/members" element={<MemberManagementPage />} />

      <Route path="/join/:groupId" element={<JoinGroupPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
