-- À exécuter dans Supabase (SQL Editor)
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS photo TEXT;

ALTER TABLE public.timetables
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id);
