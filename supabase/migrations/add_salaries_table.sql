-- Create salaries table if not exists
CREATE TABLE IF NOT EXISTS "public"."salaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "month" "text" NOT NULL,
    "amount" numeric(16,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted" smallint DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."salaries" ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "own rows" ON "public"."salaries";

-- Create policy
CREATE POLICY "own rows" ON "public"."salaries" FOR ALL
  USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));

-- Trigger for set_updated_at
DROP TRIGGER IF EXISTS "salaries_set_updated_at" ON "public"."salaries";
CREATE TRIGGER "salaries_set_updated_at" BEFORE UPDATE ON "public"."salaries"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
