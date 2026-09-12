-- À exécuter dans Supabase (SQL Editor)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS next_payment_date DATE;
