ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS academic_year TEXT,
ADD COLUMN IF NOT EXISTS matricule TEXT;

ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS director_signature TEXT;
