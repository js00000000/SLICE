import { createContext, useContext, useState, useEffect } from 'react';
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
  handleJoinGroup: (id: string) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

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
    if (!user) return;

    const settingsRef = doc(db, 'users', user.uid);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserSettings;
        if (data.joinedGroupIds && data.joinedGroupIds.length > 0) {
          const groupsQuery = query(
            collection(db, 'groups'),
            where(documentId(), 'in', data.joinedGroupIds.slice(0, 30))
          );
          
          getDocs(groupsQuery).then(snapshot => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            setMyGroups(groupsData);
          }).catch(err => console.error("Fetch my groups error:", err));
        } else {
          setMyGroups([]);
        }
      } else {
        setMyGroups([]);
      }
    });

    return () => unsubSettings();
  }, [user]);

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

    setIsLoading(true);
    const unsubGroup = onSnapshot(doc(db, 'groups', groupId), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentGroup({ id: docSnap.id, ...docSnap.data() } as Group);
      } else {
        navigate('/', { replace: true });
      }
    }, (error) => {
      console.error("Group fetch error:", error);
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

    const unsubExpenses = onSnapshot(collection(db, 'groups', groupId, 'expenses'), (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      expensesData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setExpenses(expensesData);
    });

    const unsubSettlements = onSnapshot(collection(db, 'groups', groupId, 'settlements'), (snapshot) => {
      const settlementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SettlementRecord));
      settlementsData.sort((a, b) => (b.completedAt?.toMillis() || 0) - (a.completedAt?.toMillis() || 0));
      setCompletedSettlements(settlementsData);
    });

    return () => {
      unsubGroup();
      unsubMembers();
      unsubExpenses();
      unsubSettlements();
    };
  }, [user, groupId, navigate]);

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

  const handleJoinGroup = async (id: string) => {
    if (!user || !id.trim()) return;
    setIsLoading(true);
    try {
      await firebaseService.joinGroup(user.uid, id);
      navigate(`/group/${id.trim()}`);
    } catch (error) { 
      console.error("Join group error:", error); 
      const msg = (error as Error).message === 'group_not_found' ? t('common.error_group_not_found') : t('common.error');
      toast.error(msg);
      setIsLoading(false); 
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
      try {
        await firebaseService.leaveGroup(user.uid, groupId, currentMemberId);
        toast.success(t('groups.leave_group_success'));
        navigate('/', { replace: true });
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
      try {
        await firebaseService.deleteGroup(
          user.uid,
          groupId,
          expenses.map(e => e.id),
          members.map(m => m.id),
          completedSettlements.map(s => s.id),
        );
        navigate('/', { replace: true });
      } catch (error) { 
        console.error("Delete group error:", error); 
        toast.error(t('common.error'));
      } finally { 
        setIsLoading(false); 
      }
    }
  };

  const handleSelectMember = async (memberId: string) => {
    if (!user || !groupId) return;
    const member = members.find(m => m.id === memberId);
    if (member && member.userId && member.userId !== user.uid) { 
      toast.error(t('members.claimed')); 
      return; 
    }
    await firebaseService.claimMember(groupId, memberId, user.uid);
  };

  const handleCreateMember = async (name: string) => {
    if (!user || !groupId || !name.trim()) return;
    await firebaseService.createMember(groupId, name, user.uid);
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
    await firebaseService.deleteMember(groupId, memberId);
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

  const handleMarkSettlementPaid = async (settlement: { from: string; to: string; amount: number }) => {
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

