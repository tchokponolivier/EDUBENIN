-- À exécuter dans Supabase (SQL Editor)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
