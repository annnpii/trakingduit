"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BellRing, CalendarClock, Check, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { createBill, deleteBill, getSalaryForMonth, payBill, runBillReminderScan, updateBill, upsertSalary } from "@/lib/repo";
import { SalarySheet } from "@/components/bills/salary-sheet";
import type { Bill } from "@/lib/types";
import { cn, daysBetween, formatDate, formatIDR, parseAmount, toDateKey } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Sheet,
  useToast,
} from "@/components/ui";
import { StatTile } from "@/components/ui/stat-tile";

const REPEAT_LABEL: Record<Bill["repeat"], string> = {
  none: "Sekali",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

export default function BillsPage() {
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Bill | null>(null);
  const [salaryOpen, setSalaryOpen] = React.useState(false);
  const [hideBalance, setHideBalance] = React.useState(false);

  React.useEffect(() => {
    const val = localStorage.getItem("td.hideBalance") === "1";
    setHideBalance(val);
  }, []);

  const toggleHideBalance = () => {
    const next = !hideBalance;
    setHideBalance(next);
    localStorage.setItem("td.hideBalance", next ? "1" : "0");
  };

  const mask = (n: number) => (hideBalance ? "••••••" : n);

  const month = toDateKey().slice(0, 7);
  const salary = useLiveQuery(() => getSalaryForMonth(month), [month]);
  const bills = useLiveQuery(() => db().bills.filter((b) => !b.deleted).sortBy("due_date"), [], []);
  const wallets = useLiveQuery(
    () => db().wallets.filter((w) => !w.deleted && !w.archived).sortBy("order"),
    [],
    [],
  );
  const categories = useLiveQuery(
    () => db().categories.filter((c) => !c.deleted && c.type === "expense").toArray(),
    [],
    [],
  );

  const today = toDateKey();
  const active = bills.filter((b) => !b.archived);
  const overdue = active.filter((b) => b.due_date < today);
  const dueSoon = active.filter((b) => {
    const d = daysBetween(today, b.due_date);
    return d >= 0 && d <= 7;
  });
  const monthlyTotal = active
    .filter((b) => b.repeat === "monthly")
    .reduce((a, b) => a + b.amount, 0);

  const totalActiveBills = active.reduce((a, b) => a + b.amount, 0);
  const remainingSalary = (salary?.amount ?? 0) - totalActiveBills;
  const salaryPercent = salary?.amount ? (totalActiveBills / salary.amount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label="Tagihan aktif" value={`${active.length}`} />
        <StatTile label="Bulanan" value={mask(monthlyTotal)} tone="expense" />
        <StatTile
          label="Gaji"
          value={mask(salary?.amount ?? 0)}
          hint={
            <button
              onClick={toggleHideBalance}
              className="flex items-center gap-1 text-[10px] text-muted transition hover:text-fg"
            >
              {hideBalance ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              {hideBalance ? "Tampilkan" : "Sembunyikan"}
            </button>
          }
        />
        <StatTile label="Sisa Gaji" value={mask(remainingSalary)} tone={remainingSalary >= 0 ? "income" : "expense"} />
        <StatTile label="Persentase" value={`${Math.round(salaryPercent)}%`} tone={salaryPercent > 100 ? "expense" : salaryPercent < 50 ? "income" : "brand"} />
        <StatTile label="Deadline ≤7 hari" value={`${dueSoon.length}`} tone="brand" />
      </div>

      {!salary && (
        <Card className="flex flex-col gap-3 rounded-2xl border-brand/20 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold">Belum ada gaji yang keinput</h4>
            <p className="text-xs text-muted">Isi gaji bulanan dulu biar TrackingDuit bisa itung sisa duit kamu setelah bayar tagihan.</p>
          </div>
          <Button size="sm" onClick={() => setSalaryOpen(true)}>Set Gaji</Button>
        </Card>
      )}

      {salary && salaryPercent > 100 && (
        <Card className="border-expense/20 bg-expense/10 p-3 text-xs font-medium text-expense">
          Duh, total tagihan udah lebih gede dari gaji kamu bulan ini! ({Math.round(salaryPercent)}%)
        </Card>
      )}
      {salary && salaryPercent >= 50 && salaryPercent <= 100 && (
        <Card className="border-warn/20 bg-warn/10 p-3 text-xs font-medium text-warn">
          Hati-hati, {Math.round(salaryPercent)}% gaji abis buat tagihan nih!
        </Card>
      )}
      {salary && salaryPercent < 50 && (
        <Card className="border-income/20 bg-income/10 p-3 text-xs font-medium text-income">
          Mantap, tagihan cuma makan {Math.round(salaryPercent)}% gaji kamu bulan ini!
        </Card>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setSalaryOpen(true)}>
          Set Gaji
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const n = await runBillReminderScan();
            toast(n ? `${n} pengingat dibuat` : "Tidak ada pengingat baru", "success");
          }}
        >
          <BellRing className="size-4" /> Cek reminder
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> Tagihan
        </Button>
      </div>

      {bills.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {bills.map((b) => {
            const days = daysBetween(today, b.due_date);
            const late = days < 0 && !b.archived;
            return (
              <Card key={b.id} className={cn("p-4", b.archived && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full",
                        late ? "bg-expense/10 text-expense" : "bg-warn/10 text-warn",
                      )}
                    >
                      <CalendarClock className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-[11px] text-muted">
                        {formatDate(b.due_date)} · {REPEAT_LABEL[b.repeat]}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit"
                      onClick={() => {
                        setEditing(b);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Hapus"
                      onClick={() => deleteBill(b.id)}
                    >
                      <Trash2 className="size-3.5 text-expense" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="num text-lg font-semibold">{formatIDR(b.amount)}</span>
                  <Badge tone={b.archived ? "neutral" : late ? "expense" : days <= 3 ? "warn" : "brand"}>
                    {b.archived
                      ? "Selesai"
                      : late
                        ? `Telat ${Math.abs(days)} hari`
                        : days === 0
                          ? "Hari ini"
                          : `${days} hari lagi`}
                  </Badge>
                </div>

                {!b.archived ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={async () => {
                      await payBill(b.id);
                      toast(`${b.name} ditandai lunas`, "success");
                    }}
                  >
                    <Check className="size-3.5" /> Tandai lunas
                    {b.auto_create_tx ? " + catat" : ""}
                  </Button>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="Belum ada tagihan"
            description="Catat listrik, internet, cicilan, atau langganan supaya tidak telat bayar."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="size-4" /> Tambah tagihan
              </Button>
            }
          />
        </Card>
      )}

      <BillSheet
        open={open}
        bill={editing}
        wallets={wallets}
        categories={categories}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />
      <SalarySheet
        open={salaryOpen}
        onClose={() => setSalaryOpen(false)}
        month={month}
        initialAmount={salary?.amount}
      />
    </div>
  );
}

// Simplified Sheet to avoid complex state management in this Edit

function BillSheet({
  open,
  bill,
  wallets,
  categories,
  onClose,
}: {
  open: boolean;
  bill: Bill | null;
  wallets: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState(toDateKey());
  const [repeat, setRepeat] = React.useState<Bill["repeat"]>("monthly");
  const [reminderDays, setReminderDays] = React.useState("3");
  const [walletId, setWalletId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [autoTx, setAutoTx] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setName(bill?.name ?? "");
    setAmount(bill ? new Intl.NumberFormat("id-ID").format(bill.amount) : "");
    setDueDate(bill?.due_date ?? toDateKey());
    setRepeat(bill?.repeat ?? "monthly");
    setReminderDays(String(bill?.reminder_days ?? 3));
    setWalletId(bill?.wallet_id ?? wallets[0]?.id ?? "");
    setCategoryId(bill?.category_id ?? "");
    setAutoTx(bill ? Boolean(bill.auto_create_tx) : true);
  }, [open, bill, wallets]);

  async function save() {
    const value = parseAmount(amount);
    if (!name.trim() || value <= 0) return;
    const payload = {
      name: name.trim(),
      amount: value,
      due_date: dueDate,
      repeat,
      reminder_days: Number(reminderDays) || 0,
      wallet_id: walletId || undefined,
      category_id: categoryId || undefined,
      auto_create_tx: (autoTx ? 1 : 0) as 0 | 1,
    };
    if (bill) {
      await updateBill(bill.id, payload);
      toast("Tagihan diperbarui", "success");
    } else {
      await createBill({ ...payload, archived: 0 });
      toast("Tagihan ditambahkan", "success");
    }
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={bill ? "Edit Tagihan" : "Tagihan Baru"}
      footer={
        <Button className="w-full" size="lg" onClick={save} disabled={!name.trim() || !amount}>
          Simpan
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Nama tagihan">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. Listrik PLN"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nominal">
            <Input
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const formatted = digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
                setAmount(formatted);
              }}
              placeholder="0"
            />
          </Field>
          <Field label="Jatuh tempo">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Pengulangan">
            <Select value={repeat} onChange={(e) => setRepeat(e.target.value as Bill["repeat"])}>
              {Object.entries(REPEAT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ingatkan (hari sebelum)">
            <Input
              inputMode="numeric"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Dompet pembayar">
            <Select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
              <option value="">-</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kategori">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">-</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
          <input
            type="checkbox"
            checked={autoTx}
            onChange={(e) => setAutoTx(e.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          <span className="text-xs">
            Buat transaksi pengeluaran otomatis saat ditandai lunas
          </span>
        </label>
      </div>
    </Sheet>
  );
}
