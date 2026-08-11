ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS father_address TEXT,
ADD COLUMN IF NOT EXISTS mother_address TEXT,
ADD COLUMN IF NOT EXISTS guardian_address TEXT;
