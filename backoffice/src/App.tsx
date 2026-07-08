import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  deleteDoc,
  updateDoc,
  writeBatch,
  arrayRemove,
  where
} from "firebase/firestore";
import { 
  auth, 
  db, 
  googleProvider 
} from "./lib/firebase";
import { 
  Users, 
  Folder, 
  LogOut, 
  LogIn, 
  ShieldAlert, 
  Copy, 
  Check, 
  Search, 
  Info,
  ArrowRight, 
  X, 
  CheckCircle,
  LayoutDashboard,
  UserCheck,
  Trash2,
  AlertTriangle,
  UserX,
  FolderX,
  Menu
} from "lucide-react";

// Types matching SLICE schema
interface UserSettings {
  id: string;
  lastGroupId: string | null;
  joinedGroupIds?: string[];
  currentMemberId?: string | null;
  createdOn?: Timestamp | null;
  lastLoginOn?: Timestamp | null;
  isAnonymous?: boolean;
  loginMethod?: 'anonymous' | 'google';
  country?: string | null;
}

interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp | null;
  joinId?: string;
  settledAt?: Timestamp | null;
  settledBy?: string | null;
}

interface Member {
  id: string;
  name: string;
  userId?: string;
  isHost?: boolean;
  createdAt?: Timestamp | null;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  createdAt?: Timestamp | null;
}

interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  completedBy: string;
  completedAt?: Timestamp | null;
}

type TabKey = "dashboard" | "users" | "groups";

// Each tab is a real route so views are deep-linkable and browser back/forward works.
const TAB_TO_PATH: Record<TabKey, string> = {
  dashboard: "/",
  users: "/users",
  groups: "/groups",
};

const pathToTab = (pathname: string): TabKey =>
  pathname.startsWith("/users") ? "users" : pathname.startsWith("/groups") ? "groups" : "dashboard";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // `activeTab` is derived from the URL; `setActiveTab` navigates so every
  // existing call site keeps working while each view gets its own route.
  const activeTab = pathToTab(location.pathname);
  const setActiveTab = (tab: TabKey) => navigate(TAB_TO_PATH[tab]);

  const [menuOpen, setMenuOpen] = useState(false);
  
  // Data States
  const [usersList, setUsersList] = useState<UserSettings[]>([]);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Sorting States
  const [userSearch, setUserSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  
  const [userSortField, setUserSortField] = useState<"createdOn" | "lastLoginOn" | "joinedGroups" | "id">("createdOn");
  const [userSortOrder, setUserSortOrder] = useState<"asc" | "desc">("desc");
  const [groupSortField, setGroupSortField] = useState<"createdAt" | "name" | "settled" | "createdBy">("createdAt");
  const [groupSortOrder, setGroupSortOrder] = useState<"asc" | "desc">("desc");

  // Detailed view of a user
  const [selectedUser, setSelectedUser] = useState<UserSettings | null>(null);

  // Detailed view of a group
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Member[]>([]);
  const [selectedGroupExpenses, setSelectedGroupExpenses] = useState<Expense[]>([]);
  const [selectedGroupSettlements, setSelectedGroupSettlements] = useState<Settlement[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Deletion States
  const [userToDelete, setUserToDelete] = useState<UserSettings | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Bulk user selection & deletion
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ done: 0, total: 0 });

  // Auth monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check if UID is registered in 'admins' collection
          const adminDoc = await getDoc(doc(db, "admins", currentUser.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(null);
        setUsersList([]);
        setGroupsList([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all users and groups if admin
  const fetchData = async () => {
    if (!user || !isAdmin) return;
    setDataLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, "users"));
      const loadedUsers: UserSettings[] = [];
      usersSnap.forEach((d) => {
        const data = d.data();
        loadedUsers.push({
          id: d.id,
          lastGroupId: data.lastGroupId || null,
          joinedGroupIds: data.joinedGroupIds || [],
          currentMemberId: data.currentMemberId || null,
          createdOn: data.createdOn,
          lastLoginOn: data.lastLoginOn,
          isAnonymous: data.isAnonymous ?? false,
          loginMethod: data.loginMethod || "anonymous",
          country: data.country || null
        });
      });
      setUsersList(loadedUsers);

      // 2. Fetch Groups (sorted by createdAt desc if possible)
      const groupsSnap = await getDocs(query(collection(db, "groups"), orderBy("createdAt", "desc")));
      const loadedGroups: Group[] = [];
      groupsSnap.forEach((d) => {
        const data = d.data();
        loadedGroups.push({
          id: d.id,
          name: data.name || "未命名群組",
          createdBy: data.createdBy || "",
          createdAt: data.createdAt,
          joinId: data.joinId,
          settledAt: data.settledAt,
          settledBy: data.settledBy
        });
      });
      setGroupsList(loadedGroups);
    } catch (error) {
      console.error("Error fetching admin collections:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Fetch specific group subcollections (members, expenses, settlements)
  const fetchGroupDetails = async (group: Group) => {
    setSelectedGroup(group);
    setDetailsLoading(true);
    try {
      // 1. Fetch Members
      const membersSnap = await getDocs(collection(db, "groups", group.id, "members"));
      const members: Member[] = [];
      membersSnap.forEach((d) => {
        const data = d.data();
        members.push({
          id: d.id,
          name: data.name || "未命名成員",
          userId: data.userId,
          isHost: data.isHost || false,
          createdAt: data.createdAt
        });
      });
      setSelectedGroupMembers(members);

      // 2. Fetch Expenses
      const expensesSnap = await getDocs(collection(db, "groups", group.id, "expenses"));
      const expenses: Expense[] = [];
      expensesSnap.forEach((d) => {
        const data = d.data();
        expenses.push({
          id: d.id,
          description: data.description || "支出",
          amount: Number(data.amount) || 0,
          paidBy: data.paidBy || "",
          splitAmong: data.splitAmong || [],
          createdAt: data.createdAt
        });
      });
      setSelectedGroupExpenses(expenses);

      // 3. Fetch Settlements
      const settlementsSnap = await getDocs(collection(db, "groups", group.id, "settlements"));
      const settlements: Settlement[] = [];
      settlementsSnap.forEach((d) => {
        const data = d.data();
        settlements.push({
          id: d.id,
          from: data.from || "",
          to: data.to || "",
          amount: Number(data.amount) || 0,
          completedBy: data.completedBy || "",
          completedAt: data.completedAt
        });
      });
      setSelectedGroupSettlements(settlements);
    } catch (error) {
      console.error("Error fetching group details subcollections:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Groups related to a given user: ones they created + ones they joined
  const getRelatedGroups = (u: UserSettings) => {
    const createdSet = new Set<string>();
    const created = groupsList.filter(g => {
      if (g.createdBy === u.id) {
        createdSet.add(g.id);
        return true;
      }
      return false;
    });
    const joinedIds = new Set<string>([
      ...(u.joinedGroupIds || []),
      ...(u.lastGroupId ? [u.lastGroupId] : []),
    ]);
    const joined = groupsList.filter(g => joinedIds.has(g.id) && !createdSet.has(g.id));
    return { created, joined };
  };

  // Jump from the user detail modal into a group's detail view
  const handleViewGroupFromUser = (group: Group) => {
    setSelectedUser(null);
    setActiveTab("groups");
    fetchGroupDetails(group);
  };

  // Jump from the group detail modal into a bound member's user detail view
  const handleViewUserFromGroup = (userId: string | undefined) => {
    if (!userId) return;
    const target = usersList.find(u => u.id === userId);
    if (!target) {
      toast.error("找不到對應的使用者資料（可能已被刪除）。");
      return;
    }
    setSelectedGroup(null);
    setActiveTab("users");
    setSelectedUser(target);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setIsDeletingGroup(true);
    try {
      // 1. Delete all subcollections (members, expenses, settlements, membership index)
      const membersSnap = await getDocs(collection(db, "groups", groupId, "members"));
      const expensesSnap = await getDocs(collection(db, "groups", groupId, "expenses"));
      const settlementsSnap = await getDocs(collection(db, "groups", groupId, "settlements"));
      const claimedSnap = await getDocs(collection(db, "groups", groupId, "claimedUserIds"));

      const batch = writeBatch(db);

      membersSnap.forEach((mDoc) => {
        batch.delete(mDoc.ref);
      });

      expensesSnap.forEach((eDoc) => {
        batch.delete(eDoc.ref);
      });

      settlementsSnap.forEach((sDoc) => {
        batch.delete(sDoc.ref);
      });

      claimedSnap.forEach((cDoc) => {
        batch.delete(cDoc.ref);
      });

      // 2. Delete the join-token lookup doc, then the group doc itself
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      const joinId = groupSnap.exists() ? (groupSnap.data().joinId as string | undefined) : undefined;
      if (joinId) {
        batch.delete(doc(db, "joinIds", joinId));
      }
      batch.delete(doc(db, "groups", groupId));

      // Commit all deletions
      await batch.commit();

      // 3. Update all users' group references
      const usersToUpdate = usersList.filter(u => 
        u.lastGroupId === groupId || (u.joinedGroupIds && u.joinedGroupIds.includes(groupId))
      );

      for (const u of usersToUpdate) {
        const userRef = doc(db, "users", u.id);
        const updates: Record<string, unknown> = {};
        if (u.lastGroupId === groupId) {
          updates.lastGroupId = null;
        }
        if (u.joinedGroupIds && u.joinedGroupIds.includes(groupId)) {
          updates.joinedGroupIds = arrayRemove(groupId);
        }
        await updateDoc(userRef, updates);
      }

      // Close details if the deleted group was selected
      if (selectedGroup && selectedGroup.id === groupId) {
        setSelectedGroup(null);
      }

      setGroupToDelete(null);
      
      // Refresh list
      await fetchData();
      
      toast.success("群組及其所有子資料已成功刪除！");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("刪除群組失敗，請檢查權限或控制台日誌。");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // Core deletion routine for a single user and all related data.
  // Pure Firestore work — does NOT touch UI state or refresh the lists,
  // so it can be reused by both the single-user and bulk-delete flows.
  // `skipUserIds` lets bulk delete avoid updating references on users that
  // are themselves being deleted in the same batch.
  const deleteUserData = async (userId: string, skipUserIds?: Set<string>) => {
    // 1. Find user's settings to get joinedGroupIds
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    let joinedGroupIds: string[] = [];
    if (userSnap.exists()) {
      const data = userSnap.data();
      joinedGroupIds = data.joinedGroupIds || [];
    }

    // 2. Groups created by this user
    const groupsCreatedByUser = groupsList.filter(g => g.createdBy === userId);

    // Delete all groups created by this user
    for (const g of groupsCreatedByUser) {
      const membersSnap = await getDocs(collection(db, "groups", g.id, "members"));
      const expensesSnap = await getDocs(collection(db, "groups", g.id, "expenses"));
      const settlementsSnap = await getDocs(collection(db, "groups", g.id, "settlements"));
      const claimedSnap = await getDocs(collection(db, "groups", g.id, "claimedUserIds"));

      const batch = writeBatch(db);
      membersSnap.forEach((mDoc) => batch.delete(mDoc.ref));
      expensesSnap.forEach((eDoc) => batch.delete(eDoc.ref));
      settlementsSnap.forEach((sDoc) => batch.delete(sDoc.ref));
      claimedSnap.forEach((cDoc) => batch.delete(cDoc.ref));
      batch.delete(doc(db, "groups", g.id));
      await batch.commit();

      // Also clean references for other users of this deleted group
      // (skip users queued for deletion — their docs are going away anyway)
      const usersToUpdate = usersList.filter(u =>
        u.id !== userId &&
        !(skipUserIds && skipUserIds.has(u.id)) &&
        (u.lastGroupId === g.id || (u.joinedGroupIds && u.joinedGroupIds.includes(g.id)))
      );

      for (const u of usersToUpdate) {
        const otherUserRef = doc(db, "users", u.id);
        const updates: Record<string, unknown> = {};
        if (u.lastGroupId === g.id) {
          updates.lastGroupId = null;
        }
        if (u.joinedGroupIds && u.joinedGroupIds.includes(g.id)) {
          updates.joinedGroupIds = arrayRemove(g.id);
        }
        await updateDoc(otherUserRef, updates);
      }

      if (selectedGroup && selectedGroup.id === g.id) {
        setSelectedGroup(null);
      }
    }

    // 3. Unclaim this user from groups they joined but did not create.
    // We must NOT delete the member document: the member may appear in
    // existing expenses (payments/splits), and deleting the slot would orphan
    // those references and break settlement math (balances no longer sum to
    // zero). Instead we release the slot back to an unclaimed state (userId =
    // null), leaving the name and balance intact so the group host can later
    // reassign or delete it via the group UI (which blocks deletion while
    // unsettled).
    const groupsJoinedButNotCreated = joinedGroupIds.filter(groupId =>
      !groupsCreatedByUser.some(g => g.id === groupId)
    );

    for (const groupId of groupsJoinedButNotCreated) {
      try {
        const membersRef = collection(db, "groups", groupId, "members");
        const q = query(membersRef, where("userId", "==", userId));
        const qSnap = await getDocs(q);

        const batch = writeBatch(db);
        qSnap.forEach((memberDoc) => {
          batch.update(memberDoc.ref, { userId: null, updatedAt: new Date().toISOString() });
        });
        // Purge this user's membership-index entry (doc ID == uid). Idempotent
        // if it doesn't exist, so no need to check first.
        batch.delete(doc(db, "groups", groupId, "claimedUserIds", userId));
        await batch.commit();
      } catch (err) {
        console.error(`Error removing user ${userId} from group ${groupId}:`, err);
      }
    }

    // 4. Finally, delete the user doc itself
    await deleteDoc(userRef);
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeletingUser(true);
    try {
      await deleteUserData(userId);

      setUserToDelete(null);

      // Drop from any pending selection
      setSelectedUserIds(prev => {
        if (!prev.has(userId)) return prev;
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

      // Refresh list
      await fetchData();

      toast.success("使用者及其建立的相關群組已成功刪除！");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("刪除使用者失敗，請檢查權限或控制台日誌。");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Bulk-delete every currently selected user and all their related data.
  const handleBulkDeleteUsers = async () => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) return;

    const idSet = new Set(ids);
    setIsBulkDeleting(true);
    setBulkDeleteProgress({ done: 0, total: ids.length });

    let successCount = 0;
    const failedIds: string[] = [];

    for (const userId of ids) {
      try {
        await deleteUserData(userId, idSet);
        successCount += 1;
      } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        failedIds.push(userId);
      } finally {
        setBulkDeleteProgress(p => ({ ...p, done: p.done + 1 }));
      }
    }

    // Keep only failures selected so the operator can retry them
    setSelectedUserIds(new Set(failedIds));
    setShowBulkDeleteConfirm(false);
    setIsBulkDeleting(false);
    setBulkDeleteProgress({ done: 0, total: 0 });

    await fetchData();

    if (failedIds.length === 0) {
      toast.success(`已成功刪除 ${successCount} 位使用者及其相關資料！`);
    } else if (successCount === 0) {
      toast.error("批次刪除失敗，請檢查權限或控制台日誌。");
    } else {
      toast.error(`已刪除 ${successCount} 位，${failedIds.length} 位刪除失敗（仍保留於選取中）。`);
    }
  };

  // Selection helpers
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const clearUserSelection = () => setSelectedUserIds(new Set());

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format Helper
  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate();
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Formatting Currency (e.g., $1,000)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Get Country Display helper
  const getCountryDisplay = (code: string | null | undefined) => {
    if (!code) return "—";
    const upperCode = code.toUpperCase();
    
    // Map flag emojis using regional indicator symbols (e.g. A = 127397 + 65)
    let flag = "";
    try {
      flag = upperCode.replace(/./g, char => 
        String.fromCodePoint(char.charCodeAt(0) + 127397)
      );
    } catch {
      flag = "📍";
    }
    
    const names: Record<string, string> = {
      TW: "台灣",
      US: "美國",
      HK: "香港",
      JP: "日本",
      SG: "新加坡",
      CN: "中國",
      CA: "加拿大",
      GB: "英國",
      KR: "韓國",
      AU: "澳洲",
      DE: "德國",
      FR: "法國"
    };
    
    const name = names[upperCode] || upperCode;
    return `${flag} ${name}`;
  };

  // Filter & Sort Users List
  const filteredUsers = usersList
    .filter(u => {
      const s = userSearch.toLowerCase();
      return (
        u.id.toLowerCase().includes(s) ||
        (u.loginMethod || "anonymous").toLowerCase().includes(s) ||
        (u.country || "").toLowerCase().includes(s) ||
        (u.isAnonymous ? "anonymous" : "google").includes(s)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (userSortField === "createdOn" || userSortField === "lastLoginOn") {
        const timeA = a[userSortField]?.toMillis() || 0;
        const timeB = b[userSortField]?.toMillis() || 0;
        comparison = timeA - timeB;
      } else if (userSortField === "joinedGroups") {
        const countA = a.joinedGroupIds?.length || 0;
        const countB = b.joinedGroupIds?.length || 0;
        comparison = countA - countB;
      } else if (userSortField === "id") {
        comparison = a.id.localeCompare(b.id);
      }
      return userSortOrder === "asc" ? comparison : -comparison;
    });

  // Select-all state is scoped to the currently visible (filtered) rows
  const selectedVisibleCount = filteredUsers.reduce(
    (n, u) => (selectedUserIds.has(u.id) ? n + 1 : n),
    0
  );
  const allVisibleSelected = filteredUsers.length > 0 && selectedVisibleCount === filteredUsers.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleSelectAllVisible = () => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        // Unselect all currently visible rows
        filteredUsers.forEach(u => next.delete(u.id));
      } else {
        // Select all currently visible rows
        filteredUsers.forEach(u => next.add(u.id));
      }
      return next;
    });
  };

  // Users backing the current selection (may include rows filtered out of view)
  const selectedUsers = usersList.filter(u => selectedUserIds.has(u.id));
  const groupsToBeDeletedByBulk = groupsList.filter(g => selectedUserIds.has(g.createdBy));

  // Filter & Sort Groups List
  const filteredGroups = groupsList
    .filter(g => {
      const s = groupSearch.toLowerCase();
      return (
        g.name.toLowerCase().includes(s) ||
        g.id.toLowerCase().includes(s) ||
        (g.joinId && g.joinId.toLowerCase().includes(s))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (groupSortField === "createdAt") {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        comparison = timeA - timeB;
      } else if (groupSortField === "name") {
        comparison = a.name.localeCompare(b.name, "zh-TW");
      } else if (groupSortField === "settled") {
        const settledA = a.settledAt ? 1 : 0;
        const settledB = b.settledAt ? 1 : 0;
        comparison = settledA - settledB; // Unsettled first, settled last
      } else if (groupSortField === "createdBy") {
        comparison = a.createdBy.localeCompare(b.createdBy);
      }
      return groupSortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate high-level stats
  const totalUsersCount = usersList.length;
  const totalGroupsCount = groupsList.length;
  const anonymousUsersCount = usersList.filter(u => u.isAnonymous).length;
  const googleUsersCount = usersList.filter(u => !u.isAnonymous).length;

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-page-bg text-main-text">
        <div className="w-16 h-16 border-4 border-accent-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 font-nunito font-black text-xl tracking-wide">載入 SLICE 系統中...</p>
      </div>
    );
  }

  // 1. Unauthenticated Login View
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-page-bg">
        <div className="w-full max-w-md bg-white border-3 border-main-text rounded-2xl p-8 shadow-[6px_6px_0px_#1A1A2E]">
          <div className="flex justify-center mb-6">
            <span className="bg-accent-orange text-white text-3xl font-black font-nunito py-2 px-6 border-2 border-main-text rounded-xl shadow-[3px_3px_0px_#1A1A2E]">
              SLICE
            </span>
          </div>
          <h1 className="text-center text-2xl font-nunito font-black text-main-text mb-2">
            管理後台登入
          </h1>
          <p className="text-center text-sm text-gray-500 font-medium mb-8">
            此平台僅限 SLICE 系統管理員存取
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-accent-orange text-white font-nunito font-black text-lg py-3.5 px-6 border-3 border-main-text rounded-xl shadow-[4px_4px_0px_#1A1A2E] hover:bg-[#ff7e4e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce flex items-center justify-center gap-3 cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    );
  }

  // 2. Unauthorized View (Not Admin)
  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-page-bg">
        <div className="w-full max-w-lg bg-white border-3 border-main-text rounded-2xl p-8 shadow-[6px_6px_0px_#1A1A2E]">
          <div className="flex items-center gap-3 text-red-500 mb-4 justify-center">
            <ShieldAlert className="w-12 h-12 stroke-2" />
          </div>
          <h1 className="text-center text-2xl font-nunito font-black text-main-text mb-4">
            權限不足 Access Denied
          </h1>
          <div className="bg-orange-50 border-2 border-dashed border-accent-orange rounded-xl p-4 mb-6">
            <p className="text-sm leading-relaxed text-gray-700">
              您的 Google 帳號 <strong>{user.email}</strong> 尚未被註冊為 SLICE 的系統管理員。
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>您的管理員識別碼 (UID)：</strong>
              <span className="bg-white px-2 py-0.5 rounded border border-gray-300 select-all font-mono ml-1">{user.uid}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              若要啟用存取權，請在 Firestore <code>admins</code> 集合中，新增以您的 UID 為 ID 的文件。
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-white text-main-text font-nunito font-black text-lg py-3 px-6 border-3 border-main-text rounded-xl shadow-[4px_4px_0px_#1A1A2E] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce flex items-center justify-center gap-3 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            切換帳號 / 登出
          </button>
        </div>
      </div>
    );
  }

  // 3. Authorized Main Dashboard View
  return (
    <div className="flex flex-col min-h-screen bg-page-bg text-main-text font-plus-jakarta">

      {/* Top menu bar */}
      <header className="sticky top-0 z-40 bg-white border-b-3 border-main-text px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        {/* Logo — click to go home (dashboard) */}
        <button
          onClick={() => { setActiveTab("dashboard"); setMenuOpen(false); }}
          aria-label="回到主控台首頁"
          className="flex items-center gap-2 shrink-0 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] btn-bounce"
        >
          <span className="bg-accent-orange text-white text-xl font-black font-nunito py-1 px-3 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E]">
            SLICE
          </span>
          <span className="hidden sm:inline font-nunito font-black text-md tracking-wider opacity-80">BACKOFFICE</span>
        </button>

        {/* Desktop inline nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-nunito font-black text-sm transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-brand-light border-main-text text-accent-orange shadow-[2px_2px_0px_#1A1A2E]"
                : "bg-white border-transparent text-main-text hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            主控台
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-nunito font-black text-sm transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-brand-light border-main-text text-accent-orange shadow-[2px_2px_0px_#1A1A2E]"
                : "bg-white border-transparent text-main-text hover:bg-gray-50"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            使用者 ({totalUsersCount})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-nunito font-black text-sm transition-all cursor-pointer ${
              activeTab === "groups"
                ? "bg-brand-light border-main-text text-accent-orange shadow-[2px_2px_0px_#1A1A2E]"
                : "bg-white border-transparent text-main-text hover:bg-gray-50"
            }`}
          >
            <Folder className="w-4 h-4 shrink-0" />
            群組 ({totalGroupsCount})
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 ml-1 rounded-xl border-2 border-transparent font-nunito font-black text-sm text-red-500 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            登出
          </button>
        </nav>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="開啟選單"
          className="sm:hidden flex items-center justify-center bg-white hover:bg-gray-50 text-main-text p-2 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer shrink-0"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            {/* Click-away backdrop */}
            <div className="sm:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <nav className="sm:hidden absolute right-4 top-full mt-2 z-50 w-64 bg-white border-3 border-main-text rounded-2xl shadow-[6px_6px_0px_#1A1A2E] p-3 flex flex-col gap-2 animate-fadeIn">
              {/* Signed-in admin */}
              <div className="flex items-center gap-2 px-1 pb-3 mb-1 border-b-2 border-dashed border-gray-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-main-text shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent-orange border-2 border-main-text flex items-center justify-center text-white font-nunito font-black shrink-0">
                    A
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-500 truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] bg-success-light text-success-green font-bold px-1.5 py-0.5 rounded-md border border-success-green/20">
                    <UserCheck className="w-2.5 h-2.5" />
                    最高管理員
                  </span>
                </div>
              </div>

              <button
                onClick={() => { setActiveTab("dashboard"); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-nunito font-black text-left transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-brand-light border-main-text text-accent-orange shadow-[2px_2px_0px_#1A1A2E]"
                    : "bg-white border-transparent text-main-text hover:bg-gray-50"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                主控台首頁
              </button>

              <button
                onClick={() => { setActiveTab("users"); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-nunito font-black text-left transition-all cursor-pointer ${
                  activeTab === "users"
                    ? "bg-brand-light border-main-text text-accent-orange shadow-[2px_2px_0px_#1A1A2E]"
                    : "bg-white border-transparent text-main-text hover:bg-gray-50"
                }`}
              >
                <Users className="w-5 h-5 shrink-0" />
                使用者管理 ({totalUsersCount})
              </button>

              <button
                onClick={() => { setActiveTab("groups"); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-nunito font-black text-left transition-all cursor-pointer ${
                  activeTab === "groups"
                    ? "bg-brand-light border-main-text text-accent-orange shadow-[2px_2px_0px_#1A1A2E]"
                    : "bg-white border-transparent text-main-text hover:bg-gray-50"
                }`}
              >
                <Folder className="w-5 h-5 shrink-0" />
                群組管理 ({totalGroupsCount})
              </button>

              {/* Logout */}
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 mt-1 border-t-2 border-dashed border-gray-200 pt-3 rounded-b-xl font-nunito font-black text-left text-red-500 hover:bg-red-50 transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                系統登出
              </button>
            </nav>
          </>
        )}
      </header>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10">
        
        {/* Header bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-nunito font-black tracking-tight">
              {activeTab === "dashboard" && "數據分析主控台"}
              {activeTab === "users" && "使用者帳號管理"}
              {activeTab === "groups" && "群組與分帳資料"}
            </h1>
            <p className="text-sm text-gray-500 font-semibold mt-1">
              {activeTab === "dashboard" && "即時追蹤 SLICE 的用戶成長與群組分帳活動量。"}
              {activeTab === "users" && "檢視所有使用者的登入機制、建立時間與活動狀態。"}
              {activeTab === "groups" && "深度檢查所有分帳群組、成員分佈、費用記錄與結清歷史。"}
            </p>
          </div>
          
          <button 
            onClick={fetchData}
            disabled={dataLoading}
            className="self-start sm:self-auto bg-white font-nunito font-black text-sm py-2 px-4 border-2 border-main-text rounded-xl shadow-[3px_3px_0px_#1A1A2E] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {dataLoading ? "同步中..." : "重新整理資料"}
          </button>
        </header>

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className="text-left bg-white border-2 border-main-text rounded-2xl p-5 shadow-[4px_4px_0px_#1A1A2E] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] btn-bounce cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-500">總註冊用戶</span>
                  <span className="bg-brand-light p-2 rounded-xl border border-accent-orange/20">
                    <Users className="w-5 h-5 text-accent-orange" />
                  </span>
                </div>
                <h2 className="text-3xl font-nunito font-black">{totalUsersCount}</h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 font-semibold">
                  <span className="text-success-green bg-success-light px-1.5 py-0.5 rounded border border-success-green/20">
                    Google: {googleUsersCount}
                  </span>
                  <span>/</span>
                  <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    Guest: {anonymousUsersCount}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("groups")}
                className="text-left bg-white border-2 border-main-text rounded-2xl p-5 shadow-[4px_4px_0px_#1A1A2E] hover:bg-gray-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#1A1A2E] btn-bounce cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-500">分帳群組數</span>
                  <span className="bg-[#eaf4fe] p-2 rounded-xl border border-blue-200">
                    <Folder className="w-5 h-5 text-blue-500" />
                  </span>
                </div>
                <h2 className="text-3xl font-nunito font-black">{totalGroupsCount}</h2>
                <p className="text-xs text-gray-500 font-semibold mt-2">
                  平均每個用戶加入 {(totalUsersCount > 0 ? (totalGroupsCount / totalUsersCount).toFixed(1) : 0)} 個群組
                </p>
              </button>

              <div className="bg-white border-2 border-main-text rounded-2xl p-5 shadow-[4px_4px_0px_#1A1A2E]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-500">系統可用狀態</span>
                  <span className="bg-success-light p-2 rounded-xl border border-success-green/20">
                    <CheckCircle className="w-5 h-5 text-success-green" />
                  </span>
                </div>
                <h2 className="text-lg font-nunito font-black text-success-green">正常運作中</h2>
                <p className="text-xs text-gray-500 font-semibold mt-3">
                  與 Google Firebase 雲端資料庫保持即時連線。
                </p>
              </div>

              <div className="bg-white border-2 border-main-text rounded-2xl p-5 shadow-[4px_4px_0px_#1A1A2E]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-500">資料安全驗證</span>
                  <span className="bg-[#faf5ea] p-2 rounded-xl border border-yellow-200">
                    <UserCheck className="w-5 h-5 text-yellow-600" />
                  </span>
                </div>
                <h2 className="text-lg font-nunito font-black text-yellow-600">已部署 RLS 安全性</h2>
                <p className="text-xs text-gray-500 font-semibold mt-3">
                  資料庫安全規則有效阻斷越權讀寫。
                </p>
              </div>
            </div>

            {/* Quick guide */}
            <div className="bg-white border-2 border-main-text rounded-2xl p-6 shadow-[4px_4px_0px_#1A1A2E] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-nunito font-black flex items-center gap-2">
                  <Info className="w-5 h-5 text-accent-orange" />
                  管理員權限指引
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                  SLICE 後台採用安全的 Firestore Rules 設計。任何在此登入的帳號，必須在資料庫的 
                  <code>/admins</code> 集合下擁有一筆與其 Auth UID 相同的識別文件，才可對 
                  <code>/users</code> 進行跨文件讀取。這保保障了全站用戶個資不被惡意洩漏。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search & Sort filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center bg-white border-2 border-main-text rounded-xl px-4 py-2.5 shadow-[3px_3px_0px_#1A1A2E] w-full max-w-md">
                <Search className="w-5 h-5 text-gray-400 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="搜尋 UID、國家、登入機制 (google / anonymous)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full text-base focus:outline-none placeholder-gray-400 font-medium"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch("")} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-sm font-bold text-gray-500 font-plus-jakarta shrink-0">排序方式：</span>
                <select
                  value={`${userSortField}-${userSortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-") as [
                      "createdOn" | "lastLoginOn" | "joinedGroups" | "id",
                      "asc" | "desc",
                    ];
                    setUserSortField(field);
                    setUserSortOrder(order);
                  }}
                  className="bg-white border-2 border-main-text rounded-xl px-3 py-2 text-base font-bold text-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="createdOn-desc">註冊時間 (新 ➔ 舊)</option>
                  <option value="createdOn-asc">註冊時間 (舊 ➔ 新)</option>
                  <option value="lastLoginOn-desc">最後登入 (新 ➔ 舊)</option>
                  <option value="joinedGroups-desc">加入群組數 (多 ➔ 少)</option>
                  <option value="joinedGroups-asc">加入群組數 (少 ➔ 多)</option>
                  <option value="id-asc">UID (A ➔ Z)</option>
                </select>
              </div>
            </div>

            {/* Bulk selection action bar */}
            {selectedUserIds.size > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-main-text text-white border-2 border-main-text rounded-2xl px-4 py-3 shadow-[4px_4px_0px_#1A1A2E] animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="bg-accent-orange text-white font-nunito font-black text-sm w-8 h-8 flex items-center justify-center rounded-lg border-2 border-white/20 shrink-0">
                    {selectedUserIds.size}
                  </span>
                  <span className="text-sm font-bold">
                    已選取 {selectedUserIds.size} 位使用者
                    {groupsToBeDeletedByBulk.length > 0 && (
                      <span className="text-white/60 font-semibold">
                        （含 {groupsToBeDeletedByBulk.length} 個建立的群組）
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={clearUserSelection}
                    className="bg-white/10 hover:bg-white/20 text-white font-nunito font-black text-sm py-2 px-4 border-2 border-white/30 rounded-xl active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    取消選取
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="bg-red-500 hover:bg-red-600 text-white font-nunito font-black text-sm py-2 px-4 border-2 border-white rounded-xl shadow-[2px_2px_0px_rgba(255,255,255,0.25)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none btn-bounce cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除選取項目
                  </button>
                </div>
              </div>
            )}

            {/* Users table */}
            <div className="bg-white border-2 border-main-text rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1A1A2E]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-brand-light border-b-2 border-main-text text-sm font-bold text-gray-600">
                      <th className="p-4 w-px">
                        <input
                          type="checkbox"
                          aria-label="全選目前顯示的使用者"
                          checked={allVisibleSelected}
                          ref={(el) => { if (el) el.indeterminate = someVisibleSelected; }}
                          onChange={toggleSelectAllVisible}
                          className="w-5 h-5 accent-accent-orange cursor-pointer align-middle"
                        />
                      </th>
                      <th className="p-4 font-nunito font-black">用戶識別碼 (UID)</th>
                      <th className="p-4 font-nunito font-black">登入管道</th>
                      <th className="p-4 font-nunito font-black">來源地區</th>
                      <th className="p-4 font-nunito font-black">註冊時間</th>
                      <th className="p-4 font-nunito font-black">最後登入</th>
                      <th className="p-4 font-nunito font-black text-center">加入群組數</th>
                      <th className="p-4 font-nunito font-black">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-100">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className={`transition-colors ${selectedUserIds.has(u.id) ? "bg-brand-light/60" : "hover:bg-gray-50/50"}`}
                        >
                          <td className="p-4 w-px">
                            <input
                              type="checkbox"
                              aria-label={`選取使用者 ${u.id}`}
                              checked={selectedUserIds.has(u.id)}
                              onChange={() => toggleUserSelection(u.id)}
                              className="w-5 h-5 accent-accent-orange cursor-pointer align-middle"
                            />
                          </td>
                          <td className="p-4 font-mono text-xs font-semibold flex items-center gap-2">
                            <span className="bg-gray-50 px-2 py-1 border border-gray-200 rounded text-gray-600 font-mono">
                              {u.id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(u.id)}
                              className="text-gray-400 hover:text-accent-orange p-1 rounded hover:bg-gray-100 transition-colors"
                              title="複製 UID"
                            >
                              {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-success-green" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="p-4">
                            {u.isAnonymous ? (
                              <span className="bg-gray-100 text-gray-500 border border-gray-200 text-xs font-bold px-2 py-0.5 rounded-md">
                                訪客 (Guest)
                              </span>
                            ) : (
                              <span className="bg-brand-light text-accent-orange border border-accent-orange/20 text-xs font-bold px-2 py-0.5 rounded-md">
                                Google Auth
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-plus-jakarta text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 border border-gray-200 rounded-md">
                              {getCountryDisplay(u.country)}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-semibold text-gray-500">
                            {formatDate(u.createdOn)}
                          </td>
                          <td className="p-4 text-xs font-semibold text-gray-500">
                            {formatDate(u.lastLoginOn)}
                          </td>
                          <td className="p-4 font-nunito font-black text-sm text-center">
                            {u.joinedGroupIds?.length || 0}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="bg-white hover:bg-gray-50 text-main-text text-xs font-bold py-1.5 px-3 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              >
                                查看明細
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setUserToDelete(u)}
                                className="bg-white hover:bg-red-50 text-red-500 text-xs font-bold py-1.5 px-3 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                刪除用戶
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-sm font-semibold text-gray-400">
                          無符合條件的使用者
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GROUPS */}
        {activeTab === "groups" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search & Sort filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center bg-white border-2 border-main-text rounded-xl px-4 py-2.5 shadow-[3px_3px_0px_#1A1A2E] w-full max-w-md">
                <Search className="w-5 h-5 text-gray-400 shrink-0 mr-3" />
                <input
                  type="text"
                  placeholder="搜尋群組名稱、群組 ID、邀請碼..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="w-full text-base focus:outline-none placeholder-gray-400 font-medium"
                />
                {groupSearch && (
                  <button onClick={() => setGroupSearch("")} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-sm font-bold text-gray-500 font-plus-jakarta shrink-0">排序方式：</span>
                <select
                  value={`${groupSortField}-${groupSortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-") as [
                      "createdAt" | "name" | "settled" | "createdBy",
                      "asc" | "desc",
                    ];
                    setGroupSortField(field);
                    setGroupSortOrder(order);
                  }}
                  className="bg-white border-2 border-main-text rounded-xl px-3 py-2 text-base font-bold text-main-text shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="createdAt-desc">創立時間 (新 ➔ 舊)</option>
                  <option value="createdAt-asc">創立時間 (舊 ➔ 新)</option>
                  <option value="name-asc">群組名稱 (A ➔ Z)</option>
                  <option value="settled-desc">結清狀態 (進行中優先)</option>
                  <option value="settled-asc">結清狀態 (已結清優先)</option>
                  <option value="createdBy-asc">建立者 UID (A ➔ Z)</option>
                </select>
              </div>
            </div>

            {/* Groups Grid / List */}
            <div className="bg-white border-2 border-main-text rounded-2xl overflow-hidden shadow-[4px_4px_0px_#1A1A2E]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-brand-light border-b-2 border-main-text text-sm font-bold text-gray-600">
                      <th className="p-4 font-nunito font-black">群組名稱</th>
                      <th className="p-4 font-nunito font-black">群組 ID / 邀請碼</th>
                      <th className="p-4 font-nunito font-black">創立時間</th>
                      <th className="p-4 font-nunito font-black">群組建立者 (UID)</th>
                      <th className="p-4 font-nunito font-black">結清狀態</th>
                      <th className="p-4 font-nunito font-black">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-100">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map((g) => (
                        <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-main-text">
                            {g.name}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs text-gray-500 flex items-center gap-1">
                                ID: {g.id}
                                <button
                                  onClick={() => copyToClipboard(g.id)}
                                  className="text-gray-300 hover:text-accent-orange p-0.5 rounded transition-colors"
                                >
                                  {copiedId === g.id ? <Check className="w-3 h-3 text-success-green" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </span>
                              {g.joinId && (
                                <span className="text-xs font-bold text-accent-orange font-mono">
                                  邀請碼: {g.joinId}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-semibold text-gray-500">
                            {formatDate(g.createdAt)}
                          </td>
                          <td className="p-4 font-mono text-xs text-gray-500 select-all">
                            {g.createdBy}
                          </td>
                          <td className="p-4">
                            {g.settledAt ? (
                              <span className="bg-success-light text-success-green border border-success-green/20 text-xs font-bold px-2 py-0.5 rounded-md">
                                已結清
                              </span>
                            ) : (
                              <span className="bg-orange-50 text-accent-orange border border-accent-orange/20 text-xs font-bold px-2 py-0.5 rounded-md">
                                進行中
                              </span>
                            )}
                          </td>
                          <td className="p-4 flex items-center gap-2">
                            <button
                              onClick={() => fetchGroupDetails(g)}
                              className="bg-white hover:bg-gray-50 text-main-text text-xs font-bold py-1.5 px-3 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              查看明細
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setGroupToDelete(g)}
                              className="bg-white hover:bg-red-50 text-red-500 text-xs font-bold py-1.5 px-3 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              刪除
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-sm font-semibold text-gray-400">
                          無符合條件的群組
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAIL DRAWER / MODAL FOR SELECTED GROUP */}
            {selectedGroup && (
              <div className="fixed inset-0 bg-[#1A1A2E]/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white border-3 border-main-text rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[8px_8px_0px_#1A1A2E] flex flex-col">
                  
                  {/* Modal Header */}
                  <div className="bg-brand-light border-b-3 border-main-text p-6 flex justify-between items-center shrink-0">
                    <div>
                      <h2 className="text-xl font-nunito font-black text-main-text">
                        {selectedGroup.name} 的後台明細
                      </h2>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        GroupID: {selectedGroup.id}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedGroup(null)}
                      className="bg-white hover:bg-gray-50 text-main-text p-1.5 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {detailsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-accent-orange border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 font-nunito font-black text-sm tracking-wider">載入群組子集合中...</p>
                      </div>
                    ) : (
                      <>
                        {/* Highlights Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-orange-50/50 border-2 border-main-text rounded-xl p-4">
                            <span className="text-xs font-bold text-gray-500 block mb-1">群組成員數</span>
                            <span className="text-2xl font-nunito font-black text-main-text">{selectedGroupMembers.length} 人</span>
                          </div>
                          <div className="bg-orange-50/50 border-2 border-main-text rounded-xl p-4">
                            <span className="text-xs font-bold text-gray-500 block mb-1">總支出筆數</span>
                            <span className="text-2xl font-nunito font-black text-main-text">{selectedGroupExpenses.length} 筆</span>
                          </div>
                          <div className="bg-orange-50/50 border-2 border-main-text rounded-xl p-4">
                            <span className="text-xs font-bold text-gray-500 block mb-1">累計費用總額</span>
                            <span className="text-2xl font-nunito font-black text-accent-orange">
                              {formatCurrency(selectedGroupExpenses.reduce((sum, e) => sum + e.amount, 0))}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Members Sub-list */}
                          <div className="bg-white border-2 border-main-text rounded-xl p-5 shadow-[3px_3px_0px_#1A1A2E]">
                            <h3 className="text-base font-nunito font-black mb-3 border-b-2 border-gray-100 pb-2">
                              成員名單 ({selectedGroupMembers.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {selectedGroupMembers.map(m => {
                                const bound = !!m.userId;
                                return bound ? (
                                  <button
                                    key={m.id}
                                    onClick={() => handleViewUserFromGroup(m.userId)}
                                    className="w-full text-left flex items-center justify-between bg-gray-50 hover:bg-brand-light px-3 py-2 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer transition-colors"
                                  >
                                    <div className="min-w-0">
                                      <span className="font-bold text-sm block truncate">{m.name}</span>
                                      <span className="text-[10px] text-gray-400 font-mono block truncate">
                                        綁定UID: {m.userId!.substring(0, 8)}...
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {m.isHost && (
                                        <span className="bg-brand-light text-accent-orange border border-accent-orange/20 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                          主辦人
                                        </span>
                                      )}
                                      <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                  </button>
                                ) : (
                                  <div key={m.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 border border-gray-200 rounded-lg">
                                    <div>
                                      <span className="font-bold text-sm block">{m.name}</span>
                                      <span className="text-[10px] text-gray-400 font-mono block">
                                        未綁定 (虛擬成員)
                                      </span>
                                    </div>
                                    {m.isHost && (
                                      <span className="bg-brand-light text-accent-orange border border-accent-orange/20 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                        主辦人
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Settlements Sub-list */}
                          <div className="bg-white border-2 border-main-text rounded-xl p-5 shadow-[3px_3px_0px_#1A1A2E]">
                            <h3 className="text-base font-nunito font-black mb-3 border-b-2 border-gray-100 pb-2">
                              結清紀錄 ({selectedGroupSettlements.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {selectedGroupSettlements.length > 0 ? (
                                selectedGroupSettlements.map(s => {
                                  // Map memberIds to names if possible
                                  const payer = selectedGroupMembers.find(m => m.id === s.from)?.name || s.from;
                                  const receiver = selectedGroupMembers.find(m => m.id === s.to)?.name || s.to;
                                  return (
                                    <div key={s.id} className="bg-success-light/30 border border-success-green/20 rounded-lg p-2 flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-700">
                                          {payer} <span className="text-gray-400">➡️</span> {receiver}
                                        </span>
                                        <span className="text-xs font-nunito font-black text-success-green">
                                          {formatCurrency(s.amount)}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-semibold block">
                                        登記時間: {formatDate(s.completedAt)}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-center text-xs font-semibold text-gray-400 py-6">
                                  尚無手動結清支付紀錄
                                </p>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Full Expenses Sub-list */}
                        <div className="bg-white border-2 border-main-text rounded-xl p-5 shadow-[3px_3px_0px_#1A1A2E]">
                          <h3 className="text-base font-nunito font-black mb-3 border-b-2 border-gray-100 pb-2">
                            詳細支出紀錄 ({selectedGroupExpenses.length})
                          </h3>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {selectedGroupExpenses.length > 0 ? (
                              selectedGroupExpenses.map(e => {
                                const payerName = selectedGroupMembers.find(m => m.id === e.paidBy)?.name || "未知付款人";
                                return (
                                  <div key={e.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0 flex items-center justify-between">
                                    <div>
                                      <h4 className="font-bold text-sm text-main-text">{e.description}</h4>
                                      <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                        由 <strong>{payerName}</strong> 墊付，分攤於 {e.splitAmong.length} 人
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-nunito font-black text-main-text">
                                        {formatCurrency(e.amount)}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                        {formatDate(e.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-center text-xs font-semibold text-gray-400 py-8">
                                尚無支出費用紀錄
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-gray-50 border-t-3 border-main-text p-4 flex justify-between items-center shrink-0">
                    <button
                      onClick={() => setGroupToDelete(selectedGroup)}
                      className="bg-white hover:bg-red-50 text-red-500 font-nunito font-black text-sm py-2 px-5 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      刪除此群組
                    </button>
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="bg-white hover:bg-gray-100 text-main-text font-nunito font-black text-sm py-2 px-5 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer"
                    >
                      關閉明細窗口
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* USER DETAIL MODAL */}
        {selectedUser && (() => {
          const { created, joined } = getRelatedGroups(selectedUser);
          return (
            <div className="fixed inset-0 bg-[#1A1A2E]/50 flex items-center justify-center p-4 z-50 overflow-y-auto font-plus-jakarta">
              <div className="bg-white border-3 border-main-text rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-[8px_8px_0px_#1A1A2E] flex flex-col animate-fadeIn">

                {/* Modal Header */}
                <div className="bg-brand-light border-b-3 border-main-text p-6 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-accent-orange p-2 rounded-lg border-2 border-main-text shrink-0">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-nunito font-black text-main-text">使用者明細</h2>
                      <p className="text-xs text-gray-500 font-mono mt-1 truncate">UID: {selectedUser.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="bg-white hover:bg-gray-50 text-main-text p-1.5 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  {/* User Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border-2 border-main-text rounded-xl p-3">
                      <span className="text-xs font-bold text-gray-500 block mb-1">登入管道</span>
                      <span className="text-sm font-nunito font-black text-main-text">
                        {selectedUser.isAnonymous ? "訪客 (Guest)" : "Google Auth"}
                      </span>
                    </div>
                    <div className="bg-gray-50 border-2 border-main-text rounded-xl p-3">
                      <span className="text-xs font-bold text-gray-500 block mb-1">來源地區</span>
                      <span className="text-sm font-nunito font-black text-main-text">{getCountryDisplay(selectedUser.country)}</span>
                    </div>
                    <div className="bg-gray-50 border-2 border-main-text rounded-xl p-3">
                      <span className="text-xs font-bold text-gray-500 block mb-1">加入群組數</span>
                      <span className="text-sm font-nunito font-black text-accent-orange">{selectedUser.joinedGroupIds?.length || 0}</span>
                    </div>
                    <div className="bg-gray-50 border-2 border-main-text rounded-xl p-3">
                      <span className="text-xs font-bold text-gray-500 block mb-1">註冊時間</span>
                      <span className="text-xs font-bold text-main-text">{formatDate(selectedUser.createdOn)}</span>
                    </div>
                    <div className="bg-gray-50 border-2 border-main-text rounded-xl p-3">
                      <span className="text-xs font-bold text-gray-500 block mb-1">最後登入</span>
                      <span className="text-xs font-bold text-main-text">{formatDate(selectedUser.lastLoginOn)}</span>
                    </div>
                  </div>

                  {/* Groups created by user */}
                  <div className="bg-white border-2 border-main-text rounded-xl p-5 shadow-[3px_3px_0px_#1A1A2E]">
                    <h3 className="text-base font-nunito font-black mb-3 border-b-2 border-gray-100 pb-2 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-accent-orange" />
                      建立的群組 ({created.length})
                    </h3>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {created.length > 0 ? (
                        created.map(g => (
                          <button
                            key={g.id}
                            onClick={() => handleViewGroupFromUser(g)}
                            className="w-full text-left flex items-center justify-between bg-gray-50 hover:bg-brand-light px-3 py-2 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-sm block truncate">{g.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono block truncate">ID: {g.id}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {g.settledAt ? (
                                <span className="bg-success-light text-success-green border border-success-green/20 text-[10px] font-bold px-1.5 py-0.5 rounded">已結清</span>
                              ) : (
                                <span className="bg-orange-50 text-accent-orange border border-accent-orange/20 text-[10px] font-bold px-1.5 py-0.5 rounded">進行中</span>
                              )}
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-center text-xs font-semibold text-gray-400 py-4">未建立任何群組</p>
                      )}
                    </div>
                  </div>

                  {/* Groups joined but not created */}
                  <div className="bg-white border-2 border-main-text rounded-xl p-5 shadow-[3px_3px_0px_#1A1A2E]">
                    <h3 className="text-base font-nunito font-black mb-3 border-b-2 border-gray-100 pb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-orange" />
                      加入的其他群組 ({joined.length})
                    </h3>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {joined.length > 0 ? (
                        joined.map(g => (
                          <button
                            key={g.id}
                            onClick={() => handleViewGroupFromUser(g)}
                            className="w-full text-left flex items-center justify-between bg-gray-50 hover:bg-brand-light px-3 py-2 border-2 border-main-text rounded-lg shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-sm block truncate">{g.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono block truncate">ID: {g.id}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                          </button>
                        ))
                      ) : (
                        <p className="text-center text-xs font-semibold text-gray-400 py-4">未加入其他群組</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 border-t-3 border-main-text p-4 flex justify-between items-center shrink-0">
                  <button
                    onClick={() => { const u = selectedUser; setSelectedUser(null); setUserToDelete(u); }}
                    className="bg-white hover:bg-red-50 text-red-500 font-nunito font-black text-sm py-2 px-5 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    刪除此用戶
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="bg-white hover:bg-gray-100 text-main-text font-nunito font-black text-sm py-2 px-5 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer"
                  >
                    關閉明細窗口
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* USER DELETE CONFIRMATION MODAL */}
        {userToDelete && (
          <div className="fixed inset-0 bg-[#1A1A2E]/50 flex items-center justify-center p-4 z-50 overflow-y-auto font-plus-jakarta">
            <div className="bg-white border-3 border-main-text rounded-2xl w-full max-w-md overflow-hidden shadow-[6px_6px_0px_#1A1A2E] flex flex-col animate-fadeIn">
              <div className="bg-[#FFF0EA] border-b-3 border-main-text p-5 flex items-center gap-3 shrink-0">
                <div className="bg-accent-orange p-2 rounded-lg border-2 border-main-text">
                  <UserX className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-nunito font-black text-main-text">
                  刪除使用者與其群組
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <p className="text-sm text-gray-600 leading-relaxed">
                  您即將刪除使用者 <strong className="font-mono text-xs bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-main-text">{userToDelete.id}</strong>。
                </p>
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-xs space-y-1.5 text-red-700">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    警告：此動作無法復原！
                  </p>
                  <p>1. 使用者設定檔將會被永久刪除。</p>
                  <p>2. <strong>此使用者建立的所有分帳群組 ({groupsList.filter(g => g.createdBy === userToDelete.id).length} 個) 及其帳目和成員資料亦將會被一併刪除。</strong></p>
                  <p>3. 此使用者加入的其他群組將會自動移除其成員資料。</p>
                </div>

                {groupsList.filter(g => g.createdBy === userToDelete.id).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-500">即將被刪除的群組：</span>
                    <div className="max-h-28 overflow-y-auto border border-dashed border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                      {groupsList.filter(g => g.createdBy === userToDelete.id).map(g => (
                        <div key={g.id} className="text-xs font-semibold text-gray-600 flex justify-between gap-2">
                          <span className="truncate max-w-[200px]">{g.name}</span>
                          <span className="font-mono text-[10px] text-gray-400 shrink-0">ID: {g.id.substring(0, 6)}...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 border-t-2 border-main-text p-4 flex gap-3 shrink-0">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeletingUser}
                  className="flex-1 bg-white hover:bg-gray-100 text-main-text font-nunito font-black text-sm py-2.5 px-4 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer text-center disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteUser(userToDelete.id)}
                  disabled={isDeletingUser}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-nunito font-black text-sm py-2.5 px-4 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeletingUser ? "刪除中..." : "確認刪除"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GROUP DELETE CONFIRMATION MODAL */}
        {groupToDelete && (
          <div className="fixed inset-0 bg-[#1A1A2E]/50 flex items-center justify-center p-4 z-50 overflow-y-auto font-plus-jakarta">
            <div className="bg-white border-3 border-main-text rounded-2xl w-full max-w-md overflow-hidden shadow-[6px_6px_0px_#1A1A2E] flex flex-col animate-fadeIn">
              <div className="bg-[#FFF0EA] border-b-3 border-main-text p-5 flex items-center gap-3 shrink-0">
                <div className="bg-accent-orange p-2 rounded-lg border-2 border-main-text">
                  <FolderX className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-nunito font-black text-main-text">
                  刪除群組資料
                </h3>
              </div>
              <div className="p-6 space-y-4 shrink-0">
                <p className="text-sm text-gray-600 leading-relaxed">
                  您即將刪除群組：<strong className="text-main-text">{groupToDelete.name}</strong>
                </p>
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-xs space-y-1.5 text-red-700">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    警告：此動作無法復原！
                  </p>
                  <p>1. 群組主文件及所有子文件 (成員、支出、結清) 將被永久刪除。</p>
                  <p>2. 所有群組成員的使用者帳號將自動解除與此群組的連結。</p>
                </div>
              </div>
              <div className="bg-gray-50 border-t-2 border-main-text p-4 flex gap-3 shrink-0">
                <button
                  onClick={() => setGroupToDelete(null)}
                  disabled={isDeletingGroup}
                  className="flex-1 bg-white hover:bg-gray-100 text-main-text font-nunito font-black text-sm py-2.5 px-4 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer text-center disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteGroup(groupToDelete.id)}
                  disabled={isDeletingGroup}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-nunito font-black text-sm py-2.5 px-4 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeletingGroup ? "刪除中..." : "確認刪除"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BULK USER DELETE CONFIRMATION MODAL */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-[#1A1A2E]/50 flex items-center justify-center p-4 z-50 overflow-y-auto font-plus-jakarta">
            <div className="bg-white border-3 border-main-text rounded-2xl w-full max-w-md overflow-hidden shadow-[6px_6px_0px_#1A1A2E] flex flex-col animate-fadeIn">
              <div className="bg-[#FFF0EA] border-b-3 border-main-text p-5 flex items-center gap-3 shrink-0">
                <div className="bg-accent-orange p-2 rounded-lg border-2 border-main-text">
                  <UserX className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-nunito font-black text-main-text">
                  批次刪除使用者
                </h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <p className="text-sm text-gray-600 leading-relaxed">
                  您即將刪除 <strong className="text-main-text">{selectedUserIds.size}</strong> 位使用者及其所有相關資料。
                </p>
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 text-xs space-y-1.5 text-red-700">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    警告：此動作無法復原！
                  </p>
                  <p>1. 這些使用者的設定檔將會被永久刪除。</p>
                  <p>2. <strong>由這些使用者建立的 {groupsToBeDeletedByBulk.length} 個分帳群組及其帳目和成員資料亦將被一併刪除。</strong></p>
                  <p>3. 這些使用者加入的其他群組將會自動移除其成員資料。</p>
                </div>

                {/* Users to be deleted */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-500">即將被刪除的使用者：</span>
                  <div className="max-h-32 overflow-y-auto border border-dashed border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                    {selectedUsers.map(u => (
                      <div key={u.id} className="text-xs font-semibold text-gray-600 flex justify-between gap-2">
                        <span className="font-mono truncate max-w-[200px]">{u.id}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {u.isAnonymous ? "訪客" : "Google"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {isBulkDeleting && bulkDeleteProgress.total > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>刪除進度</span>
                      <span>{bulkDeleteProgress.done} / {bulkDeleteProgress.total}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 border border-main-text rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-orange transition-all duration-300"
                        style={{ width: `${(bulkDeleteProgress.done / bulkDeleteProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 border-t-2 border-main-text p-4 flex gap-3 shrink-0">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                  className="flex-1 bg-white hover:bg-gray-100 text-main-text font-nunito font-black text-sm py-2.5 px-4 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer text-center disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleBulkDeleteUsers}
                  disabled={isBulkDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-nunito font-black text-sm py-2.5 px-4 border-2 border-main-text rounded-xl shadow-[2px_2px_0px_#1A1A2E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1A1A2E] btn-bounce cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isBulkDeleting
                    ? `刪除中... (${bulkDeleteProgress.done}/${bulkDeleteProgress.total})`
                    : `確認刪除 ${selectedUserIds.size} 位`}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
