-- À exécuter dans Supabase (SQL Editor)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS items JSONB;
