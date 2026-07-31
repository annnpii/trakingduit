"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import {
  createTransaction,
  deleteTransaction,
  guessCategory,
  updateTransaction,
} from "@/lib/repo";
import type { ID, Transaction, TxType } from "@/lib/types";
import { cn, formatIDR, parseAmount, toDateKey } from "@/lib/utils";
import {
  Button,
  Field,
  Input,
  Select,
  SegmentedControl,
  Sheet,
  Textarea,
  useToast,
} from "@/components/ui";
import { DynIcon } from "@/components/ui/icon";

export interface TransactionDraft {
  type?: TxType;
  amount?: number;
  wallet_id?: ID;
  category_id?: ID;
  date?: string;
  note?: string;
  merchant?: string;
  receipt_id?: ID;
  source?: Transaction["source"];
}

export function TransactionSheet({
  open,
  onClose,
  editing,
  draft,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
  draft?: TransactionDraft;
  onSaved?: (tx: Transaction) => void;
}) {
  const toast = useToast();
  const wallets = useLiveQuery(
    () => db().wallets.filter((w) => !w.deleted && !w.archived).sortBy("order"),
    [],
    [],
  );
  const categories = useLiveQuery(
    () => db().categories.filter((c) => !c.deleted).toArray(),
    [],
    [],
  );

  const [type, setType] = React.useState<TxType>("expense");
  const [amount, setAmount] = React.useState("");
  const [walletId, setWalletId] = React.useState<ID>("");
  const [toWalletId, setToWalletId] = React.useState<ID>("");
  const [categoryId, setCategoryId] = React.useState<ID>("");
  const [date, setDate] = React.useState(toDateKey());
  const [merchant, setMerchant] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Reset the form each time the sheet opens.
  React.useEffect(() => {
    if (!open) return;
    const base = editing ?? draft ?? {};
    setType((base.type as TxType) ?? "expense");
    setAmount(base.amount ? String(base.amount) : "");
    setWalletId(base.wallet_id ?? "");
    setToWalletId((editing?.to_wallet_id as string) ?? "");
    setCategoryId(base.category_id ?? "");
    setDate(base.date ?? toDateKey());
    setMerchant(base.merchant ?? "");
    setNote(base.note ?? "");
  }, [open, editing, draft]);

  // Falls back to the first wallet until the user picks one — derived so the
  // async wallet load doesn't need an extra state write.
  const activeWallet = walletId || wallets[0]?.id || "";

  const typeCats = React.useMemo(
    () => categories.filter((c) => c.type === (type === "income" ? "income" : "expense")),
    [categories, type],
  );

  React.useEffect(() => {
    if (categoryId && !typeCats.some((c) => c.id === categoryId)) setCategoryId("");
  }, [typeCats, categoryId]);

  // Auto-categorize from merchant/note keywords when the user hasn't picked one.
  React.useEffect(() => {
    if (type === "transfer" || categoryId) return;
    const text = `${merchant} ${note}`.trim();
    if (text.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const guess = await guessCategory(text, type);
      if (!cancelled && guess) setCategoryId(guess.id);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [merchant, note, type, categoryId]);

  const numericAmount = parseAmount(amount);
  const canSave =
    numericAmount > 0 &&
    Boolean(activeWallet) &&
    (type !== "transfer" || (Boolean(toWalletId) && toWalletId !== activeWallet));

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        type,
        amount: numericAmount,
        wallet_id: activeWallet,
        to_wallet_id: type === "transfer" ? toWalletId : undefined,
        category_id: type === "transfer" ? undefined : categoryId || undefined,
        date,
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        tags: [],
        receipt_id: editing?.receipt_id ?? draft?.receipt_id,
        source: editing?.source ?? draft?.source ?? ("manual" as const),
      };
      if (editing) {
        await updateTransaction(editing.id, payload);
        toast("Transaksi diperbarui", "success");
        onSaved?.({ ...editing, ...payload } as Transaction);
      } else {
        const row = await createTransaction(payload);
        toast(
          `${type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : "Transfer"} ${formatIDR(numericAmount)} tersimpan`,
          "success",
        );
        onSaved?.(row);
      }
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal menyimpan", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing) return;
    await deleteTransaction(editing.id);
    toast("Transaksi dihapus", "success");
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Ubah Transaksi" : "Catat Transaksi"}
      description={editing ? undefined : "Isi nominal, dompet, dan kategori"}
      footer={
        <div className="flex gap-2">
          {editing ? (
            <Button variant="ghost" size="lg" onClick={remove} aria-label="Hapus">
              <Trash2 className="size-4 text-expense" />
            </Button>
          ) : null}
          <Button className="flex-1" size="lg" onClick={save} disabled={!canSave} loading={saving}>
            Simpan
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SegmentedControl
          className="w-full"
          value={type}
          onChange={(v) => setType(v)}
          options={[
            { value: "expense", label: "Pengeluaran" },
            { value: "income", label: "Pemasukan" },
            { value: "transfer", label: "Transfer" },
          ]}
        />

        <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <span className="text-xs text-muted">Nominal</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-medium text-muted">Rp</span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const formatted = digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
                setAmount(formatted);
              }}
              placeholder="0"
              className={cn(
                "num w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-muted/40",
                type === "income" ? "text-income" : type === "expense" ? "text-fg" : "text-fg",
              )}
            />
          </div>
          {numericAmount > 0 ? (
            <p className="mt-1 text-xs text-muted">{formatIDR(numericAmount)}</p>
          ) : null}
        </div>

        <div className={cn("grid gap-3", type === "transfer" ? "grid-cols-2" : "grid-cols-1")}>
          <Field label={type === "transfer" ? "Dari dompet" : "Dompet"}>
            <Select value={activeWallet} onChange={(e) => setWalletId(e.target.value)}>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          {type === "transfer" ? (
            <Field label="Ke dompet">
              <Select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)}>
                <option value="">Pilih…</option>
                {wallets
                  .filter((w) => w.id !== activeWallet)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </Select>
            </Field>
          ) : null}
        </div>

        {type !== "transfer" ? (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Kategori</span>
            <div className="grid grid-cols-4 gap-2">
              {typeCats.map((c) => {
                const active = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(active ? "" : c.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-[10px] leading-tight transition",
                      active
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-surface-2 text-muted hover:text-fg",
                    )}
                  >
                    <span
                      className="grid size-7 place-items-center rounded-lg"
                      style={{ background: `${c.color}22`, color: c.color }}
                    >
                      <DynIcon name={c.icon} className="size-3.5" />
                    </span>
                    <span className="line-clamp-2 text-center">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-xs text-muted">
            <ArrowLeftRight className="size-4" /> Transfer tidak memengaruhi total pemasukan/pengeluaran
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Merchant / Sumber">
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="cth. Indomaret"
            />
          </Field>
        </div>

        <Field label="Catatan">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opsional"
            rows={2}
          />
        </Field>
      </div>
    </Sheet>
  );
}
