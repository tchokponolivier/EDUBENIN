-- À exécuter dans Supabase (SQL Editor)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE public.school_fees ADD COLUMN IF NOT EXISTS academic_year TEXT;
