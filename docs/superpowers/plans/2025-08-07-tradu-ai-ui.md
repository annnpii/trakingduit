# Tradu AI Chat UI & Dashboard Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Chat with Tradu" AI bottom-sheet to Dashboard + fix UI feedback (bill payment status, balance label, icons).

**Architecture:** New `TraduChat` component (bottom-sheet chat UI) triggered from Dashboard entry point. Reuses existing `<Sheet>` from `@/components/ui`. AI endpoint connection is **deferred** — UI only for now with mock responses.

**Tech Stack:** Next.js 16 · React 19 · Tailwind v4 · Framer Motion · Dexie (local-first) · Lucide React (keep, not switching — already consistent across app)

## Global Constraints

- Mobile-first target: 375×667 (Mobile M)
- All animations respect `prefers-reduced-motion`
- No new npm dependencies — reuse existing UI primitives
- Lucide React stays (already used in 18+ files, switching to feather/better-icons = massive churn for zero user value)
- AI endpoint integration deferred to next sprint

---

### Task 1: Fix Dashboard "Total saldo lo" → "Total saldo"

**Files:**
- Modify: `src/components/ui/index.tsx` (BalanceCard component, ~line 470)

**Interfaces:**
- Consumes: `BalanceCard` prop `label: string` passed from dashboard
- Produces: No interface change

- [ ] **Step 1: Find and fix the label**

Check if `label` is hardcoded in BalanceCard or passed as prop from dashboard.

In `src/app/(app)/dashboard/page.tsx`, find the BalanceCard usage and change the label prop:

```tsx
// Before
<BalanceCard label="Total saldo lo" ... />

// After
<BalanceCard label="Total saldo" ... />
```

If the label is hardcoded inside BalanceCard itself (`src/components/ui/index.tsx`), change it there.

- [ ] **Step 2: Verify visually**

Run: `pnpm dev`
Open: `http://localhost:3000/dashboard`
Verify: Card now says "Total saldo" (no "lo").

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "fix(dashboard): change 'Total saldo lo' to 'Total saldo'"
```

---

### Task 2: Fix Bill Payment Status in Dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx` — `BillItem` component (~line 240-279)

**Interfaces:**
- Consumes: `Bill` type from `@/lib/types` (has `last_paid_at`, `due_date`, `recurrence` fields)
- Produces: Correct paid/unpaid UI for dashboard bill items

The `BillItem` already has `isPaid` logic: `isPaid = bill.last_paid_at >= bill.due_date`. The issue is that for recurring monthly bills due on Sep 1, user already paid in August but the UI shows "Belum dibayar" because `last_paid_at` comparison may not account for the current billing cycle correctly.

- [ ] **Step 1: Read the Bill type and understand fields**

Read `src/lib/types.ts` to check exact `Bill` type shape. Read current `BillItem` logic.

- [ ] **Step 2: Fix isPaid logic for current billing cycle**

The fix: a bill is "paid for this cycle" if `last_paid_at` exists AND is within the current billing period (i.e., after the previous due date or after the start of the current month).

```tsx
// In BillItem component, replace isPaid logic:
const isPaid = (() => {
  if (!bill.last_paid_at) return false;
  const paid = new Date(bill.last_paid_at);
  const due = new Date(bill.due_date);
  // Paid anytime in the same month as due_date or later
  // OR paid after the previous cycle's due_date
  if (bill.recurrence === "monthly") {
    // For monthly: paid is valid if it's within 30 days before due_date
    const cycleStart = new Date(due);
    cycleStart.setDate(cycleStart.getDate() - 30);
    return paid >= cycleStart;
  }
  return paid >= due;
})();
```

- [ ] **Step 3: Update status UI for paid bills**

Ensure the paid state renders with a green check vibe:

```tsx
// Already exists in BillItem but verify:
if (isPaid) → green bg, "Lunas" badge, strikethrough or muted amount
```

- [ ] **Step 4: Verify visually**

Open dashboard, check bills that have been paid show "Lunas" with green styling.

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "fix(dashboard): correct bill payment status detection for current billing cycle"
```

---

### Task 3: Create Tradu Chat Component (UI Only)

**Files:**
- Create: `src/components/tradu/tradu-chat.tsx`

**Interfaces:**
- Consumes: `Sheet` from `@/components/ui`, `useSession` from `@/lib/session`
- Produces: `<TraduChat open={boolean} onClose={() => void} />`

- [ ] **Step 1: Create the chat component file**

```tsx
// src/components/tradu/tradu-chat.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import { Sheet, Button } from "@/components/ui";
import { getAnimation } from "@/lib/animations";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Roast pengeluaran gw bulan ini",
  "Boros di mana aja gw?",
  "Sisa duit segini cukup foya-foya gak?",
  "Kasih tips nabung dong",
];

// Mock response for UI dev — will be replaced by real AI endpoint later
function mockTraduResponse(userMsg: string): string {
  const responses = [
    "Anjir, gw liat pengeluaran lo bulan ini... lo yakin lo bukan ATM berjalan? 💸 Coba rem dikit lah, sisain buat tabungan minimal 20% dari gaji.",
    "Boros? Lo nanya boros? Cek sendiri deh, nongkrong lo udah kayak biaya hidup orang satu RT. Saran gw: masak sendiri seminggu aja, lo bisa hemat 500rb lebih.",
    "Duit segini mah cukup buat foya-foya... kalo foya-foyanya beli es teh sama gorengan doang. Realistis ya bro 😂",
    "Tips nabung dari Tradu: tiap gajian, langsung sisihkan 20% sebelum lo sempet buka Shopee. Auto-transfer ke rekening yg lo males buka.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function TraduChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Welcome message on first open
  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Yo! Gw Tradu, temen lo yg ngerti soal duit. Mau nanya apa? Roast pengeluaran, tips nabung, atau mau curhat soal dompet tipis? 😎",
          timestamp: new Date(),
        },
      ]);
    }
  }, [open]);

  const sendMessage = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setTyping(true);

      // Simulate AI response delay (mock — replaced by real API later)
      setTimeout(() => {
        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: mockTraduResponse(trimmed),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setTyping(false);
      }, 800 + Math.random() * 1200);
    },
    [typing],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Chat with Tradu" size="lg">
      <div className="flex h-[65dvh] flex-col sm:h-[500px]">
        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-surface-2 text-fg"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-brand">
                      <Sparkles className="size-3" />
                      Tradu
                    </div>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
                <div className="flex gap-1">
                  <span className="size-2 animate-bounce rounded-full bg-muted/60 [animation-delay:0ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted/60 [animation-delay:150ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted/60 [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-brand"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border px-4 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya Tradu..."
            className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            disabled={typing}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || typing}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `pnpm build 2>&1 | tail -5`
Expected: No errors referencing `tradu-chat.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/tradu/tradu-chat.tsx
git commit -m "feat(tradu): add chat UI component with mock responses"
```

---

### Task 4: Add Tradu Entry Point to Dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `TraduChat` from `@/components/tradu/tradu-chat`
- Produces: Interactive "Tanya Tradu" pill on dashboard that opens chat sheet

- [ ] **Step 1: Add import and state**

At top of `dashboard/page.tsx`, add:

```tsx
import { TraduChat } from "@/components/tradu/tradu-chat";
```

Inside `DashboardPage` component, add state:

```tsx
const [traduOpen, setTraduOpen] = React.useState(false);
```

- [ ] **Step 2: Add Tradu entry point UI below BalanceCard**

After the `BalanceCard` section and before the Quick Menu grid, insert:

```tsx
{/* Tradu AI Chat Entry */}
<button
  onClick={() => setTraduOpen(true)}
  className="group flex w-full items-center gap-3 rounded-2xl bg-surface p-4 shadow-(--shadow-card) transition hover:bg-surface-2"
>
  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
    <Sparkles className="size-5" />
  </span>
  <span className="flex-1 text-left">
    <span className="block text-sm font-semibold">Chat with Tradu</span>
    <span className="block text-xs text-muted">
      Tanya soal duit lo, roast pengeluaran, tips nabung...
    </span>
  </span>
  <span className="text-xs text-muted transition group-hover:text-brand">→</span>
</button>
```

Add `Sparkles` to the lucide-react imports at the top of the file.

- [ ] **Step 3: Add TraduChat component at bottom of render**

Next to the existing `<TransactionSheet>`, add:

```tsx
<TraduChat open={traduOpen} onClose={() => setTraduOpen(false)} />
```

- [ ] **Step 4: Verify visually**

Open: `http://localhost:3000/dashboard` (Mobile M 375×667)
Verify:
- "Chat with Tradu" card visible below balance card
- Clicking opens bottom sheet with chat UI
- Quick prompts visible on first open
- Typing a message shows mock AI response
- Sheet closes properly with X or overlay click

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat(dashboard): add Tradu AI chat entry point"
```

---

### Task 5: Add Tradu Shortcut to Dashboard Quick Menu

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `QUICK` array config, `MenuTile` component
- Produces: "Tradu" tile in quick menu grid that opens chat sheet

- [ ] **Step 1: Replace AI Insight menu tile with Tradu**

In the `QUICK` array, check if there's any AI-related tile. If not, add Tradu as new tile. Instead of `<Link>` wrapper (since Tradu opens a sheet, not navigates), convert the Tradu tile to a button:

Add `MessageCircle` to lucide imports:

```tsx
import { ..., MessageCircle, Sparkles } from "lucide-react";
```

In the Quick Menu grid render section, add a Tradu tile that calls `setTraduOpen(true)` instead of linking to a route:

```tsx
{/* After the grid of Link tiles, or replace one of the existing ones */}
<button onClick={() => setTraduOpen(true)} className="block">
  <MenuTile icon={MessageCircle} label="Tradu AI" tone="brand" />
</button>
```

- [ ] **Step 2: Verify visually**

Check the quick menu grid shows "Tradu AI" tile. Tap opens the chat sheet.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "feat(dashboard): add Tradu AI shortcut to quick menu grid"
```

---

### Task 6: Final Build & Deploy

**Files:**
- Modify: `package.json` — bump version
- Modify: `src/app/(app)/menu/page.tsx` — bump version string

- [ ] **Step 1: Bump version to v1.9.2**

```bash
cd /home/annnpii/orca/trakingduit
sed -i 's/"version": "1.9.1"/"version": "1.9.2"/' package.json
```

In `src/app/(app)/menu/page.tsx`, change version string:
```
TrackingDuit v1.9.1 → TrackingDuit v1.9.2
```

- [ ] **Step 2: Full build check**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit & push**

```bash
git add -A
git commit -m "feat: v1.9.2 — Tradu AI chat UI, fix bill status, dashboard polish"
git push origin main
```

- [ ] **Step 4: Deploy to Vercel**

```bash
vercel --prod --yes
```

- [ ] **Step 5: Verify live**

Check `https://trakingduit.vercel.app/dashboard` serves new version with Tradu chat entry.
