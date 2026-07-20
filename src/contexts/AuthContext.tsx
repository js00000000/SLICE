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
  getRedirectResult,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  signOut,
  deleteUser,
  GoogleAuthProvider,
} from 'firebase/auth';
import type { User, AuthError, UserCredential } from 'firebase/auth';
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, googleProvider, lineProvider, LINE_PROVIDER_ID, db } from '../lib/firebase';
import { firebaseService } from '../lib/firebaseService';
import { AbandonGuestConfirmationModal } from '../components/MergeConfirmationModal';
import { fetchUserGeolocation } from '../utils/geolocation';
import type { UserSettings } from '../types';

interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  googleLoading: boolean;
  lineLoading: boolean;
  guestLoading: boolean;
  deleteLoading: boolean;
  isSoftLoggedOut: boolean;
  handleGoogleLogin: () => Promise<void>;
  handleLineLogin: () => Promise<void>;
  handleGuestLogin: () => Promise<void>;
  handleQuickStart: () => Promise<void>;
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
  const [lineLoading, setLineLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAbandonGuestConfirm, setShowAbandonGuestConfirm] = useState(false);
  const [abandonProvider, setAbandonProvider] = useState<'Google' | 'LINE'>('Google');
  const [isSoftLoggedOut, setIsSoftLoggedOut] = useState(() => localStorage.getItem('is_soft_logged_out') === 'true');

  const saveGoogleToken = (result: UserCredential) => {
    try {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_access_token', credential.accessToken);
      }
    } catch (err) {
      console.error("Error saving Google token:", err);
    }
  };

  const revokeGoogleToken = async () => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          mode: 'no-cors'
        });
      } catch (err) {
        console.error("Error revoking Google token:", err);
      } finally {
        localStorage.removeItem('google_access_token');
      }
    }
  };

  useEffect(() => {
    // Handle redirect result (for cases where popup was blocked)
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          saveGoogleToken(result);
        }
      })
      .catch((error: unknown) => {
        console.error("Redirect error catch:", error);
        const authErr = error as AuthError;
        if (authErr.code === 'auth/credential-already-in-use') {
          // If they tried to link an account that already exists via redirect, 
          // we show the confirmation instead of auto-signing in
          setShowAbandonGuestConfirm(true);
        } else {
          toast.error(t('common.error'));
        }
      });

    const ensureUserDocumentExists = async (currentUser: User) => {
      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        let loginMethod = 'anonymous';
        if (!currentUser.isAnonymous) {
          const mainProvider = currentUser.providerData[0]?.providerId;
          if (mainProvider === 'google.com') {
            loginMethod = 'google';
          } else if (mainProvider === LINE_PROVIDER_ID || mainProvider?.includes('line')) {
            loginMethod = 'line';
          } else {
            loginMethod = mainProvider || 'google';
          }
        }
        
        // Fetch country with explicit try-catch and safe fallback so it NEVER blocks login or register
        let detectedCountry: string | null = null;
        try {
          const geoInfo = await fetchUserGeolocation();
          detectedCountry = geoInfo.countryCode;
        } catch (geoError) {
          console.warn("Non-blocking error during geo fetch:", geoError);
        }
        
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            lastGroupId: null,
            joinedGroupIds: [],
            createdOn: serverTimestamp(),
            lastLoginOn: serverTimestamp(),
            isAnonymous: currentUser.isAnonymous,
            loginMethod: loginMethod,
            country: detectedCountry,
          });
        } else {
          const data = userDocSnap.data() as UserSettings;
          await updateDoc(userDocRef, {
            lastLoginOn: serverTimestamp(),
            isAnonymous: currentUser.isAnonymous,
            loginMethod: loginMethod,
            country: detectedCountry || data.country || null,
            ...(!data.createdOn ? { createdOn: serverTimestamp() } : {})
          });
        }
      } catch (err) {
        console.error("Error ensuring user document exists:", err);
      }
    };

    // Fallback: in some environments (in-app webviews with storage/cookies
    // blocked, flaky init) onAuthStateChanged may never fire, which would leave
    // the app stuck on the loading spinner forever. After a short timeout we
    // stop blocking and fall through to the login UI so the user can act. If
    // the listener fires later, it still sets state normally.
    let authResolved = false;
    const authTimeout = window.setTimeout(() => {
      if (!authResolved) {
        console.warn("Auth state did not resolve in time; releasing loading gate.");
        setAuthLoading(false);
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      authResolved = true;
      window.clearTimeout(authTimeout);
      setUser(currentUser);
      if (currentUser) {
        ensureUserDocumentExists(currentUser);
      }
      // If a non-anonymous user signs in, clear soft logout state
      if (currentUser && !currentUser.isAnonymous) {
        setIsSoftLoggedOut(false);
        localStorage.removeItem('is_soft_logged_out');
      }
      setAuthLoading(false);
    });
    return () => {
      window.clearTimeout(authTimeout);
      unsubscribe();
    };
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
        // Delete all members and their membership index entries in the group
        const membersSnap = await getDocs(collection(db, 'groups', gid, 'members'));
        for (const memberDoc of membersSnap.docs) {
          await deleteDoc(memberDoc.ref);
          const memberUserId = memberDoc.data().userId as string | null | undefined;
          if (memberUserId) {
            await deleteDoc(doc(db, 'groups', gid, 'claimedUserIds', memberUserId));
          }
        }
        // Delete the join-token lookup doc while the group doc still exists
        // (rules verify createdBy against the live group)
        const groupJoinId = groupDoc.data().joinId as string | undefined;
        if (groupJoinId) {
          await deleteDoc(doc(db, 'joinIds', groupJoinId));
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

      // 3. Clear userId from members in other groups the user joined but didn't create,
      //    and remove their membership index entry
      for (const gid of joinedGroupIds) {
        if (deletedGroupIds.has(gid)) continue;

        try {
          const membersRef = collection(db, 'groups', gid, 'members');
          const membersSnap = await getDocs(query(membersRef, where('userId', '==', uid)));
          for (const memberDoc of membersSnap.docs) {
            await updateDoc(memberDoc.ref, { userId: null });
          }
          await deleteDoc(doc(db, 'groups', gid, 'claimedUserIds', uid));
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
      localStorage.removeItem('is_soft_logged_out');
      
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          const result = await linkWithPopup(auth.currentUser, googleProvider);
          saveGoogleToken(result);
          await auth.currentUser.reload();
          setUser(Object.create(
            Object.getPrototypeOf(auth.currentUser),
            Object.getOwnPropertyDescriptors(auth.currentUser)
          ));
          toast.success(t('profile.google_link_success'));
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await linkWithRedirect(auth.currentUser, googleProvider);
          } else if (error.code === 'auth/credential-already-in-use') {
            // Google account already exists, show confirmation before switching
            setAbandonProvider('Google');
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
          const result = await signInWithPopup(auth, googleProvider);
          saveGoogleToken(result);
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

  const handleLineLogin = async () => {
    try {
      setLineLoading(true);

      // If they were a guest and soft-logged out, we sign out completely
      // so this LINE login is treated as a fresh start, not a link attempt.
      if (isSoftLoggedOut && auth.currentUser?.isAnonymous) {
        await signOut(auth);
      }

      setIsSoftLoggedOut(false);
      localStorage.removeItem('is_soft_logged_out');

      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, lineProvider);
          await auth.currentUser.reload();
          setUser(Object.create(
            Object.getPrototypeOf(auth.currentUser),
            Object.getOwnPropertyDescriptors(auth.currentUser)
          ));
          toast.success(t('profile.line_link_success'));
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await linkWithRedirect(auth.currentUser, lineProvider);
          } else if (error.code === 'auth/credential-already-in-use') {
            // LINE account already exists, show confirmation before switching
            setAbandonProvider('LINE');
            setShowAbandonGuestConfirm(true);
          } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.log("LINE login popup closed by user");
          } else {
            throw error;
          }
        }
      } else if (auth.currentUser && !auth.currentUser.isAnonymous) {
        try {
          await linkWithPopup(auth.currentUser, lineProvider);
          await auth.currentUser.reload();
          setUser(Object.create(
            Object.getPrototypeOf(auth.currentUser),
            Object.getOwnPropertyDescriptors(auth.currentUser)
          ));
          toast.success(t('profile.line_link_success'));
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await linkWithRedirect(auth.currentUser, lineProvider);
          } else if (error.code === 'auth/credential-already-in-use') {
            toast.error(t('auth.line_already_linked_error') || t('auth.account_exists'));
          } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.log("LINE link popup closed by user");
          } else {
            throw error;
          }
        }
      } else {
        try {
          await signInWithPopup(auth, lineProvider);
        } catch (err: unknown) {
          const error = err as AuthError;
          if (error.code === 'auth/popup-blocked') {
            await signInWithRedirect(auth, lineProvider);
          } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            console.log("LINE login popup closed by user");
          } else {
            throw error;
          }
        }
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("LINE login error:", error);
      toast.error(t('common.error'));
    } finally {
      setLineLoading(false);
    }
  };

  const handleQuickStart = async () => {
    try {
      setGuestLoading(true);
      if (!auth.currentUser) {
        const result = await signInAnonymously(auth);
        
        const defaultGroupName = t('groups.default_group_name', { defaultValue: '未命名旅程' });
        const defaultHostName = t('groups.default_host_name', { defaultValue: 'Me' });
        
        try {
          const groupId = await firebaseService.createGroup(
            result.user.uid,
            defaultGroupName,
            defaultHostName
          );
          navigate(`/group/${groupId}`);
        } catch (err) {
          console.error("Auto-create group error:", err);
        }
      }
      setIsSoftLoggedOut(false);
      localStorage.removeItem('is_soft_logged_out');
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Quick start error:", error);
      toast.error(t('common.error'));
    } finally {
      setGuestLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setGuestLoading(true);
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      setIsSoftLoggedOut(false);
      localStorage.removeItem('is_soft_logged_out');
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Guest login error:", error);
      toast.error(t('common.error'));
    } finally {
      setGuestLoading(false);
    }
  };

  const confirmAbandon = async () => {
    const isLine = abandonProvider === 'LINE';
    const provider = isLine ? lineProvider : googleProvider;
    const setLoading = isLine ? setLineLoading : setGoogleLoading;
    try {
      setLoading(true);
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

      // 6. Sign in with Provider
      try {
        await signInWithPopup(auth, provider);
      } catch (err: unknown) {
        const popupError = err as AuthError;
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
        } else if (popupError.code === 'auth/popup-closed-by-user' || popupError.code === 'auth/cancelled-popup-request') {
          console.log(`${abandonProvider} login popup closed by user during abandon confirmation`);
        } else {
          throw popupError;
        }
      }
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Confirm abandon error:", error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (user?.isAnonymous) {
        setIsSoftLoggedOut(true);
        localStorage.setItem('is_soft_logged_out', 'true');
      } else {
        await signOut(auth);
        setUser(null);
        localStorage.removeItem('is_soft_logged_out');
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
    
    const currentUser = auth.currentUser;
    const uid = currentUser.uid;

    try {
      setDeleteLoading(true);

      // Navigate away from any /group/:id URL first so the group-doc snapshot
      // listener doesn't fire a "group not found" toast when cleanupUserData
      // deletes the user's groups below.
      navigate('/');

      // For Google users, revoke the stored token if it exists without showing a popup
      if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
        try {
          await revokeGoogleToken();
        } catch (revokeErr) {
          console.warn("Revoke token error (ignoring during deletion):", revokeErr);
        }
      }

      // 2. Clean up Firestore data while still authenticated
      await cleanupUserData(uid);

      // 3. Delete from Auth
      await deleteUser(currentUser);

      setUser(null);
      toast.success(t('auth.delete_account_success'));
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
          try {
            // Prompt Google popup login to re-authenticate only when required
            const result = await reauthenticateWithPopup(currentUser, googleProvider);
            saveGoogleToken(result);
            // Retry deletion
            await deleteUser(currentUser);
            setUser(null);
            toast.success(t('auth.delete_account_success'));
          } catch (reauthErr: unknown) {
            const reauthError = reauthErr as AuthError;
            if (reauthError.code === 'auth/popup-blocked') {
              await reauthenticateWithRedirect(currentUser, googleProvider);
            } else if (reauthError.code === 'auth/popup-closed-by-user' || reauthError.code === 'auth/cancelled-popup-request') {
              console.log("Deletion re-authentication popup closed by user");
            } else {
              toast.error(t('common.error'));
            }
          }
        } else if (currentUser.providerData.some(p => p.providerId === LINE_PROVIDER_ID || p.providerId.includes('line'))) {
          try {
            await reauthenticateWithPopup(currentUser, lineProvider);
            await deleteUser(currentUser);
            setUser(null);
            toast.success(t('auth.delete_account_success'));
          } catch (reauthErr: unknown) {
            const reauthError = reauthErr as AuthError;
            if (reauthError.code === 'auth/popup-blocked') {
              await reauthenticateWithRedirect(currentUser, lineProvider);
            } else if (reauthError.code === 'auth/popup-closed-by-user' || reauthError.code === 'auth/cancelled-popup-request') {
              console.log("Deletion re-authentication popup closed by user");
            } else {
              toast.error(t('common.error'));
            }
          }
        } else {
          toast.error(t('auth.requires_recent_login_msg') || 'Please re-login before deleting your account for security reasons.');
        }
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      authLoading, 
      googleLoading, 
      lineLoading,
      guestLoading, 
      deleteLoading,
      isSoftLoggedOut,
      handleGoogleLogin, 
      handleLineLogin,
      handleGuestLogin, 
      handleQuickStart,
      handleLogout,
      handleDeleteAccount
    }}>
      {children}
      {showAbandonGuestConfirm && (
        <AbandonGuestConfirmationModal
          onClose={() => setShowAbandonGuestConfirm(false)}
          onConfirm={confirmAbandon}
          providerName={abandonProvider}
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

