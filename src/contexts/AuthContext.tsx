import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  linkWithPopup,
  linkWithRedirect,
  unlink,
  getRedirectResult,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  signOut,
  deleteUser,
} from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { AbandonGuestConfirmationModal } from '../components/MergeConfirmationModal';
import type { UserSettings } from '../types';

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  googleLoading: boolean;
  guestLoading: boolean;
  isSoftLoggedOut: boolean;
  handleGoogleLogin: () => Promise<void>;
  handleGuestLogin: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showAbandonGuestConfirm, setShowAbandonGuestConfirm] = useState(false);
  const [isSoftLoggedOut, setIsSoftLoggedOut] = useState(false);

  useEffect(() => {
    // Handle redirect result (for cases where popup was blocked)
    getRedirectResult(auth).catch((error: unknown) => {
      console.error("Redirect error catch:", error);
      const authErr = error as AuthError;
      if (authErr.code === 'auth/credential-already-in-use') {
        // If they tried to link a Google account that already exists via redirect, 
        // we show the confirmation instead of auto-signing in
        setShowAbandonGuestConfirm(true);
      } else {
        toast.error(t('common.error'));
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // If a non-anonymous user signs in, clear soft logout state
      if (currentUser && !currentUser.isAnonymous) {
        setIsSoftLoggedOut(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [t]);

  const cleanupUserData = async (uid: string) => {
    // 1. Find all groups created by this user
    const createdGroupsQuery = query(collection(db, 'groups'), where('createdBy', '==', uid));
    const createdGroupsSnap = await getDocs(createdGroupsQuery);
    const deletedGroupIds = new Set<string>();

    for (const groupDoc of createdGroupsSnap.docs) {
      const gid = groupDoc.id;
      try {
        // Delete all expenses in the group
        const expensesSnap = await getDocs(collection(db, 'groups', gid, 'expenses'));
        for (const expDoc of expensesSnap.docs) {
          await deleteDoc(expDoc.ref);
        }
        // Delete all members in the group
        const membersSnap = await getDocs(collection(db, 'groups', gid, 'members'));
        for (const memberDoc of membersSnap.docs) {
          await deleteDoc(memberDoc.ref);
        }
        // Finally delete the group document
        await deleteDoc(groupDoc.ref);
        deletedGroupIds.add(gid);
      } catch (err) {
        console.error(`Error deleting group ${gid} and its data:`, err);
      }
    }

    // 2. Get user settings to find other joined groups
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserSettings;
      const joinedGroupIds = userData.joinedGroupIds || [];

      // 3. Clear userId from members in other groups the user joined but didn't create
      for (const gid of joinedGroupIds) {
        if (deletedGroupIds.has(gid)) continue;

        try {
          const membersRef = collection(db, 'groups', gid, 'members');
          const membersSnap = await getDocs(query(membersRef, where('userId', '==', uid)));
          for (const memberDoc of membersSnap.docs) {
            await updateDoc(memberDoc.ref, { userId: null });
          }
        } catch (err) {
          console.error(`Error clearing userId in group ${gid}:`, err);
        }
      }

      // 4. Delete user document
      await deleteDoc(doc(db, 'users', uid));
    } else {
      // Fallback: try to delete anyway to be safe
      await deleteDoc(doc(db, 'users', uid));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      // If they were a guest and soft-logged out, we sign out completely
      // so this Google login is treated as a fresh start, not a link attempt.
      if (isSoftLoggedOut && auth.currentUser?.isAnonymous) {
        await signOut(auth);
      }

      setIsSoftLoggedOut(false);
      
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, googleProvider);
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await linkWithRedirect(auth.currentUser, googleProvider);
          } else if (error.code === 'auth/credential-already-in-use') {
            // Google account already exists, show confirmation before switching
            setShowAbandonGuestConfirm(true);
          } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            // User closed the popup, just reset loading state
            console.log("Google login popup closed by user");
          } else {
            throw error;
          }
        }
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, googleProvider);
          } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            // User closed the popup, just reset loading state
            console.log("Google login popup closed by user");
          } else {
            throw error;
          }
        }
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Google login error:", error);
      toast.error(t('common.error'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setGuestLoading(true);
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      setIsSoftLoggedOut(false);
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Guest login error:", error);
      toast.error(t('common.error'));
    } finally {
      setGuestLoading(false);
    }
  };

  const confirmAbandon = async () => {
    try {
      setGoogleLoading(true);
      setShowAbandonGuestConfirm(false);

      const guestUser = auth.currentUser;
      if (guestUser && guestUser.isAnonymous) {
        const guestUid = guestUser.uid;
        await cleanupUserData(guestUid);
        // 5. Delete the guest user from Auth
        await deleteUser(guestUser).catch(err => {
          console.error("Error deleting guest user from Auth:", err);
        });
      }

      // 6. Sign in with Google
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err: unknown) {
        const popupError = err as AuthError;
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, googleProvider);
        } else if (popupError.code === 'auth/popup-closed-by-user' || popupError.code === 'auth/cancelled-popup-request') {
          // User closed the popup, just reset loading state
          console.log("Google login popup closed by user during abandon confirmation");
        } else {
          throw popupError;
        }
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Confirm abandon error:", error);
      toast.error(t('common.error'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.isAnonymous) {
        setIsSoftLoggedOut(true);
      } else {
        await signOut(auth);
        setUser(null);
      }
      toast.success(t('auth.logout'));
      navigate('/');
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Logout error:", error);
      toast.error(t('common.error'));
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    
    try {
      setAuthLoading(true);
      const currentUser = auth.currentUser;
      const uid = currentUser.uid;

      // 1. For Google users, re-authenticate first to avoid requires-recent-login
      if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
        try {
          await reauthenticateWithPopup(currentUser, googleProvider);
          // Explicitly unlink Google provider as requested by user
          try {
            await unlink(currentUser, 'google.com');
          } catch (unlinkErr) {
            console.warn("Unlink error (ignoring during deletion):", unlinkErr);
          }
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await reauthenticateWithRedirect(currentUser, googleProvider);
            return; // Redirect will happen, execution stops here
          } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            setAuthLoading(false);
            return;
          }
          throw error;
        }
      }

      // 2. Clean up Firestore data while still authenticated
      await cleanupUserData(uid);

      // 3. Delete from Auth
      await deleteUser(currentUser);
      
      setUser(null);
      toast.success(t('auth.delete_account_success'));
      navigate('/');
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error(t('auth.requires_recent_login_msg') || 'Please re-login before deleting your account for security reasons.');
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      authLoading, 
      googleLoading, 
      guestLoading, 
      isSoftLoggedOut,
      handleGoogleLogin, 
      handleGuestLogin, 
      handleLogout,
      handleDeleteAccount
    }}>
      {children}
      {showAbandonGuestConfirm && (
        <AbandonGuestConfirmationModal
          onClose={() => setShowAbandonGuestConfirm(false)}
          onConfirm={confirmAbandon}
        />
      )}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

