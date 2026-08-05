DROP POLICY IF EXISTS "Admins can view their own school" ON public.schools;
DROP POLICY IF EXISTS "Users can view their school details" ON public.schools;

CREATE POLICY "Anyone can view schools" ON public.schools
    FOR SELECT USING (true);
