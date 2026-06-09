import { Timestamp } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  userId?: string; // Binds to a Firebase User UID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isHost?: boolean;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  settledAt?: Timestamp | null;
  settledBy?: string | null;
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
}
