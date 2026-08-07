"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Sheet, Button } from "@/components/ui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Roast pengeluaran gw",
  "Boros di mana aja?",
  "Cukup buat foya-foya gak?",
  "Tips nabung dong",
];

function mockTraduResponse(): string {
  const r = [
    "Anjir, gw liat pengeluaran lo bulan ini... lo yakin lo bukan ATM berjalan? 💸 Coba rem dikit, sisain buat tabungan minimal 20% dari gaji.",
    "Boros? Lo nanya boros? Cek sendiri deh, nongkrong lo udah kayak biaya hidup orang satu RT. Saran gw: masak sendiri seminggu aja, hemat 500rb lebih.",
    "Duit segini mah cukup buat foya-foya... kalo foya-foyanya beli es teh sama gorengan doang. Realistis ya bro 😂",
    "Tips nabung dari Tradu: tiap gajian, langsung sisihkan 20% sebelum lo sempet buka Shopee. Auto-transfer ke rekening yg lo males buka. Dijamin works.",
    "Gw liat saldo lo... yakin mau keluar rumah? 😬 Mending masak indomie dulu, nabung seminggu, baru boleh nongkrong.",
  ];
  return r[Math.floor(Math.random() * r.length)];
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

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Welcome on first open
  React.useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Yo! Gw Tradu, temen lo yg ngerti soal duit. Mau nanya apa? Roast pengeluaran, tips nabung, atau curhat soal dompet tipis? 😎",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sendMessage = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content: trimmed },
      ]);
      setInput("");
      setTyping(true);

      // Mock response — will be replaced by real AI later
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: mockTraduResponse() },
        ]);
        setTyping(false);
      }, 600 + Math.random() * 1000);
    },
    [typing],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Chat with Tradu ✨" size="lg">
      <div className="-mx-5 -mt-4 flex h-[60dvh] flex-col sm:h-[450px]">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-surface-2 text-fg"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-brand">
                      <Sparkles className="size-3" />
                      Tradu
                    </div>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
                <div className="flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted/60 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted/60 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted/60 [animation-delay:300ms]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick prompts — only before user sends first message */}
        {messages.length <= 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-muted transition hover:border-brand hover:text-brand active:scale-95"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-border px-4 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya Tradu..."
            className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition placeholder:text-xs placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            disabled={typing}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || typing} className="shrink-0">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </Sheet>
  );
}
