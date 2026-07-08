import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Member, Expense, GroupCurrency } from '../types';
import { validateCurrencyCode, FALLBACK_DEFAULT_CURRENCY } from '../utils/currency';

export type ExpenseInput = Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>;

// Group and member names are capped at 50 chars by firestore.rules. Clamp here so
// auto-derived names (e.g. a long Google displayName used as the host member name)
// can't silently fail the write and abort group creation.
function clampName(name: string) {
  return name.trim().slice(0, 50);
}

function validateExpenseArrays(data: Partial<ExpenseInput>) {
  const toCents = (n: number) => Math.round(n * 100);
  const amountCents = data.amount !== undefined ? toCents(data.amount) : null;

  // If custom splits/payments are being written, the expense amount must be
  // present so their sum can be verified. On a partial update that changes the
  // arrays without resending amount, we'd otherwise skip the check and let a
  // mismatched split set through, skewing settlement math.
  const hasSplits = !!data.splits && data.splits.length > 0;
  const hasPayments = !!data.payments && data.payments.length > 0;
  if ((hasSplits || hasPayments) && amountCents === null)
    throw new Error('Expense amount is required to validate splits/payments');

  if (hasSplits) {
    if (data.splits!.some(s => s.amount < 0))
      throw new Error('Split amounts must be non-negative');
    const sum = data.splits!.reduce((acc, s) => acc + toCents(s.amount), 0);
    if (Math.abs(sum - amountCents!) > 1)
      throw new Error('Splits must sum to expense amount');
  }

  if (hasPayments) {
    if (data.payments!.some(p => p.amount < 0))
      throw new Error('Payment amounts must be non-negative');
    const sum = data.payments!.reduce((acc, p) => acc + toCents(p.amount), 0);
    if (Math.abs(sum - amountCents!) > 1)
      throw new Error('Payments must sum to expense amount');
  }

  if (data.currency !== undefined && !validateCurrencyCode(data.currency))
    throw new Error('Currency code must be 1-4 characters');
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

// Groups whose /joinIds/{token} lookup doc has been verified this session, so
// ensureJoinId doesn't re-read the mapping on every group snapshot.
const verifiedJoinMappings = new Set<string>();

export const firebaseService = {
  async createGroup(userId: string, groupName: string, hostName: string) {
    const groupRef = doc(collection(db, 'groups'));
    const groupId = groupRef.id;
    const joinId = generateJoinId();

    const batch = writeBatch(db);

    // 1. Create Group
    batch.set(groupRef, {
      name: clampName(groupName),
      createdBy: userId,
      joinId,
      defaultCurrency: FALLBACK_DEFAULT_CURRENCY,
      currencies: [{ code: FALLBACK_DEFAULT_CURRENCY, rate: 1 }],
      createdAt: serverTimestamp(),
    });

    // 2. Create Host Member
    const memberRef = doc(collection(db, 'groups', groupId, 'members'));
    batch.set(memberRef, {
      name: clampName(hostName),
      userId: userId,
      isHost: true,
      createdAt: serverTimestamp(),
    });

    // 3. Register host UID in the membership index (enables isGroupMember() in rules)
    batch.set(doc(db, 'groups', groupId, 'claimedUserIds', userId), { memberId: memberRef.id });

    // 3b. Publish the join-token lookup doc. Written in the same batch so the
    // rules' getAfter() binding (token == group.joinId, creator == host) holds.
    batch.set(doc(db, 'joinIds', joinId), { groupId });

    // 4. Update User Settings
    const userRef = doc(db, 'users', userId);
    batch.set(userRef, {
      lastGroupId: groupId,
      joinedGroupIds: arrayUnion(groupId),
    }, { merge: true });

    await batch.commit();
    return groupId;
  },

  // Resolve a public join token to its Firestore group id via the
  // /joinIds/{token} lookup doc. Returns null if the token doesn't match any
  // group. Querying the groups collection is no longer possible (rules only
  // allow owner-scoped lists), which is what keeps groupIds/joinIds
  // non-enumerable.
  // Legacy fallback: groups created before the joinId field exists can still be
  // joined via their raw Firestore id. Once a group has joinId, that fallback
  // is intentionally disabled for it (so id-guessing can't bypass the gate).
  async resolveJoinId(joinId: string): Promise<string | null> {
    const trimmed = joinId.trim();
    if (!trimmed) return null;

    const mappingSnap = await getDoc(doc(db, 'joinIds', trimmed));
    if (mappingSnap.exists()) return mappingSnap.data().groupId as string;

    // Legacy fallback for invite links generated before joinId existed.
    const legacyRef = doc(db, 'groups', trimmed);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists() && !legacySnap.data().joinId) {
      return legacySnap.id;
    }
    return null;
  },

  // Backfill joinId and its /joinIds/{token} lookup doc for groups created
  // before either existed. Host-only (rules bind both writes to createdBy).
  // Pass the group's current joinId when known to skip the group read.
  async ensureJoinId(groupId: string, existingJoinId?: string): Promise<string> {
    let joinId = existingJoinId;
    if (!joinId) {
      const groupRef = doc(db, 'groups', groupId);
      const snap = await getDoc(groupRef);
      if (!snap.exists()) throw new Error('group_not_found');
      joinId = snap.data().joinId as string | undefined;
      if (!joinId) {
        // Group predates joinId entirely: mint the token and publish both the
        // field and the lookup doc atomically.
        joinId = generateJoinId();
        const batch = writeBatch(db);
        batch.update(groupRef, { joinId, updatedAt: serverTimestamp() });
        batch.set(doc(db, 'joinIds', joinId), { groupId });
        await batch.commit();
        verifiedJoinMappings.add(groupId);
        return joinId;
      }
    }
    // Group already has a token — heal the lookup doc for groups created before
    // /joinIds existed, so their old invite links keep resolving.
    if (!verifiedJoinMappings.has(groupId)) {
      const mapRef = doc(db, 'joinIds', joinId);
      const mapSnap = await getDoc(mapRef);
      if (!mapSnap.exists()) await setDoc(mapRef, { groupId });
      verifiedJoinMappings.add(groupId);
    }
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

    // 2. Remove from membership index
    batch.delete(doc(db, 'groups', groupId, 'claimedUserIds', userId));

    // 3. Remove group from user's joined list
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
    claimedUserIds: string[] = [],
    joinId: string | null = null,
  ) {
    const batch = writeBatch(db);

    // 0. Delete the join-token lookup doc (rules check the pre-batch group doc,
    // so this must ride in the same batch as the group deletion below).
    if (joinId) {
      batch.delete(doc(db, 'joinIds', joinId));
    }

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

    // 4. Delete membership index entries
    for (const uid of claimedUserIds) {
      batch.delete(doc(db, 'groups', groupId, 'claimedUserIds', uid));
    }

    // 5. Delete group itself
    batch.delete(doc(db, 'groups', groupId));

    // 6. Update user settings (remove from joined lists)
    batch.set(doc(db, 'users', userId), {
      lastGroupId: null,
      joinedGroupIds: arrayRemove(groupId),
    }, { merge: true });

    await batch.commit();
  },

  async claimMember(groupId: string, memberId: string, userId: string) {
    const batch = writeBatch(db);
    // Claim the member slot
    batch.update(doc(db, 'groups', groupId, 'members', memberId), {
      userId,
      updatedAt: serverTimestamp(),
    });
    // Register in membership index (getAfter in rules verifies the member write above)
    batch.set(doc(db, 'groups', groupId, 'claimedUserIds', userId), { memberId });
    // Ensure the group appears in "My Groups"
    batch.set(doc(db, 'users', userId), {
      lastGroupId: groupId,
      joinedGroupIds: arrayUnion(groupId),
    }, { merge: true });
    await batch.commit();
  },

  async createMember(groupId: string, name: string, userId: string | null = null) {
    // Generate ID client-side so it can be referenced in the same batch
    const memberRef = doc(collection(db, 'groups', groupId, 'members'));
    const batch = writeBatch(db);
    batch.set(memberRef, {
      name: clampName(name),
      userId,
      createdAt: serverTimestamp(),
    });
    if (userId) {
      // Register in membership index (getAfter in rules verifies the member write above)
      batch.set(doc(db, 'groups', groupId, 'claimedUserIds', userId), { memberId: memberRef.id });
      // Ensure the group appears in "My Groups"
      batch.set(doc(db, 'users', userId), {
        lastGroupId: groupId,
        joinedGroupIds: arrayUnion(groupId),
      }, { merge: true });
    }
    await batch.commit();
    return memberRef;
  },

  // Host detaches another user from a member slot without deleting the slot or its
  // expense history. Sets member.userId back to null and removes the membership index
  // entry. The unclaimed user's /users doc is intentionally left untouched — the host
  // has no write access to it (per rules); the slot simply becomes re-claimable and the
  // detached user drops to member selection next time they open the group.
  async unclaimMember(groupId: string, memberId: string, userId: string) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'groups', groupId, 'members', memberId), {
      userId: null,
      updatedAt: serverTimestamp(),
    });
    batch.delete(doc(db, 'groups', groupId, 'claimedUserIds', userId));
    await batch.commit();
  },

  async deleteMember(groupId: string, memberId: string, userId?: string | null) {
    if (userId) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'groups', groupId, 'members', memberId));
      batch.delete(doc(db, 'groups', groupId, 'claimedUserIds', userId));
      await batch.commit();
    } else {
      await deleteDoc(doc(db, 'groups', groupId, 'members', memberId));
    }
  },

  // Ensures the /claimedUserIds/{uid} index entry exists for a user who already has a
  // claimed member slot. Called on group load to backfill entries for users who
  // joined before this index was introduced.
  async ensureGroupMembership(groupId: string, memberId: string, userId: string) {
    const ref = doc(db, 'groups', groupId, 'claimedUserIds', userId);
    // Steady-state members already have the entry (created on claim/join), so a
    // read-then-skip avoids a redundant write on every group open. Only legacy
    // members missing the index actually incur the write.
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, { memberId });
  },

  async updateMember(groupId: string, memberId: string, data: Partial<Member>) {
    const payload: Partial<Member> = { ...data };
    if (typeof payload.name === 'string') payload.name = clampName(payload.name);
    await updateDoc(doc(db, 'groups', groupId, 'members', memberId), {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  },

  async updateGroupName(groupId: string, newName: string) {
    await updateDoc(doc(db, 'groups', groupId), {
      name: clampName(newName),
      updatedAt: serverTimestamp(),
    });
  },

  // Writes the default currency and the full currency list (which always
  // contains the default at rate 1) in one update so a default change plus
  // its rate recompute is atomic.
  async updateGroupCurrencySettings(
    groupId: string,
    defaultCurrency: string,
    currencies: GroupCurrency[],
  ) {
    const trimmedDefault = defaultCurrency.trim();
    const cleaned = currencies.map(c => ({ code: c.code.trim(), rate: c.rate }));

    if (!validateCurrencyCode(trimmedDefault))
      throw new Error('Currency code must be 1-4 characters');
    if (cleaned.some(c => !validateCurrencyCode(c.code)))
      throw new Error('Currency code must be 1-4 characters');
    if (cleaned.some(c => !Number.isFinite(c.rate) || c.rate <= 0))
      throw new Error('Exchange rates must be positive numbers');
    if (new Set(cleaned.map(c => c.code)).size !== cleaned.length)
      throw new Error('Duplicate currency codes');
    const defaultEntry = cleaned.find(c => c.code === trimmedDefault);
    if (!defaultEntry || defaultEntry.rate !== 1)
      throw new Error('Default currency must be in the list with rate 1');

    await updateDoc(doc(db, 'groups', groupId), {
      defaultCurrency: trimmedDefault,
      currencies: cleaned,
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
    const data: Record<string, unknown> = {
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
    const data: Record<string, unknown> = {
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
