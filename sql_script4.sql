-- À exécuter dans Supabase (SQL Editor)
-- 1. Ensure DELETED exists if role is an enum (ignore error if it's a TEXT column)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DELETED';

-- 2. Allow School Admins to update profiles of their own school
CREATE POLICY "School Admins can update profiles in their school" 
ON public.profiles 
FOR UPDATE 
USING (
  school_id IN (
    SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'
  )
);
