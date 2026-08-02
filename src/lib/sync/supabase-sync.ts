"use client";

import type { Table } from "dexie";
import { db, getSetting, setSetting, seedIfEmpty } from "../db";
import { pushNotification } from "../repo";
import { supabaseBrowser } from "../supabase";
import type { Syncable, SyncLog } from "../types";
import { nowISO } from "../utils";

export const LAST_SUPABASE_SYNC = "sync.supabase.lastAt";

/** Local Dexie table ⇄ Postgres table. Receipts stay local (images are heavy). */
const TABLES = [
  { remote: "wallets", local: () => db().wallets },
  { remote: "categories", local: () => db().categories },
  { remote: "transactions", local: () => db().transactions },
  { remote: "budgets", local: () => db().budgets },
  { remote: "saving_goals", local: () => db().goals },
  { remote: "bills", local: () => db().bills },
] as const;

export interface SupabaseSyncResult {
  pushed: number;
  pulled: number;
  at: string;
}

export interface SupabaseSyncOptions {
  /** Background runs skip the in-app notification so auto-sync tidak spam. */
  silent?: boolean;
}

/** Drop device-only fields and stamp ownership before pushing. */
function toRemote<T extends Syncable>(row: T, userId: string): Record<string, unknown> {
  const { remote_rev: _remoteRev, ...rest } = row as T & { remote_rev?: string };
  return { ...rest, user_id: userId };
}

function toLocal(row: Record<string, unknown>): Record<string, unknown> {
  const { user_id: _userId, ...rest } = row;
  return { ...rest, remote_rev: rest.updated_at };
}

export async function syncSupabase(options: SupabaseSyncOptions = {}): Promise<SupabaseSyncResult> {
  const sb = supabaseBrowser();
  if (!sb) throw new Error("Supabase belum dikonfigurasi");

  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Belum login ke akun cloud");

  const since = await getSetting<string>(LAST_SUPABASE_SYNC, new Date(0).toISOString());
  const startedAt = nowISO();
  let pushed = 0;
  let pulled = 0;

  try {
    for (const { remote, local } of TABLES) {
      const table = local() as unknown as Table<Syncable, string>;

      /* push local changes */
      const dirty = (await table.filter((r) => !r.remote_rev || r.updated_at > r.remote_rev).toArray()) as Syncable[];
      if (dirty.length) {
        const { error } = await sb
          .from(remote)
          .upsert(dirty.map((r) => toRemote(r, userId)), { onConflict: "id" });
        if (error) throw new Error(`${remote}: ${error.message}`);
        pushed += dirty.length;
        
        // update local remote_rev so they are marked as synced
        for (const r of dirty) {
          await table.update(r.id, { remote_rev: r.updated_at });
        }
      }

      /* pull remote changes */
      const { data, error } = await sb
        .from(remote)
        .select("*")
        .eq("user_id", userId)
        .gt("updated_at", since);
      if (error) throw new Error(`${remote}: ${error.message}`);

      for (const raw of data ?? []) {
        const row = toLocal(raw as Record<string, unknown>) as unknown as Syncable;
        const existing = await table.get(row.id);
        // last write wins on updated_at
        if (existing && existing.updated_at >= row.updated_at) continue;
        await table.put(row);
        pulled++;
      }
    }

    await setSetting(LAST_SUPABASE_SYNC, startedAt);
    // Auto-sync jalan tiap menit; tanpa guard ini syncLogs tumbuh ~1440 baris/hari.
    if (!options.silent || pushed || pulled) {
      await logSync({
        target: "supabase",
        direction: "two-way",
        status: "success",
        pushed,
        pulled,
        message: `${pushed} dikirim, ${pulled} diterima`,
        at: startedAt,
      });
    }
    if ((pushed || pulled) && !options.silent) {
      await pushNotification({
        title: "Sinkron Supabase selesai",
        body: `${pushed} baris dikirim, ${pulled} diterima.`,
        kind: "sync",
      });
    }
    return { pushed, pulled, at: startedAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sinkronisasi gagal";
    await logSync({
      target: "supabase",
      direction: "two-way",
      status: "error",
      pushed,
      pulled,
      message,
      at: nowISO(),
    });
    throw new Error(message);
  }
}

async function logSync(entry: Omit<SyncLog, "id">) {
  await db().syncLogs.add(entry as SyncLog);
}

export async function lastSupabaseSync(): Promise<string | null> {
  const value = await getSetting<string | null>(LAST_SUPABASE_SYNC, null);
  return value && value !== new Date(0).toISOString() ? value : null;
}
