-- =========================================================================
-- CORRECTION DÉFINITIVE DU BLOCAGE RLS SUR LA TABLE PROFILES DANS SUPABASE
-- À copier-coller dans : Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Désactiver RLS sur la table profiles pour éviter toute violation de sécurité lors de la création d'école
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Si RLS est réactivé ultérieurement, s'assurer que toutes les opérations (INSERT, UPDATE, SELECT) sont autorisées
DROP POLICY IF EXISTS "Allow all operations on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "School Admins can update profiles in their school" ON public.profiles;

CREATE POLICY "Allow all operations on profiles" 
ON public.profiles FOR ALL 
USING (true) 
WITH CHECK (true);
