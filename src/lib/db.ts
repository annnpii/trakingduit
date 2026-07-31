"use client";

import Dexie, { type EntityTable } from "dexie";
import type {
  AppNotification,
  Bill,
  Budget,
  Category,
  Receipt,
  SavingGoal,
  Salary,
  Settings,
  SyncLog,
  Transaction,
  UserProfile,
  Wallet,
} from "./types";
import { DEFAULT_CATEGORIES, DEFAULT_WALLETS } from "./seed";
import { newId, nowISO } from "./utils";

/**
 * Offline-first store. Dexie is the source of truth on device; Supabase and
 * Google Sheets are sync targets (see lib/sync).
 */
export class TrackingDuitDB extends Dexie {
  wallets!: EntityTable<Wallet, "id">;
  categories!: EntityTable<Category, "id">;
  transactions!: EntityTable<Transaction, "id">;
  budgets!: EntityTable<Budget, "id">;
  goals!: EntityTable<SavingGoal, "id">;
  bills!: EntityTable<Bill, "id">;
  salaries!: EntityTable<Salary, "id">;
  receipts!: EntityTable<Receipt, "id">;
  notifications!: EntityTable<AppNotification, "id">;
  syncLogs!: EntityTable<SyncLog, "id">;
  settings!: EntityTable<Settings, "key">;
  profile!: EntityTable<UserProfile, "id">;

  constructor() {
    super("trackingduit");
    this.version(2).stores({
      wallets: "id, name, type, archived, updated_at, deleted",
      categories: "id, name, type, updated_at, deleted",
      transactions:
        "id, date, type, wallet_id, to_wallet_id, category_id, amount, updated_at, deleted, [type+date], [wallet_id+date]",
      budgets: "id, category_id, start_date, period, updated_at, deleted",
      goals: "id, name, deadline, archived, updated_at, deleted",
      bills: "id, name, due_date, archived, updated_at, deleted",
      salaries: "id, month, updated_at, deleted",
      receipts: "id, status, updated_at, deleted",
      notifications: "id, read, kind, created_at, deleted",
      syncLogs: "++id, target, at",
      settings: "key",
      profile: "id",
    });
  }
}

let _db: TrackingDuitDB | null = null;

export function db(): TrackingDuitDB {
  if (!_db) _db = new TrackingDuitDB();
  return _db;
}

/** Insert default categories + one cash wallet on first run. */
export async function seedIfEmpty(): Promise<void> {
  const d = db();
  const catCount = await d.categories.count();
  if (catCount === 0) {
    await d.categories.bulkAdd(
      DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        created_at: nowISO(),
        updated_at: nowISO(),
        deleted: 0 as const,
        is_default: 1 as const,
      })),
    );
  }
  const walletCount = await d.wallets.count();
  if (walletCount === 0) {
    await d.wallets.bulkAdd(
      DEFAULT_WALLETS.map((w, i) => ({
        ...w,
        order: i,
        created_at: nowISO(),
        updated_at: nowISO(),
        deleted: 0 as const,
        archived: 0 as const,
      })),
    );
  }
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db().settings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db().settings.put({ key, value });
}

/** Wipe every table. Used by Settings → Reset data. */
export async function resetAll(): Promise<void> {
  const d = db();
  await d.transaction(
    "rw",
    [
      d.wallets,
      d.categories,
      d.transactions,
      d.budgets,
      d.goals,
      d.bills,
      d.receipts,
      d.notifications,
      d.syncLogs,
      d.settings,
      d.profile,
    ],
    async () => {
      await Promise.all([
        d.wallets.clear(),
        d.categories.clear(),
        d.transactions.clear(),
        d.budgets.clear(),
        d.goals.clear(),
        d.bills.clear(),
        d.receipts.clear(),
        d.notifications.clear(),
        d.syncLogs.clear(),
        d.settings.clear(),
        d.profile.clear(),
      ]);
    },
  );
}
