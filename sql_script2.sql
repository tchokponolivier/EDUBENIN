-- À exécuter dans Supabase (SQL Editor)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
