import { Timestamp } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  userId?: string; // Binds to a Firebase User UID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isHost?: boolean;
}

export interface GroupCurrency {
  code: string; // Free-form label, 1–4 characters (e.g. "JPY" or "日圓")
  rate: number; // 1 unit of this currency = rate × default currency
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  // Public token used in invite URLs (/join/:joinId). Decoupled from the
  // internal Firestore id so the id itself can't be guessed to join the group.
  // Optional for legacy groups created before this field existed.
  joinId?: string;
  settledAt?: Timestamp | null;
  settledBy?: string | null;
  // Currency settings. Both optional for legacy groups: absent means
  // defaultCurrency 'TWD' with currencies [{ code: 'TWD', rate: 1 }].
  // `currencies` contains ALL group currencies including the default,
  // whose entry always has rate 1.
  defaultCurrency?: string;
  currencies?: GroupCurrency[];
}

export interface Payment {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // Keep for backward compatibility/primary payer
  payments?: Payment[]; // Support for multiple payers
  splitAmong: string[];
  splits?: Payment[]; // Support for custom split amounts
  // Concrete currency code stamped at save time (even when it equals the
  // group default). Absent on legacy expenses → treated as the group default.
  currency?: string;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SettlementRecord {
  id: string;
  from: string; // memberId of payer
  to: string;   // memberId of receiver
  amount: number;
  completedBy: string;       // userId who marked it paid
  completedByMemberId: string; // memberId who marked it paid (must be from or to)
  completedAt?: Timestamp;
}

export interface UserSettings {
  lastGroupId: string | null;
  joinedGroupIds?: string[];
  currentMemberId?: string | null;
  createdOn?: Timestamp;
  lastLoginOn?: Timestamp;
  isAnonymous?: boolean;
  loginMethod?: 'anonymous' | 'google';
  country?: string | null;
}
