-- Idempotent schema fix untuk TrackingDuit
-- Aman dijalankan berulang, skip yang sudah ada

-- Create types only if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cat_type') THEN
        CREATE TYPE "public"."cat_type" AS ENUM ('income', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_source') THEN
        CREATE TYPE "public"."tx_source" AS ENUM ('manual', 'ocr', 'import', 'sheet');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tx_type') THEN
        CREATE TYPE "public"."tx_type" AS ENUM ('income', 'expense', 'transfer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wallet_type') THEN
        CREATE TYPE "public"."wallet_type" AS ENUM ('cash', 'bank', 'ewallet', 'credit', 'investment');
    END IF;
END $$;

-- Create functions
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'Pengguna'), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL PRIMARY KEY,
    "name" "text" DEFAULT 'Pengguna'::"text" NOT NULL,
    "email" "text",
    "avatar_color" "text" DEFAULT '#0f9d76'::"text" NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."wallet_type" DEFAULT 'cash'::"public"."wallet_type" NOT NULL,
    "initial_balance" numeric(16,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "color" "text" DEFAULT '#0f9d76'::"text" NOT NULL,
    "icon" "text" DEFAULT 'wallet'::"text" NOT NULL,
    "note" "text",
    "archived" smallint DEFAULT 0 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."cat_type" DEFAULT 'expense'::"public"."cat_type" NOT NULL,
    "icon" "text" DEFAULT 'ellipsis'::"text" NOT NULL,
    "color" "text" DEFAULT '#94a3b8'::"text" NOT NULL,
    "is_default" smallint DEFAULT 0 NOT NULL,
    "keywords" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "type" "public"."tx_type" NOT NULL,
    "amount" numeric(16,2) NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "to_wallet_id" "uuid",
    "category_id" "uuid",
    "date" "date" NOT NULL,
    "note" "text",
    "merchant" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "receipt_id" "uuid",
    "source" "public"."tx_source" DEFAULT 'manual'::"public"."tx_source" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "amount" numeric(16,2) NOT NULL,
    "period" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "start_date" "date" NOT NULL,
    "rollover" smallint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."saving_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "target_amount" numeric(16,2) NOT NULL,
    "saved_amount" numeric(16,2) DEFAULT 0 NOT NULL,
    "deadline" "date",
    "wallet_id" "uuid",
    "color" "text" DEFAULT '#0f9d76'::"text" NOT NULL,
    "icon" "text" DEFAULT 'target'::"text" NOT NULL,
    "archived" smallint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."bills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "amount" numeric(16,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "repeat" "text" DEFAULT 'monthly'::"text" NOT NULL,
    "category_id" "uuid",
    "wallet_id" "uuid",
    "reminder_days" integer DEFAULT 3 NOT NULL,
    "last_paid_at" timestamp with time zone,
    "auto_create_tx" smallint DEFAULT 1 NOT NULL,
    "archived" smallint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "kind" "text" DEFAULT 'info'::"text" NOT NULL,
    "read" smallint DEFAULT 0 NOT NULL,
    "ref_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."ocr_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "image_path" "text",
    "raw_text" "text" DEFAULT ''::"text" NOT NULL,
    "parsed" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "engine" "text" DEFAULT 'tesseract'::"text" NOT NULL,
    "transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "table_name" "text" NOT NULL,
    "row_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."sync_logs" (
    "id" bigint NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "target" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "status" "text" NOT NULL,
    "pushed" integer DEFAULT 0 NOT NULL,
    "pulled" integer DEFAULT 0 NOT NULL,
    "message" "text" DEFAULT ''::"text" NOT NULL,
    "at" timestamp with time zone DEFAULT "now"() NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."saving_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ocr_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sync_logs" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempoten)
DROP POLICY IF EXISTS "own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "own rows" ON "public"."wallets";
DROP POLICY IF EXISTS "own rows" ON "public"."categories";
DROP POLICY IF EXISTS "own rows" ON "public"."transactions";
DROP POLICY IF EXISTS "own rows" ON "public"."budgets";
DROP POLICY IF EXISTS "own rows" ON "public"."saving_goals";
DROP POLICY IF EXISTS "own rows" ON "public"."bills";
DROP POLICY IF EXISTS "own rows" ON "public"."notifications";
DROP POLICY IF EXISTS "own rows" ON "public"."ocr_receipts";
DROP POLICY IF EXISTS "own rows" ON "public"."audit_logs";
DROP POLICY IF EXISTS "own rows" ON "public"."sync_logs";

-- Create policies
CREATE POLICY "own profile" ON "public"."profiles" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."wallets" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."categories" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."transactions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."budgets" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."saving_goals" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."bills" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."notifications" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."ocr_receipts" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."audit_logs" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
CREATE POLICY "own rows" ON "public"."sync_logs" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

-- Create triggers
DROP TRIGGER IF EXISTS "profiles_set_updated_at" ON "public"."profiles";
DROP TRIGGER IF EXISTS "wallets_set_updated_at" ON "public"."wallets";
DROP TRIGGER IF EXISTS "categories_set_updated_at" ON "public"."categories";
DROP TRIGGER IF EXISTS "transactions_set_updated_at" ON "public"."transactions";
DROP TRIGGER IF EXISTS "budgets_set_updated_at" ON "public"."budgets";
DROP TRIGGER IF EXISTS "saving_goals_set_updated_at" ON "public"."saving_goals";
DROP TRIGGER IF EXISTS "bills_set_updated_at" ON "public"."bills";
DROP TRIGGER IF EXISTS "notifications_set_updated_at" ON "public"."notifications";
DROP TRIGGER IF EXISTS "ocr_receipts_set_updated_at" ON "public"."ocr_receipts";

CREATE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "wallets_set_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "categories_set_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "transactions_set_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "budgets_set_updated_at" BEFORE UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "saving_goals_set_updated_at" BEFORE UPDATE ON "public"."saving_goals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "bills_set_updated_at" BEFORE UPDATE ON "public"."bills" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "notifications_set_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "ocr_receipts_set_updated_at" BEFORE UPDATE ON "public"."ocr_receipts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Add foreign keys (only if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey') THEN
        ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_fkey') THEN
        ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_user_id_fkey') THEN
        ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey') THEN
        ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_wallet_id_fkey') THEN
        ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_category_id_fkey') THEN
        ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_user_id_fkey') THEN
        ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'budgets_category_id_fkey') THEN
        ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;
    END IF;
END $$;
