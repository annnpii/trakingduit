"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CloudOff, PiggyBank, ScanLine, Sparkles, Wallet } from "lucide-react";
import { useSession } from "@/lib/session";
import { Button, Field, Input, SegmentedControl, Spinner } from "@/components/ui";

export default function LoginPage() {
  const { status, supabaseEnabled, signInLocal, signInSupabase } = useSession();
  const router = useRouter();
  const [mode, setMode] = React.useState<"local" | "cloud">("local");
  const [name, setName] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [cloudMode, setCloudMode] = React.useState<"login" | "register">("login");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (status === "ready" || status === "locked") router.replace("/dashboard");
  }, [status, router]);

  React.useEffect(() => {
    if (supabaseEnabled) setMode("cloud");
  }, [supabaseEnabled]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-6 text-brand" />
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "cloud") {
        await signInSupabase(email.trim(), password, cloudMode);
      } else {
        if (pin && !/^\d{6}$/.test(pin)) throw new Error("Eh, PIN-nya harus 6 digit angka ya");
        await signInLocal(name, pin || undefined);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk nih, coba lagi ya");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-surface p-10 lg:flex">
        <div
          className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--brand)" }}
        />
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-brand text-brand-fg">
            <PiggyBank className="size-5" />
          </span>
          <span className="text-lg font-semibold">TrackingDuit</span>
        </div>
        <div className="relative space-y-6">
          <h1 className="max-w-sm text-3xl leading-tight font-semibold">
            Cuan dicatat, dompet ke-track.
          </h1>
          <ul className="space-y-3 text-sm text-muted">
            <Feature icon={Wallet} text="Multi-wallet: tunai, bank, e-wallet, kartu kredit" />
            <Feature icon={ScanLine} text="Scan nota, nominal & merchant auto-keisi" />
            <Feature icon={Sparkles} text="Analitik seru + insight pengeluaran bulanan" />
            <Feature icon={CloudOff} text="Offline-first, sinkron ke Google Sheet & Supabase" />
          </ul>
        </div>
        <p className="text-xs text-muted">Data aman tersimpan di perangkat kamu.</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand text-brand-fg">
              <PiggyBank className="size-6" />
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Gaskeun ke TrackingDuit</h2>
            <p className="mt-1 text-sm text-muted">
              {supabaseEnabled
                ? "Mau datamu nyambung di semua HP? Pake akun cloud. Kalau simpel-simpelan aja, mode lokal juga oke kok."
                : "Lagi mode lokal nih — data kamu aman tersimpan di browser ini aja."}
            </p>
          </div>

          {supabaseEnabled ? (
            <SegmentedControl
              className="w-full"
              value={mode}
              onChange={setMode}
              options={[
                { value: "cloud", label: "Akun Cloud" },
                { value: "local", label: "Mode Lokal" },
              ]}
            />
          ) : null}

          {mode === "cloud" ? (
            <>
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={cloudMode === "login" ? "current-password" : "new-password"}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Nama Panggilan">
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu siapa?"
                  autoComplete="nickname"
                />
              </Field>
              <Field label="PIN 6 Digit" hint="Opsional — biar aman banget.">
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="······"
                />
              </Field>
            </>
          )}

          {error ? (
            <p className="rounded-xl border border-expense/30 bg-expense/10 px-3 py-2 text-xs text-expense">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={busy}>
            {mode === "cloud" && cloudMode === "register" ? "Yuk, Daftar!" : "Gas, Mulai!"}
          </Button>

          {mode === "cloud" ? (
            <button
              type="button"
              onClick={() => setCloudMode((m) => (m === "login" ? "register" : "login"))}
              className="w-full text-center text-xs text-muted transition hover:text-fg"
            >
              {cloudMode === "login" ? "Belum punya akun? Daftar di sini" : "Udah punya akun? Masuk aja"}
            </button>
          ) : null}
        </form>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      {text}
    </li>
  );
}
