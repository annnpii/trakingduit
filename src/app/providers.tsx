"use client";

import * as React from "react";
import { ThemeProvider } from "@/lib/theme";
import { SessionProvider } from "@/lib/session";
import { AutoSyncProvider } from "@/lib/sync/auto-sync";
import { ToastProvider } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <AutoSyncProvider>{children}</AutoSyncProvider>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
