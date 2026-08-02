import { z } from "zod";

// Transaction validation schema
export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(500),
  tags: z.string().max(200).optional(),
  recurring_config: z.string().max(500).optional(),
  deleted: z.union([z.literal(0), z.literal(1)]),
  updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  user_id: z.string().uuid().optional(),
});

// Sheet row validation (for Google Sheets sync)
export const sheetRowSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.string(),
  amount: z.number().positive().finite(),
  wallet: z.string().max(100),
  to_wallet: z.string().max(100),
  category: z.string().max(100),
  merchant: z.string().max(200),
  note: z.string().max(500),
  source: z.string().max(50),
  updated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  deleted: z.number().int().min(0).max(1),
});

export const sheetSyncRequestSchema = z.object({
  rows: z.array(sheetRowSchema).max(10000), // Limit 10k rows per sync
});

// OCR request validation
export const ocrRequestSchema = z.object({
  image: z.string().max(10 * 1024 * 1024), // 10MB base64 limit
  useGoogleVision: z.boolean().optional(),
});

// Insight request validation
export const insightRequestSchema = z.object({
  payload: z.object({
    period: z.string(),
    totalIncome: z.number().nonnegative(),
    totalExpense: z.number().nonnegative(),
    balance: z.number(),
    topCategories: z.array(z.object({
      name: z.string(),
      amount: z.number().nonnegative(),
      count: z.number().int().nonnegative(),
    })).max(20),
    monthlyTrend: z.array(z.object({
      month: z.string(),
      income: z.number().nonnegative(),
      expense: z.number().nonnegative(),
    })).max(24),
  }),
});

// Analytics query validation
export const analyticsQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Generic error response
export function createErrorResponse(message: string, status: number = 400) {
  return {
    error: process.env.NODE_ENV === "production" 
      ? "An error occurred" 
      : message,
    ...(process.env.NODE_ENV !== "production" && { details: message }),
  };
}
