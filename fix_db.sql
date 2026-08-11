-- 1. Add missing columns to schools table
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS academic_year TEXT,
ADD COLUMN IF NOT EXISTS enrollment_contract_template TEXT,
ADD COLUMN IF NOT EXISTS director_name TEXT,
ADD COLUMN IF NOT EXISTS establishment_decision TEXT;

-- 2. Add missing columns to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS student_type TEXT,
ADD COLUMN IF NOT EXISTS previous_class TEXT,
ADD COLUMN IF NOT EXISTS previous_school TEXT,
ADD COLUMN IF NOT EXISTS last_year_attended TEXT,
ADD COLUMN IF NOT EXISTS educmaster_number TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS father_profession TEXT,
ADD COLUMN IF NOT EXISTS mother_profession TEXT,
ADD COLUMN IF NOT EXISTS father_contact TEXT,
ADD COLUMN IF NOT EXISTS mother_contact TEXT,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS guardian_contact TEXT,
ADD COLUMN IF NOT EXISTS canteen_options TEXT,
ADD COLUMN IF NOT EXISTS disciplinary_commitment BOOLEAN,
ADD COLUMN IF NOT EXISTS disciplinary_signature TEXT;

-- 3. Update RLS policies for students to allow Parents to insert and update their own children
DROP POLICY IF EXISTS "Parents can insert their own children" ON public.students;
CREATE POLICY "Parents can insert their own children" ON public.students
    FOR INSERT WITH CHECK (
        parent_id = auth.uid() OR parent_id IS NULL
    );

DROP POLICY IF EXISTS "Parents can update their own children" ON public.students;
CREATE POLICY "Parents can update their own children" ON public.students
    FOR UPDATE USING (
        parent_id = auth.uid()
    );

-- 4. Ensure schools are readable by everyone so the registration process works smoothly
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;
CREATE POLICY "Anyone can view schools" ON public.schools
    FOR SELECT USING (true);
