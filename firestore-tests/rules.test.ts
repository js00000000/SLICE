import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

// Regression guard for the 2026-07-05 audit run-3 HIGH finding: a signed-in
// user could enumerate every group (open `list` on /groups), learn its
// groupId + joinId, then self-grant a member slot and read/write any group's
// expenses. The fix is rules-only:
//   1. /groups `list` is restricted to owner-scoped queries — enumeration is
//      what turned "know a groupId" into "know EVERY groupId".
//   2. joinId resolution moved to a token-keyed /joinIds/{token} lookup that is
//      get-only and host-writable only for the group's own token.
//   3. joinId is immutable on the group doc (no token-squatting by re-pointing).
// Possession of a specific groupId remains a join capability by design (see the
// "accepted residual" test) — fully closing that needs a server.

const PROJECT_ID = 'demo-slice-rules';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Distinct principals used throughout.
const HOST = 'host-uid';
const VICTIM = 'victim-uid';
const ATTACKER = 'attacker-uid';
const MEMBER = 'member-uid';

const GID = 'group-1';
const TOKEN = 'tokentoken1'; // 11 chars — inside the 8..24 rule bound

let testEnv: RulesTestEnvironment;

// Seed data with rules disabled (the app's own backend does these writes in
// batches the rules DO permit; here we just need arbitrary starting state).
async function seed(fn: (db: Firestore) => Promise<void>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore() as unknown as Firestore);
  });
}

const asUser = (uid: string) =>
  testEnv.authenticatedContext(uid).firestore() as unknown as Firestore;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(join(__dirname, '..', 'firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('/groups enumeration (the run-3 HIGH enabler)', () => {
  it('SECURITY: a non-owner cannot list the groups collection', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'Victim trip', createdBy: VICTIM, joinId: TOKEN });
    });
    await assertFails(getDocs(collection(asUser(ATTACKER), 'groups')));
  });

  it("SECURITY: a user cannot query another user's groups by createdBy", async () => {
    await assertFails(
      getDocs(query(collection(asUser(ATTACKER), 'groups'), where('createdBy', '==', VICTIM))),
    );
  });

  it('an owner CAN query their own groups (guest-cleanup path must keep working)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'Mine', createdBy: VICTIM, joinId: TOKEN });
    });
    await assertSucceeds(
      getDocs(query(collection(asUser(VICTIM), 'groups'), where('createdBy', '==', VICTIM))),
    );
  });

  it('any authed user can still GET a group by id (join / member-selection flow)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'Public-by-id', createdBy: VICTIM, joinId: TOKEN });
    });
    await assertSucceeds(getDoc(doc(asUser(ATTACKER), 'groups', GID)));
  });

  it('a member can GET a group they JOINED but did not create (My Groups per-id fetch)', async () => {
    // Regression: the "My Groups" list must fetch joined groups via per-doc
    // get(), not a `documentId() in [...]` list — the owner-scoped list rule
    // would reject the whole query as soon as it includes a joined (non-owned)
    // group. This asserts the per-doc get() the client now uses is allowed.
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'Friend trip', createdBy: HOST, joinId: TOKEN });
      await setDoc(doc(db, 'groups', GID, 'members', 'm1'), { name: 'Guest', userId: MEMBER });
      await setDoc(doc(db, 'groups', GID, 'claimedUserIds', MEMBER), { memberId: 'm1' });
    });
    await assertSucceeds(getDoc(doc(asUser(MEMBER), 'groups', GID)));
  });

  it('accepted residual: a user who already KNOWS a groupId can still self-join (needs a server to fully close)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: VICTIM, joinId: TOKEN });
    });
    const attacker = asUser(ATTACKER);
    const memberRef = doc(collection(attacker, 'groups', GID, 'members'));
    const batch = writeBatch(attacker);
    batch.set(memberRef, { name: 'mallory', userId: ATTACKER });
    batch.set(doc(attacker, 'groups', GID, 'claimedUserIds', ATTACKER), { memberId: memberRef.id });
    await assertSucceeds(batch.commit());
  });
});

describe('/joinIds token lookup', () => {
  it('is not enumerable (a list would leak every invite token)', async () => {
    await assertFails(getDocs(collection(asUser(ATTACKER), 'joinIds')));
  });

  it('resolves by token id for any authed user (the join flow)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'joinIds', TOKEN), { groupId: GID });
    });
    await assertSucceeds(getDoc(doc(asUser('rando-uid'), 'joinIds', TOKEN)));
  });

  it('the host can publish a mapping for their own token', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
    });
    await assertSucceeds(setDoc(doc(asUser(HOST), 'joinIds', TOKEN), { groupId: GID }));
  });

  it('SECURITY: a non-host cannot publish a mapping for a group they do not own', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
    });
    await assertFails(setDoc(doc(asUser(ATTACKER), 'joinIds', TOKEN), { groupId: GID }));
  });

  it('SECURITY: the host cannot point a token at a group whose joinId differs (no squatting)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
    });
    await assertFails(setDoc(doc(asUser(HOST), 'joinIds', 'squattoken99'), { groupId: GID }));
  });

  it('a mapping is immutable (update denied)', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'joinIds', TOKEN), { groupId: GID });
    });
    await assertFails(updateDoc(doc(asUser(HOST), 'joinIds', TOKEN), { groupId: 'other-group' }));
  });
});

describe('group doc joinId integrity', () => {
  it('SECURITY: the host cannot change an existing joinId', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
    });
    await assertFails(updateDoc(doc(asUser(HOST), 'groups', GID), { name: 'G', joinId: 'newtoken1234' }));
  });

  it('the host can backfill a missing joinId once', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST });
    });
    await assertSucceeds(updateDoc(doc(asUser(HOST), 'groups', GID), { name: 'G', joinId: 'backfill1234' }));
  });
});

describe('happy-path writes still succeed', () => {
  it('the full createGroup batch (group + host member + index + joinIds) is allowed for the host', async () => {
    const host = asUser(HOST);
    const gref = doc(collection(host, 'groups'));
    const gid = gref.id;
    const mref = doc(collection(host, 'groups', gid, 'members'));
    const token = 'freshtoken12';
    const batch = writeBatch(host);
    batch.set(gref, {
      name: 'Trip',
      createdBy: HOST,
      joinId: token,
      defaultCurrency: 'TWD',
      currencies: [{ code: 'TWD', rate: 1 }],
    });
    batch.set(mref, { name: 'Host', userId: HOST, isHost: true });
    batch.set(doc(host, 'groups', gid, 'claimedUserIds', HOST), { memberId: mref.id });
    batch.set(doc(host, 'joinIds', token), { groupId: gid });
    await assertSucceeds(batch.commit());
  });

  it('a claimed member can create a valid expense', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
      await setDoc(doc(db, 'groups', GID, 'members', 'm1'), { name: 'M', userId: MEMBER });
      await setDoc(doc(db, 'groups', GID, 'claimedUserIds', MEMBER), { memberId: 'm1' });
    });
    await assertSucceeds(
      setDoc(doc(asUser(MEMBER), 'groups', GID, 'expenses', 'e1'), { amount: 100, description: 'lunch' }),
    );
  });
});

describe('expense membership gate', () => {
  it('SECURITY: a non-member cannot create an expense', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
    });
    await assertFails(
      setDoc(doc(asUser('outsider-uid'), 'groups', GID, 'expenses', 'e1'), { amount: 100, description: 'x' }),
    );
  });

  it('SECURITY: a non-member cannot read expenses', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'groups', GID), { name: 'G', createdBy: HOST, joinId: TOKEN });
      await setDoc(doc(db, 'groups', GID, 'expenses', 'e1'), { amount: 100, description: 'x' });
    });
    await assertFails(getDoc(doc(asUser('outsider-uid'), 'groups', GID, 'expenses', 'e1')));
  });
});
