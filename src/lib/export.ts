import type { Category, Transaction, Wallet } from "./types";
import { parseAmount, toDateKey } from "./utils";

const HEADERS = [
  "id",
  "tanggal",
  "tipe",
  "nominal",
  "dompet",
  "dompet_tujuan",
  "kategori",
  "merchant",
  "catatan",
  "sumber",
  "updated_at",
] as const;

function escapeCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
): string {
  const walletName = (id?: string) => wallets.find((w) => w.id === id)?.name ?? "";
  const catName = (id?: string) => categories.find((c) => c.id === id)?.name ?? "";
  const rows = transactions.map((t) =>
    [
      t.id,
      t.date,
      t.type,
      t.amount,
      walletName(t.wallet_id),
      walletName(t.to_wallet_id),
      catName(t.category_id),
      t.merchant ?? "",
      t.note ?? "",
      t.source,
      t.updated_at,
    ]
      .map(escapeCell)
      .join(","),
  );
  return [HEADERS.join(","), ...rows].join("\n");
}

/** Row shape shared by the Google Sheet sync and CSV import. */
export interface SheetRow {
  id: string;
  date: string;
  type: string;
  amount: number;
  wallet: string;
  to_wallet: string;
  category: string;
  merchant: string;
  note: string;
  source: string;
  updated_at: string;
  deleted: number;
}

export const SHEET_HEADERS = [
  "id",
  "date",
  "type",
  "amount",
  "wallet",
  "to_wallet",
  "category",
  "merchant",
  "note",
  "source",
  "updated_at",
  "deleted",
] as const;

export function txToSheetRow(
  t: Transaction,
  walletName: (id?: string) => string,
  catName: (id?: string) => string,
): (string | number)[] {
  return [
    t.id,
    t.date,
    t.type,
    t.amount,
    walletName(t.wallet_id),
    walletName(t.to_wallet_id),
    catName(t.category_id),
    t.merchant ?? "",
    t.note ?? "",
    t.source,
    t.updated_at,
    t.deleted,
  ];
}

export function sheetRowToObject(row: (string | number)[]): SheetRow | null {
  if (!row?.length || !row[0]) return null;
  const [id, date, type, amount, wallet, to_wallet, category, merchant, note, source, updated_at, deleted] =
    row;
  return {
    id: String(id),
    date: String(date || toDateKey()),
    type: String(type || "expense"),
    amount: typeof amount === "number" ? amount : parseAmount(String(amount)),
    wallet: String(wallet ?? ""),
    to_wallet: String(to_wallet ?? ""),
    category: String(category ?? ""),
    merchant: String(merchant ?? ""),
    note: String(note ?? ""),
    source: String(source || "sheet"),
    updated_at: String(updated_at || new Date(0).toISOString()),
    deleted: Number(deleted) === 1 ? 1 : 0,
  };
}

/** Minimal CSV parser: handles quoted cells and embedded separators. */
export function parseCSV(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Guesses the delimiter used by an exported bank statement. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => ({ d, n: firstLine.split(d).length }));
  return counts.sort((a, b) => b.n - a.n)[0].d;
}
