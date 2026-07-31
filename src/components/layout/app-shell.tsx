"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Bell,
  CalendarClock,
  ChartPie,
  CreditCard,
  LayoutGrid,
  ListOrdered,
  LockKeyhole,
  Moon,
  PiggyBank,
  Plus,
  ScanLine,
  Settings,
  Sparkles,
  Sun,
  Target,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { db } from "@/lib/db";
import { runBillReminderScan } from "@/lib/repo";
import { Button, Spinner } from "@/components/ui";
import { TransactionSheet } from "@/components/transactions/transaction-sheet";
import { LockScreen } from "@/components/layout/lock-screen";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Beranda", icon: LayoutGrid },
  { href: "/transactions", label: "Transaksi", icon: ListOrdered },
  { href: "/wallets", label: "Dompet", icon: Wallet },
  { href: "/analytics", label: "Analitik", icon: ChartPie },
];

const SECONDARY_NAV = [
  { href: "/scan", label: "Scan Nota", icon: ScanLine },
  { href: "/budgets", label: "Budget", icon: CreditCard },
  { href: "/goals", label: "Target", icon: Target },
  { href: "/bills", label: "Tagihan", icon: CalendarClock },
  { href: "/insight", label: "AI Insight", icon: Sparkles },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

const ALL_NAV = [
  ...PRIMARY_NAV,
  ...SECONDARY_NAV,
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/menu", label: "Menu", icon: LayoutGrid },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, profile, lock } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => {
    if (status === "signed-out") router.replace("/login");
  }, [status, router]);

  React.useEffect(() => {
    if (status !== "ready") return;
    void runBillReminderScan();
  }, [status]);

  const unread = useLiveQuery(
    async () => (status === "ready" ? db().notifications.filter((n) => !n.read && !n.deleted).count() : 0),
    [status],
    0,
  );

  if (status === "loading" || status === "signed-out") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-6 text-brand" />
      </div>
    );
  }

  if (status === "locked") return <LockScreen />;

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-sm font-semibold">TrackingDuit</p>
            <p className="text-[11px] text-muted">Catat duit, cepat</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
          ))}
          <p className="px-3 pt-4 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">
            Lainnya
          </p>
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
          ))}
        </nav>

        <Button className="mt-3 w-full" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> Catat Transaksi
        </Button>

        <button
          onClick={lock}
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <span
            className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: profile?.avatar_color ?? "#0f9d76" }}
          >
            {(profile?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="flex-1 truncate text-left">{profile?.name}</span>
          {profile?.pin_hash ? <LockKeyhole className="size-3.5" /> : null}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar unread={unread ?? 0} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-28 lg:px-8 lg:pb-10">
          {children}
        </main>
        <BottomNav pathname={pathname} onAdd={() => setAddOpen(true)} />
      </div>

      <TransactionSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function BrandMark() {
  return (
    <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-fg">
      <PiggyBank className="size-5" />
    </span>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-brand/10 font-medium text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function TopBar({ unread }: { unread: number }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const title = ALL_NAV.find((n) => pathname.startsWith(n.href))?.label ?? "TrackingDuit";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <BrandMark />
        </Link>
        <h1 className="flex-1 truncate text-base font-semibold lg:text-lg">{title}</h1>
        <button
          onClick={toggle}
          aria-label="Ganti tema"
          className="rounded-xl p-2 text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </button>
        <Link
          href="/notifications"
          aria-label="Notifikasi"
          className="relative rounded-xl p-2 text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <Bell className="size-4.5" />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-expense px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

function BottomNav({ pathname, onAdd }: { pathname: string; onAdd: () => void }) {
  const left = PRIMARY_NAV.slice(0, 2);
  const right = [PRIMARY_NAV[3], { href: "/menu", label: "Menu", icon: LayoutGrid }];

  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5 pb-1">
        {left.map((item) => (
          <TabItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
        <div className="flex justify-center">
          <button
            onClick={onAdd}
            aria-label="Catat transaksi"
            className="-mt-6 grid size-13 place-items-center rounded-2xl bg-brand text-brand-fg shadow-lg shadow-brand/25 transition active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </div>
        {right.map((item) => (
          <TabItem key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function TabItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition",
        active ? "text-brand" : "text-muted",
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}
