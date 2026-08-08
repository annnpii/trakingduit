import type { ParsedReceipt } from "../types";
import { parseAmount, toDateKey } from "../utils";

/**
 * Single-item receipts (SPBU/BBM): force qty × price ≈ total so a misread
 * unit price (e.g. 10.002 read as 15.898) can't leak into the item total.
 * Only touches the 1-item case where the arithmetic is unambiguous.
 */
export function reconcileItemTotal(p: ParsedReceipt): ParsedReceipt {
  if (!p.total || p.items.length !== 1) return p;
  const it = p.items[0];
  if (!it.qty || it.qty <= 0) return p;
  const lineTotal = it.qty * it.price;
  if (Math.abs(lineTotal - p.total) / p.total < 0.02) return p;
  return { ...p, items: [{ ...it, price: Math.round(p.total / it.qty) }] };
}

const TOTAL_KEYS = [
  "grand total",
  "total bayar",
  "total belanja",
  "total tagihan",
  "total akhir",
  "total harga",
  "jumlah bayar",
  "total",
  "jumlah",
  "amount due",
  "net sales",
];

const IGNORE_TOTAL_KEYS = ["subtotal", "sub total", "total item", "total qty", "kembali", "kembalian"];
const CASH_KEYS = ["tunai", "cash", "bayar", "debit", "kredit", "qris", "gopay", "ovo", "dana"];
const TAX_KEYS = ["ppn", "pb1", "pajak", "tax", "service charge", "biaya layanan"];
const SUBTOTAL_KEYS = ["subtotal", "sub total", "sub-total"];

const NOISE_PREFIX =
  /^(npwp|no\.?\s?telp|telp|phone|jl\.?|jalan|kasir|cashier|struk|receipt|no\.?\s?trans|invoice|nota|terima kasih|thank you|selamat|www\.|http)/i;

/** Numbers with 1.000 / 1,000 / 1000,00 shapes. */
const MONEY_RE = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/gi;

const DATE_PATTERNS: { re: RegExp; build: (m: RegExpMatchArray) => string | undefined }[] = [
  {
    // 2024-05-13
    re: /(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/,
    build: (m) => iso(Number(m[1]), Number(m[2]), Number(m[3])),
  },
  {
    // 13/05/2024 or 13-05-24
    re: /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/,
    build: (m) => {
      const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      return iso(year, Number(m[2]), Number(m[1]));
    },
  },
  {
    // 13 Mei 2024
    re: /(\d{1,2})\s+(jan|feb|mar|apr|mei|may|jun|jul|agu|aug|sep|okt|oct|nov|des|dec)[a-z]*\s+(20\d{2})/i,
    build: (m) => {
      const months: Record<string, number> = {
        jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7,
        agu: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12,
      };
      return iso(Number(m[3]), months[m[2].toLowerCase().slice(0, 3)], Number(m[1]));
    },
  },
];

function iso(y: number, m: number, d: number): string | undefined {
  if (!y || !m || !d || m > 12 || d > 31) return undefined;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function moneyOnLine(line: string): number[] {
  const found = line.match(MONEY_RE);
  if (!found) return [];
  return found
    .map((raw) => parseAmount(raw))
    .filter((n) => n > 0 && n < 1_000_000_000);
}

function cleanMerchant(line: string): string {
  return line
    .replace(/[^A-Za-z0-9&.'\-\s]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Turns raw OCR text of an Indonesian receipt into structured fields.
 * Everything is best-effort — `confidence` tells the UI how hard to push
 * the user to double-check before saving.
 */
export function parseReceipt(rawText: string): ParsedReceipt {
  const lines = rawText
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const lower = lines.map((l) => l.toLowerCase());

  /* merchant: first meaningful line near the top */
  let merchant: string | undefined;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const candidate = cleanMerchant(lines[i]);
    if (candidate.length < 3) continue;
    if (NOISE_PREFIX.test(candidate)) continue;
    if (/^\d+$/.test(candidate.replace(/\s/g, ""))) continue;
    merchant = candidate.slice(0, 40);
    break;
  }

  /* date */
  let date: string | undefined;
  for (const line of lines) {
    for (const { re, build } of DATE_PATTERNS) {
      const m = line.match(re);
      if (m) {
        const value = build(m);
        if (value && value <= toDateKey()) {
          date = value;
          break;
        }
      }
    }
    if (date) break;
  }

  /* totals */
  let total: number | undefined;
  let subtotal: number | undefined;
  let tax: number | undefined;
  let cashPaid: number | undefined;

  for (let i = 0; i < lines.length; i++) {
    const l = lower[i];
    const amounts = moneyOnLine(lines[i]);
    const nextAmounts = i + 1 < lines.length ? moneyOnLine(lines[i + 1]) : [];
    const pick = amounts.length ? amounts[amounts.length - 1] : nextAmounts[0];
    if (!pick) continue;

    if (SUBTOTAL_KEYS.some((k) => l.includes(k))) {
      subtotal ??= pick;
      continue;
    }
    if (TAX_KEYS.some((k) => l.includes(k))) {
      tax ??= pick;
      continue;
    }
    if (IGNORE_TOTAL_KEYS.some((k) => l.includes(k))) continue;
    if (TOTAL_KEYS.some((k) => l.includes(k))) {
      // later "total" lines usually win (grand total sits below subtotal)
      total = pick;
      continue;
    }
    if (CASH_KEYS.some((k) => l.includes(k))) cashPaid ??= pick;
  }

  if (!total) total = cashPaid;
  if (!total) {
    // last resort: largest number that is not an obvious phone/date/NPWP
    const all = lines.flatMap(moneyOnLine).filter((n) => n >= 100);
    if (all.length) total = Math.max(...all);
  }

  /* line items: "2 x 15.000" / "Nasi Goreng 25.000" */
  const items: ParsedReceipt["items"] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lower[i];
    if (
      TOTAL_KEYS.some((k) => l.includes(k)) ||
      TAX_KEYS.some((k) => l.includes(k)) ||
      CASH_KEYS.some((k) => l.includes(k)) ||
      SUBTOTAL_KEYS.some((k) => l.includes(k))
    )
      continue;
    const amounts = moneyOnLine(lines[i]);
    if (!amounts.length) continue;
    const price = amounts[amounts.length - 1];
    if (price < 100) continue;
    const qtyMatch = lines[i].match(/(\d{1,3})\s*(?:x|X|pcs|pc)\s*/);
    const name = cleanMerchant(lines[i].replace(MONEY_RE, "")).replace(/\b\d+\s*x\b/i, "").trim();
    if (name.length < 2) continue;
    items.push({ name: name.slice(0, 40), qty: qtyMatch ? Number(qtyMatch[1]) : undefined, price });
    if (items.length >= 30) break;
  }

  /* confidence */
  let confidence = 0.2;
  if (total) confidence += 0.35;
  if (merchant) confidence += 0.2;
  if (date) confidence += 0.15;
  if (items.length) confidence += 0.1;
  if (subtotal && total && total >= subtotal) confidence += 0.05;
  if (total && items.length) {
    const itemsSum = items.reduce((a, b) => a + b.price, 0);
    if (Math.abs(itemsSum - total) / total < 0.25) confidence += 0.05;
  }

  return reconcileItemTotal({
    merchant,
    date,
    total,
    subtotal,
    tax,
    items,
    category_hint: merchant?.toLowerCase(),
    confidence: Math.min(1, Number(confidence.toFixed(2))),
  });
}
