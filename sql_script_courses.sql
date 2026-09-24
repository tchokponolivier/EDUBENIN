-- Script optionnel à exécuter dans Supabase (SQL Editor) pour ajouter les colonnes officielles à la table courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS coefficient INTEGER DEFAULT 1;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS academic_year TEXT;
