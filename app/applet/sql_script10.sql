-- À exécuter dans Supabase (SQL Editor)
-- Ajout de la colonne tranches dans fee_config pour la gestion des échéances de scolarité
ALTER TABLE public.fee_config ADD COLUMN IF NOT EXISTS tranches JSONB;
