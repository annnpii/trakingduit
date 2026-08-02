-- Tambahkan kolom cicilan ke tabel bills jika belum ada
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS is_installment smallint DEFAULT 0 NOT NULL;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS installment_total integer;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS installment_paid integer;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS installment_amount_per_period numeric(16, 2);
