import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  deleteField,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Member, Expense } from '../types';

export type ExpenseInput = Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

function validateExpenseArrays(data: Partial<ExpenseInput>) {
  const toCents = (n: number) => Math.round(n * 100);
  const amountCents = data.amount !== undefined ? toCents(data.amount) : null;

  if (data.splits && data.splits.length > 0) {
    if (data.splits.some(s => s.amount < 0))
      throw new Error('Split amounts must be non-negative');
    if (amountCents !== null) {
      const sum = data.splits.reduce((acc, s) => acc + toCents(s.amount), 0);
      if (Math.abs(sum - amountCents) > 1)
        throw new Error('Splits must sum to expense amount');
    }
  }

  if (data.payments && data.payments.length > 0) {
    if (data.payments.some(p => p.amount < 0))
      throw new Error('Payment amounts must be non-negative');
    if (amountCents !== null) {
      const sum = data.payments.reduce((acc, p) => acc + toCents(p.amount), 0);
      if (Math.abs(sum - amountCents) > 1)
        throw new Error('Payments must sum to expense amount');
    }
  }
}

// Random invite token for /join/:joinId URLs. Excludes visually ambiguous
// characters (0/O/1/I/l) so it's safer to read off a screen.
const JOIN_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function generateJoinId(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += JOIN_ID_ALPHABET[bytes[i] % JOIN_ID_ALPHABET.length];
  }
  return out;
}

export const firebaseService = {
  async createGroup(userId: string, groupName: string, hostName: string) {
    const groupRef = doc(collection(db, 'groups'));
    const groupId = groupRef.id;
    const joinId = generateJoinId();

    const batch = writeBatch(db);

    // 1. Create Group
    batch.set(groupRef, {
      name: groupName.trim(),
      createdBy: userId,
      joinId,
      createdAt: serverTimestamp(),
    });

    // 2. Create Host Member
    const memberRef = doc(collection(db, 'groups', groupId, 'members'));
    batch.set(memberRef, {
      name: hostName,
      userId: userId,
      isHost: true,
      createdAt: serverTimestamp(),
    });

    // 3. Update User Settings
    const userRef = doc(db, 'users', userId);
    batch.set(userRef, {
      lastGroupId: groupId,
      joinedGroupIds: arrayUnion(groupId),
    }, { merge: true });

    await batch.commit();
    return groupId;
  },

  // Resolve a public join token to its Firestore group id.
  // Returns null if the join token doesn't match any group.
  // Legacy fallback: groups created before the joinId field exists can still be
  // joined via their raw Firestore id. Once a group has joinId, that fallback
  // is intentionally disabled for it (so id-guessing can't bypass the gate).
  async resolveJoinId(joinId: string): Promise<string | null> {
    const trimmed = joinId.trim();
    if (!trimmed) return null;

    const q = query(collection(db, 'groups'), where('joinId', '==', trimmed), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].id;

    // Legacy fallback for invite links generated before joinId existed.
    const legacyRef = doc(db, 'groups', trimmed);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && !legacySnap.data().joinId) {
      return legacySnap.id;
    }
    return null;
  },

  // Backfill joinId for groups created before this field existed. Host-only
  // (Firestore rules require createdBy == auth.uid for group updates).
  async ensureJoinId(groupId: string): Promise<string> {
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (!snap.exists()) throw new Error('group_not_found');
    const existing = snap.data().joinId as string | undefined;
    if (existing) return existing;
    const joinId = generateJoinId();
    await updateDoc(groupRef, { joinId, updatedAt: serverTimestamp() });
    return joinId;
  },

  async joinGroup(userId: string, groupId: string) {
    const groupRef = doc(db, 'groups', groupId);
    let groupSnap;
    try {
      groupSnap = await getDoc(groupRef);
    } catch (err) {
      console.error("Firestore Error: Failed to read group for joining", err);
      throw err;
    }

    if (!groupSnap.exists()) {
      throw new Error('group_not_found');
    }

    try {
      await setDoc(doc(db, 'users', userId), {
        lastGroupId: groupId,
        joinedGroupIds: arrayUnion(groupId),
      }, { merge: true });
    } catch (err) {
      console.error("Firestore Error: Failed to update user settings for joining", err);
      throw err;
    }
  },

  async leaveGroup(userId: string, groupId: string, memberId: string) {
    const batch = writeBatch(db);

    // 1. Unbind member from user
    batch.update(doc(db, 'groups', groupId, 'members', memberId), {
      userId: null,
      updatedAt: serverTimestamp(),
    });

    // 2. Remove group from user's joined list
    batch.set(doc(db, 'users', userId), {
      lastGroupId: null,
      joinedGroupIds: arrayRemove(groupId),
    }, { merge: true });

    await batch.commit();
  },

  async deleteGroup(
    userId: string,
    groupId: string,
    expenseIds: string[],
    memberIds: string[],
    settlementIds: string[] = [],
  ) {
    const batch = writeBatch(db);

    // 1. Delete all expenses
    for (const id of expenseIds) {
      batch.delete(doc(db, 'groups', groupId, 'expenses', id));
    }

    // 2. Delete all members
    for (const id of memberIds) {
      batch.delete(doc(db, 'groups', groupId, 'members', id));
    }

    // 3. Delete all settlement records
    for (const id of settlementIds) {
      batch.delete(doc(db, 'groups', groupId, 'settlements', id));
    }

    // 4. Delete group itself
    batch.delete(doc(db, 'groups', groupId));

    // 5. Update user settings (remove from joined lists)
    batch.set(doc(db, 'users', userId), {
      lastGroupId: null,
      joinedGroupIds: arrayRemove(groupId),
    }, { merge: true });

    await batch.commit();
  },

  async claimMember(groupId: string, memberId: string, userId: string) {
    await updateDoc(doc(db, 'groups', groupId, 'members', memberId), {
      userId,
      updatedAt: serverTimestamp(),
    });
    // Ensure the group appears in "My Groups"
    await setDoc(doc(db, 'users', userId), {
      lastGroupId: groupId,
      joinedGroupIds: arrayUnion(groupId),
    }, { merge: true });
  },

  async createMember(groupId: string, name: string, userId: string | null = null) {
    const memberRef = await addDoc(collection(db, 'groups', groupId, 'members'), {
      name: name.trim(),
      userId,
      createdAt: serverTimestamp(),
    });
    // Ensure the group appears in "My Groups" (only for real users, not host-created placeholders)
    if (userId) {
      await setDoc(doc(db, 'users', userId), {
        lastGroupId: groupId,
        joinedGroupIds: arrayUnion(groupId),
      }, { merge: true });
    }
    return memberRef;
  },

  async deleteMember(groupId: string, memberId: string) {
    await deleteDoc(doc(db, 'groups', groupId, 'members', memberId));
  },

  async updateMember(groupId: string, memberId: string, data: Partial<Member>) {
    await updateDoc(doc(db, 'groups', groupId, 'members', memberId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async updateGroupName(groupId: string, newName: string) {
    await updateDoc(doc(db, 'groups', groupId), {
      name: newName.trim(),
      updatedAt: serverTimestamp(),
    });
  },

  async settleGroup(groupId: string, userId: string) {
    await updateDoc(doc(db, 'groups', groupId), {
      settledAt: serverTimestamp(),
      settledBy: userId,
      updatedAt: serverTimestamp(),
    });
  },

  async unsettleGroup(groupId: string) {
    await updateDoc(doc(db, 'groups', groupId), {
      settledAt: deleteField(),
      settledBy: deleteField(),
      updatedAt: serverTimestamp(),
    });
  },

  async addExpense(groupId: string, memberId: string, expenseData: ExpenseInput) {
    validateExpenseArrays(expenseData);
    const data: any = {
      ...expenseData,
      createdBy: memberId,
      createdAt: serverTimestamp(),
    };

    // Clean up any undefined values to avoid Firestore errors
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    return await addDoc(collection(db, 'groups', groupId, 'expenses'), data);
  },

  async updateExpense(groupId: string, expenseId: string, expenseData: Partial<ExpenseInput>) {
    validateExpenseArrays(expenseData);
    const data: any = {
      ...expenseData,
      updatedAt: serverTimestamp(),
    };

    // If 'splits' key is explicitly passed as undefined (e.g. disabled custom split),
    // we want to use deleteField() to remove it from the document in Firestore.
    if ('splits' in expenseData && expenseData.splits === undefined) {
      data.splits = deleteField();
    }

    // Clean up any other undefined values to avoid Firestore errors
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    await updateDoc(doc(db, 'groups', groupId, 'expenses', expenseId), data);
  },

  async deleteExpense(groupId: string, expenseId: string) {
    await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseId));
  },

  async markSettlementPaid(
    groupId: string,
    payload: { from: string; to: string; amount: number; completedBy: string; completedByMemberId: string },
  ) {
    return await addDoc(collection(db, 'groups', groupId, 'settlements'), {
      ...payload,
      completedAt: serverTimestamp(),
    });
  },

  async unmarkSettlement(groupId: string, settlementId: string) {
    await deleteDoc(doc(db, 'groups', groupId, 'settlements', settlementId));
  },

  async updateUserLastGroup(userId: string, groupId: string | null) {
    await setDoc(doc(db, 'users', userId), {
      lastGroupId: groupId,
    }, { merge: true });
  }
};
