import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  documentId,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firebaseService, type ExpenseInput } from '../lib/firebaseService';
import type { Member, Group, Expense, UserSettings, SettlementRecord } from '../types';
import { calculateBalancesAndSettlements } from '../lib/settlement';
import { useAuth } from './AuthContext';
import { useDialog } from './DialogContext';

interface GroupContextType {
  groupId: string | null;
  currentGroup: Group | null;
  myGroups: Group[];
  members: Member[];
  expenses: Expense[];
  completedSettlements: SettlementRecord[];
  currentMemberId: string | null;
  currentMember: Member | undefined;
  isHost: boolean;
  isSettled: boolean;
  isLoading: boolean;
  handleCreateGroup: (name: string) => Promise<void>;
  handleJoinGroup: (joinId: string) => Promise<void>;
  handleLeaveGroup: () => Promise<void>;
  handleDeleteGroup: () => Promise<void>;
  handleSelectMember: (memberId: string) => Promise<void>;
  handleCreateMember: (name: string) => Promise<void>;
  handleCreateMemberByHost: (name: string) => Promise<void>;
  handleDeleteMember: (memberId: string) => Promise<void>;
  handleUpdateProfile: (data: Partial<Member>) => Promise<void>;
  handleUpdateGroupName: (newName: string) => Promise<void>;
  handleAddExpense: (expenseData: ExpenseInput) => Promise<void>;
  handleUpdateExpense: (expenseId: string, expenseData: Partial<ExpenseInput>) => Promise<void>;
  handleDeleteExpense: (expense: Expense) => Promise<void>;
  handleSettleGroup: () => Promise<void>;
  handleUnsettleGroup: () => Promise<void>;
  handleMarkSettlementPaid: (settlement: { from: string; to: string; amount: number }) => Promise<void>;
  handleUnmarkSettlement: (settlementId: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

// Groups the user has opened via a join link but not yet actually joined (they
// still need to claim or create a member). Kept in sessionStorage so the
// membership gate lets them reach the member-selection screen and a page reload
// during selection doesn't bounce them. The real join — writing joinedGroupIds —
// happens when they claim/create a member.
const PENDING_JOINS_KEY = 'slice:pendingJoins';

function readPendingJoins(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_JOINS_KEY) || '[]');
  } catch {
    return [];
  }
}

function hasPendingJoin(groupId: string): boolean {
  return readPendingJoins().includes(groupId);
}

function addPendingJoin(groupId: string) {
  const ids = readPendingJoins();
  if (!ids.includes(groupId)) {
    sessionStorage.setItem(PENDING_JOINS_KEY, JSON.stringify([...ids, groupId]));
  }
}

function clearPendingJoin(groupId: string) {
  sessionStorage.setItem(
    PENDING_JOINS_KEY,
    JSON.stringify(readPendingJoins().filter(id => id !== groupId))
  );
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useDialog();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [completedSettlements, setCompletedSettlements] = useState<SettlementRecord[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [membershipReady, setMembershipReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [userSettingsLoaded, setUserSettingsLoaded] = useState(false);

  // Sync state with URL
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const idFromUrl = (pathParts[1] === 'group' && pathParts[2]) ? pathParts[2] : null;
    
    if (idFromUrl !== groupId) {
      setGroupId(idFromUrl);
    }
  }, [location.pathname, groupId]);

  // User Settings Hook
  useEffect(() => {
    if (!user) {
      setJoinedGroupIds([]);
      setUserSettingsLoaded(false);
      setMyGroups([]);
      return;
    }

    setUserSettingsLoaded(false);
    const settingsRef = doc(db, 'users', user.uid);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserSettings;
        const ids = data.joinedGroupIds || [];
        setJoinedGroupIds(ids);
        if (ids.length > 0) {
          const groupsQuery = query(
            collection(db, 'groups'),
            where(documentId(), 'in', ids.slice(0, 30))
          );

          getDocs(groupsQuery).then(snapshot => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            setMyGroups(groupsData);
          }).catch(err => console.error("Fetch my groups error:", err));
        } else {
          setMyGroups([]);
        }
      } else {
        setJoinedGroupIds([]);
        setMyGroups([]);
      }
      setUserSettingsLoaded(true);
    });

    return () => unsubSettings();
  }, [user]);

  // Keep latest joinedGroupIds accessible without re-subscribing the group
  // data effect every time the array reference changes (which would tear down
  // and re-create listeners on unrelated settings updates, and would also
  // race with leave/delete flows that mutate joinedGroupIds before navigating).
  const joinedGroupIdsRef = useRef<string[]>(joinedGroupIds);
  joinedGroupIdsRef.current = joinedGroupIds;

  // Groups joined during this session. Held in a ref that the /users/{uid}
  // snapshot never resets — unlike joinedGroupIds, which is briefly set to []
  // when the snapshot for a fresh (e.g. just-signed-in anonymous) user fires
  // before the join write has propagated. The membership gate consults this so
  // a group we just joined is always allowed through regardless of snapshot
  // timing.
  const recentlyJoinedRef = useRef<Set<string>>(new Set());

  // Group Data Hook
  useEffect(() => {
    if (!user || !groupId) {
      if (user && !groupId) setIsLoading(false);
      setMembers([]);
      setExpenses([]);
      setCompletedSettlements([]);
      setCurrentGroup(null);
      setCurrentMemberId(null);
      return;
    }

    // Wait for user settings to load before deciding membership. Without this
    // gate we'd race the snapshot listener and could redirect the host away
    // from a group they just created.
    if (!userSettingsLoaded) {
      setIsLoading(true);
      return;
    }

    // Block non-members: only users whose joinedGroupIds includes this group
    // may access /group/:groupId. Joining must go through /join/:joinId.
    // - recentlyJoinedRef covers groups joined this session whose membership the
    //   snapshot hasn't surfaced (or has momentarily reset) yet.
    // - hasPendingJoin covers users who opened a join link but haven't claimed a
    //   member yet — they're allowed to reach the member-selection screen.
    if (
      !joinedGroupIdsRef.current.includes(groupId) &&
      !recentlyJoinedRef.current.has(groupId) &&
      !hasPendingJoin(groupId)
    ) {
      toast.error(t('common.error_group_not_found'));
      navigate('/', { replace: true });
      return;
    }

    setIsLoading(true);
    const unsubGroup = onSnapshot(doc(db, 'groups', groupId), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentGroup({ id: docSnap.id, ...docSnap.data() } as Group);
      } else {
        if (window.location.pathname.startsWith(`/group/${groupId}`)) {
          toast.error(t('common.error_group_not_found'));
        }
        navigate('/', { replace: true });
      }
    }, (error) => {
      console.error("Group fetch error:", error);
      if (window.location.pathname.startsWith(`/group/${groupId}`)) {
        toast.error(t('common.error_group_not_found'));
      }
      navigate('/', { replace: true });
    });

    const unsubMembers = onSnapshot(collection(db, 'groups', groupId, 'members'), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      membersData.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMembers(membersData);

      const myMember = membersData.find(m => m.userId === user.uid);
      if (myMember) setCurrentMemberId(myMember.id);
      else setCurrentMemberId(null);
      setIsLoading(false);
    }, (error) => {
      console.error("Members fetch error:", error);
      setIsLoading(false);
    });

    return () => {
      unsubGroup();
      unsubMembers();
    };
  }, [user, groupId, userSettingsLoaded, navigate, t]);

  // Expenses and settlements subscriptions — only start after membershipReady is true.
  // This ensures the /claimedUserIds/{uid} index entry exists before subscribing,
  // preventing a permission-denied error on first load for existing members.
  useEffect(() => {
    if (!membershipReady || !groupId) {
      setExpenses([]);
      setCompletedSettlements([]);
      return;
    }

    const unsubExpenses = onSnapshot(collection(db, 'groups', groupId, 'expenses'), (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      expensesData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setExpenses(expensesData);
    }, (error) => {
      console.error("Expenses fetch error:", error);
    });

    const unsubSettlements = onSnapshot(collection(db, 'groups', groupId, 'settlements'), (snapshot) => {
      const settlementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SettlementRecord));
      settlementsData.sort((a, b) => (b.completedAt?.toMillis() || 0) - (a.completedAt?.toMillis() || 0));
      setCompletedSettlements(settlementsData);
    }, (error) => {
      console.error("Settlements fetch error:", error);
    });

    return () => {
      unsubExpenses();
      unsubSettlements();
    };
  }, [membershipReady, groupId]);

  const handleCreateGroup = async (name: string) => {
    if (!user || !name.trim()) return;
    setIsLoading(true);
    try {
      const hostName = user.displayName || (i18n.resolvedLanguage?.startsWith('zh') ? '主持人' : 'Host');
      const gid = await firebaseService.createGroup(user.uid, name, hostName);
      navigate(`/group/${gid}`);
    } catch (error) { 
      console.error("Create group error:", error); 
      toast.error(t('common.error'));
      setIsLoading(false); 
    }
  };

  const handleJoinGroup = async (joinId: string) => {
    if (!user || !joinId.trim()) return;
    setIsLoading(true);
    try {
      const resolvedGroupId = await firebaseService.resolveJoinId(joinId);
      if (!resolvedGroupId) {
        throw new Error('group_not_found');
      }
      // Don't auto-join. Mark a pending join so the membership gate lets the
      // user reach the member-selection screen; the actual join (writing
      // joinedGroupIds) happens when they claim or create a member.
      addPendingJoin(resolvedGroupId);
      navigate(`/group/${resolvedGroupId}`);
    } catch (error) {
      console.error("Join group error:", error);
      const msg = (error as Error).message === 'group_not_found' ? t('common.error_group_not_found') : t('common.error');
      toast.error(msg);
      setIsLoading(false);
      throw error;
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !groupId || !currentMemberId) return;
    
    // 1. Balance check
    const { balances } = calculateBalancesAndSettlements(members, expenses, completedSettlements);
    const myBalance = balances[currentMemberId] || 0;
    
    if (Math.abs(myBalance) > 0.01) {
      const balanceStr = myBalance > 0 
        ? t('members.receivable', { amount: myBalance.toFixed(0) }) 
        : t('members.owe', { amount: Math.abs(myBalance).toFixed(0) });
      toast.error(t('groups.leave_group_error_unsettled', { balance: balanceStr }));
      return;
    }

    const isConfirmed = await confirm(t('groups.leave_group_msg', { name: currentGroup?.name }), {
      title: t('groups.leave_group'),
      confirmLabel: t('groups.leave_group'),
      cancelLabel: t('common.cancel')
    });

    if (isConfirmed) {
      setIsLoading(true);
      // Navigate first so the group data effect's cleanup runs before the
      // membership-related state mutates underneath us.
      navigate('/', { replace: true });
      try {
        await firebaseService.leaveGroup(user.uid, groupId, currentMemberId);
        toast.success(t('groups.leave_group_success'));
      } catch (error) {
        console.error("Leave group error:", error);
        toast.error(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (!user || !groupId || !currentMemberId) return;
    const currentMember = members.find(m => m.id === currentMemberId);
    if (!currentMember?.isHost) return;
    
    const isConfirmed = await confirm(t('groups.delete_group_msg', { name: currentGroup?.name }), {
      title: t('groups.delete_group'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel')
    });

    if (isConfirmed) {
      setIsLoading(true);
      // Navigate away first so the group-doc snapshot listener (which sees the
      // deletion via local mutation echo before the network round-trip) doesn't
      // fire a misleading "group not found" toast.
      navigate('/', { replace: true });
      try {
        await firebaseService.deleteGroup(
          user.uid,
          groupId,
          expenses.map(e => e.id),
          members.map(m => m.id),
          completedSettlements.map(s => s.id),
          members.filter(m => m.userId != null).map(m => m.userId as string),
        );
        toast.success(t('groups.delete_group_success'));
      } catch (error) {
        console.error("Delete group error:", error);
        toast.error(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Claiming or creating a member is the moment the user actually joins: persist
  // membership (joinedGroupIds) so the group shows in their list and survives
  // reloads, and drop the pending-join marker. recentlyJoinedRef keeps the gate
  // open across the /users/{uid} snapshot reset that follows the write.
  const finalizeJoin = async (gid: string) => {
    recentlyJoinedRef.current.add(gid);
    await firebaseService.joinGroup(user!.uid, gid);
    clearPendingJoin(gid);
  };

  const handleSelectMember = async (memberId: string) => {
    if (!user || !groupId) return;
    const member = members.find(m => m.id === memberId);
    if (member && member.userId && member.userId !== user.uid) {
      toast.error(t('members.claimed'));
      return;
    }
    try {
      await firebaseService.claimMember(groupId, memberId, user.uid);
      await finalizeJoin(groupId);
    } catch (error) {
      console.error("Select member error:", error);
      toast.error(t('common.error'));
    }
  };

  const handleCreateMember = async (name: string) => {
    if (!user || !groupId || !name.trim()) return;
    try {
      await firebaseService.createMember(groupId, name, user.uid);
      await finalizeJoin(groupId);
    } catch (error) {
      console.error("Create member error:", error);
      toast.error(t('common.error'));
    }
  };

  const handleCreateMemberByHost = async (name: string) => {
    if (!user || !groupId || !name.trim()) return;
    const currentMember = members.find(m => m.userId === user.uid);
    if (!currentMember?.isHost) {
      toast.error(t('common.error_host_only'));
      return;
    }
    await firebaseService.createMember(groupId, name, null);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!user || !groupId) return;
    const currentMember = members.find(m => m.userId === user.uid);
    if (!currentMember?.isHost) {
      toast.error(t('common.error_host_only'));
      return;
    }
    const memberToDelete = members.find(m => m.id === memberId);
    await firebaseService.deleteMember(groupId, memberId, memberToDelete?.userId);
  };

  const handleUpdateProfile = async (data: Partial<Member>) => {
    if (!user || !groupId || !currentMemberId) return;
    await firebaseService.updateMember(groupId, currentMemberId, data);
    toast.success(t('profile.settings_updated'));
  };

  const handleUpdateGroupName = async (newName: string) => {
    if (!user || !groupId || !newName.trim()) return;
    const currentMember = members.find(m => m.userId === user.uid);
    if (!currentMember?.isHost) {
      toast.error(t('common.error_host_only'));
      return;
    }
    await firebaseService.updateGroupName(groupId, newName);
  };

  const currentMember = members.find(m => m.id === currentMemberId);
  const isHost = !!currentMember?.isHost;

  // Backfill the joinId field for groups created before it existed. Only the
  // host has write access to the group doc per Firestore rules.
  useEffect(() => {
    if (!currentGroup || !isHost) return;
    if (currentGroup.joinId) return;
    firebaseService.ensureJoinId(currentGroup.id).catch(err => {
      console.error("Backfill joinId error:", err);
    });
  }, [currentGroup, isHost]);

  // Ensure the /claimedUserIds/{uid} index entry exists before subscribing to expenses
  // and settlements. For existing members this is a backfill (idempotent setDoc);
  // for new members the entry already exists from the claimMember batch.
  // membershipReady gates the expenses/settlements subscriptions below.
  useEffect(() => {
    if (!user || !groupId || !currentMemberId) {
      setMembershipReady(false);
      return;
    }
    // Re-arm the gate for this group. Resetting to false synchronously here (not
    // just in the guard above) is what makes the expenses/settlements effect tear
    // down and re-subscribe once THIS group's index entry is confirmed. Without
    // it, navigating directly A→B keeps a stale membershipReady=true and a
    // permission-denied listener from the racing subscription never retries.
    setMembershipReady(false);
    let cancelled = false;
    firebaseService.ensureGroupMembership(groupId, currentMemberId, user.uid)
      .then(() => { if (!cancelled) setMembershipReady(true); })
      .catch(err => {
        console.error("Backfill claimedUserIds error:", err);
        if (!cancelled) setMembershipReady(true); // still attempt subscription — rule may already pass
      });
    return () => { cancelled = true; };
  }, [user, groupId, currentMemberId]);
  const isSettled = !!currentGroup?.settledAt;

  const handleAddExpense = async (expenseData: ExpenseInput) => {
    if (!user || !groupId || !currentMemberId) return;
    if (isSettled) {
      toast.error(t('settle.locked_msg'));
      return;
    }
    await firebaseService.addExpense(groupId, currentMemberId, expenseData);
  };

  const handleUpdateExpense = async (expenseId: string, expenseData: Partial<ExpenseInput>) => {
    if (!user || !groupId) return;
    if (isSettled) {
      toast.error(t('settle.locked_msg'));
      return;
    }
    await firebaseService.updateExpense(groupId, expenseId, expenseData);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!user || !groupId) return;
    if (isSettled) {
      toast.error(t('settle.locked_msg'));
      return;
    }
    const isConfirmed = await confirm(t('expenses.delete_msg'));
    if (isConfirmed) {
      await firebaseService.deleteExpense(groupId, expense.id);
      toast.success(t('expenses.deleted'));
    }
  };

  const handleSettleGroup = async () => {
    if (!user || !groupId) return;
    if (!isHost) {
      toast.error(t('common.error_host_only'));
      return;
    }
    if (isSettled) return;
    const isConfirmed = await confirm(t('settle.confirm_msg'), {
      title: t('settle.confirm_title'),
      confirmLabel: t('settle.action'),
      cancelLabel: t('common.cancel'),
    });
    if (!isConfirmed) return;
    try {
      await firebaseService.settleGroup(groupId, user.uid);
      toast.success(t('settle.settled_toast'));
    } catch (error) {
      console.error('Settle group error:', error);
      toast.error(t('common.error'));
    }
  };

  const handleUnsettleGroup = async () => {
    if (!user || !groupId) return;
    if (!isHost) {
      toast.error(t('common.error_host_only'));
      return;
    }
    if (!isSettled) return;
    const isConfirmed = await confirm(t('settle.undo_msg'), {
      title: t('settle.undo_title'),
      confirmLabel: t('settle.undo_action'),
      cancelLabel: t('common.cancel'),
    });
    if (!isConfirmed) return;
    try {
      await firebaseService.unsettleGroup(groupId);
      toast.success(t('settle.unsettled_toast'));
    } catch (error) {
      console.error('Unsettle group error:', error);
      toast.error(t('common.error'));
    }
  };

  const markingSettlementRef = useRef(false);
  const handleMarkSettlementPaid = async (settlement: { from: string; to: string; amount: number }) => {
    if (markingSettlementRef.current) return;
    if (!user || !groupId || !currentMemberId) return;
    if (settlement.from !== currentMemberId && settlement.to !== currentMemberId) {
      toast.error(t('settle.mark_paid_not_party'));
      return;
    }
    const fromName = members.find(m => m.id === settlement.from)?.name || '';
    const toName = members.find(m => m.id === settlement.to)?.name || '';
    const isConfirmed = await confirm(
      t('settle.mark_paid_msg', {
        from: fromName,
        to: toName,
        amount: settlement.amount.toFixed(0),
      }),
      {
        title: t('settle.mark_paid_title'),
        confirmLabel: t('settle.mark_paid_action'),
        cancelLabel: t('common.cancel'),
      },
    );
    if (!isConfirmed) return;
    markingSettlementRef.current = true;
    try {
      await firebaseService.markSettlementPaid(groupId, {
        from: settlement.from,
        to: settlement.to,
        amount: settlement.amount,
        completedBy: user.uid,
        completedByMemberId: currentMemberId,
      });
      toast.success(t('settle.mark_paid_toast'));
    } catch (error) {
      console.error('Mark settlement paid error:', error);
      toast.error(t('common.error'));
    } finally {
      markingSettlementRef.current = false;
    }
  };

  const handleUnmarkSettlement = async (settlementId: string) => {
    if (!user || !groupId) return;
    const record = completedSettlements.find(s => s.id === settlementId);
    if (!record) return;
    if (record.completedBy !== user.uid && !isHost) {
      toast.error(t('settle.unmark_not_allowed'));
      return;
    }
    const isConfirmed = await confirm(t('settle.unmark_msg'), {
      title: t('settle.unmark_title'),
      confirmLabel: t('settle.unmark_action'),
      cancelLabel: t('common.cancel'),
    });
    if (!isConfirmed) return;
    try {
      await firebaseService.unmarkSettlement(groupId, settlementId);
      toast.success(t('settle.unmark_toast'));
    } catch (error) {
      console.error('Unmark settlement error:', error);
      toast.error(t('common.error'));
    }
  };

  const value = {
    groupId, currentGroup, myGroups, members, expenses, completedSettlements,
    currentMemberId, currentMember,
    isHost, isSettled,
    isLoading,
    handleCreateGroup, handleJoinGroup, handleLeaveGroup, handleDeleteGroup,
    handleSelectMember, handleCreateMember, handleCreateMemberByHost, handleDeleteMember, handleUpdateProfile,
    handleUpdateGroupName, handleAddExpense, handleUpdateExpense, handleDeleteExpense,
    handleSettleGroup, handleUnsettleGroup,
    handleMarkSettlementPaid, handleUnmarkSettlement,
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}

