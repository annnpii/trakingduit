"use client";

import * as React from "react";
import { Delete, LockKeyhole } from "lucide-react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function LockScreen() {
  const { unlock, profile, signOut } = useSession();
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);

  const submit = React.useCallback(
    async (value: string) => {
      const ok = await unlock(value);
      if (!ok) {
        setError(true);
        setPin("");
        setTimeout(() => setError(false), 600);
      }
    },
    [unlock],
  );

  const press = (digit: string) => {
    setPin((prev) => {
      const next = (prev + digit).slice(0, 6);
      if (next.length === 6) void submit(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
          <LockKeyhole className="size-6" />
        </span>
        <div>
          <p className="text-lg font-semibold">Halo, {profile?.name}</p>
          <p className="text-xs text-muted">Masukkan PIN untuk membuka</p>
        </div>
      </div>

      <div className={cn("flex gap-3", error && "animate-pulse")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3 rounded-full border transition",
              error
                ? "border-expense bg-expense"
                : i < pin.length
                  ? "border-brand bg-brand"
                  : "border-border bg-surface-2",
            )}
          />
        ))}
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Key key={d} onClick={() => press(d)}>
            {d}
          </Key>
        ))}
        <button
          onClick={() => void signOut()}
          className="rounded-2xl py-4 text-xs text-muted transition hover:text-expense"
        >
          Keluar
        </button>
        <Key onClick={() => press("0")}>0</Key>
        <Key onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Hapus">
          <Delete className="mx-auto size-5" />
        </Key>
      </div>
    </div>
  );
}

function Key({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className="rounded-2xl border border-border bg-surface py-4 text-lg font-medium transition active:scale-95 active:bg-surface-2"
      {...props}
    >
      {children}
    </button>
  );
}
