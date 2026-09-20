-- À exécuter dans Supabase (SQL Editor) si vous souhaitez ajouter la colonne academic_year à la table payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS academic_year TEXT;
