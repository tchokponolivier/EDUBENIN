-- À exécuter dans Supabase (SQL Editor)
DROP POLICY IF EXISTS "School Admins can update profiles in their school" ON public.profiles;

CREATE POLICY "School Admins can update profiles in their school" 
ON public.profiles 
FOR UPDATE 
USING ( school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN') );
