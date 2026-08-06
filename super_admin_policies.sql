
-- 1. Fonction pour vérifier si l'utilisateur est SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ajouter les accès complets (ALL) pour le SUPER_ADMIN sur chaque table

-- SCHOOLS
CREATE POLICY "Super admins can manage all schools" ON public.schools
    FOR ALL USING ( public.is_super_admin() );

-- PROFILES
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL USING ( public.is_super_admin() );

-- STUDENTS
CREATE POLICY "Super admins can manage all students" ON public.students
    FOR ALL USING ( public.is_super_admin() );

-- PAYMENTS
CREATE POLICY "Super admins can manage all payments" ON public.payments
    FOR ALL USING ( public.is_super_admin() );

-- INVITATIONS
CREATE POLICY "Super admins can manage all invitations" ON public.invitations
    FOR ALL USING ( public.is_super_admin() );

