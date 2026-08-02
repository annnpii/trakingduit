"use client";

import Link from "next/link";
import {
  Bell,
  CalendarClock,
  ChartPie,
  ChevronRight,
  CreditCard,
  LogOut,
  ScanLine,
  Settings,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { Button, Card } from "@/components/ui";

const ITEMS = [
  { href: "/scan", label: "Scan Nota", desc: "Foto struk, auto-catat jadi transaksi", icon: ScanLine },
  { href: "/wallets", label: "Dompet", desc: "Atur dompet, bank, & e-wallet kamu", icon: Wallet },
  { href: "/budgets", label: "Budget", desc: "Set budget, biar gak boncos", icon: CreditCard },
  { href: "/goals", label: "Target Nabung", desc: "Pantau progres menabung", icon: Target },
  { href: "/bills", label: "Tagihan", desc: "Pengingat jatuh tempo", icon: CalendarClock },
  { href: "/analytics", label: "Analitik", desc: "Cek tren pengeluaran kamu", icon: ChartPie },
  { href: "/insight", label: "AI Insight", desc: "Bocoran AI buat keuangan kamu", icon: Sparkles },
  { href: "/notifications", label: "Notifikasi", desc: "Peringatan & log sinkron", icon: Bell },
  { href: "/settings", label: "Pengaturan", desc: "Sinkron, data, tema, PIN", icon: Settings },
];

export default function MenuPage() {
  const { profile, signOut } = useSession();

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <span
          className="grid size-12 place-items-center rounded-2xl text-lg font-semibold text-white"
          style={{ background: profile?.avatar_color ?? "#0f9d76" }}
        >
          {(profile?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{profile?.name}</p>
          <p className="truncate text-xs text-muted">{profile?.email ?? "Mode lokal"}</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2"
              >
                <span className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand">
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-muted">{item.desc}</span>
                </span>
                <ChevronRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => signOut()}>
        <LogOut className="size-4" /> Keluar
      </Button>

      <p className="text-center text-xs text-muted">
        TrackingDuit v1.7.0
      </p>
    </div>
  );
}
