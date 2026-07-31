"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button, Card } from "@/components/ui";
import { DynIcon } from "@/components/ui/icon";
import { nowISO } from "@/lib/utils";

export default function CategoriesSettingsPage() {
  const categories = useLiveQuery(
    () => db().categories.filter((c) => !c.deleted).toArray(),
    [],
    [],
  );

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  const toggleActive = async (id: string, currentActive: 0 | 1) => {
    await db().categories.update(id, {
      active: currentActive ? 0 : 1,
      updated_at: nowISO(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Atur Kategori</h1>
      </div>

      <p className="text-sm text-muted">
        Pilih kategori mana aja yang mau ditampilin di form transaksi. Kategori yang dinonaktifkan bakal ilang dari pilihan.
      </p>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">Pemasukan</h2>
        <Card className="divide-y divide-border">
          {income.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg"
                style={{ background: `${cat.color}22`, color: cat.color }}
              >
                <DynIcon name={cat.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">{cat.name}</span>
              <button
                onClick={() => toggleActive(cat.id, cat.active)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  cat.active ? "bg-brand" : "bg-muted/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    cat.active ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">Pengeluaran</h2>
        <Card className="divide-y divide-border">
          {expense.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg"
                style={{ background: `${cat.color}22`, color: cat.color }}
              >
                <DynIcon name={cat.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">{cat.name}</span>
              <button
                onClick={() => toggleActive(cat.id, cat.active)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  cat.active ? "bg-brand" : "bg-muted/30"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    cat.active ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
