-- 1. Correction de la politique SELECT sur les écoles (pour éviter l'erreur INSERT RLS)
DROP POLICY IF EXISTS "Admins can view their own school" ON public.schools;
DROP POLICY IF EXISTS "Users can view their school details" ON public.schools;
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;

CREATE POLICY "Anyone can view schools" ON public.schools
    FOR SELECT USING (true);

-- 2. Correction de la récursion infinie sur la table profiles
DROP POLICY IF EXISTS "School admins view all profiles in school" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_school_admin(check_school_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN' AND school_id = check_school_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "School admins view all profiles in school" ON public.profiles
    FOR SELECT USING ( public.is_school_admin(school_id) );

-- 3. S'assurer que les utilisateurs peuvent mettre à jour et insérer leurs propres données
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create schools" ON public.schools;
CREATE POLICY "Users can create schools" ON public.schools
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
