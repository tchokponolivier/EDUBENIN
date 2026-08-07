-- Drop everything safely and recreate with IF NOT EXISTS? No, just ensure we add IF NOT EXISTS to all tables that don't have it.
ALTER TABLE IF EXISTS public.schools RENAME TO schools_temp;
ALTER TABLE IF EXISTS public.schools_temp RENAME TO schools;
-- Actually, the user got ERROR 42P07: relation "schools" already exists because the schema runs `CREATE TABLE public.schools` without IF NOT EXISTS.
