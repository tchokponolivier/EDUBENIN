ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE public.fee_config ADD COLUMN IF NOT EXISTS academic_year TEXT;
DROP POLICY IF EXISTS "School Admins can update profiles in their school" ON public.profiles;
CREATE POLICY "School Admins can update profiles in their school" 
ON public.profiles FOR UPDATE 
USING ( school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN') );
