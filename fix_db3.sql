-- Relaxing Row Level Security (RLS) for the Preview Environment
-- Since the preview environment uses mock users (not fully registered in Supabase Auth),
-- we need to allow anonymous inserts/updates so the UI works correctly during testing.

-- 1. Profiles (Allows adding Teachers and updating roles)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (true);

-- 2. Students (Allows Parents to register their children)
DROP POLICY IF EXISTS "Parents can insert their own children" ON public.students;
CREATE POLICY "Parents can insert their own children" ON public.students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Parents can update their own children" ON public.students;
CREATE POLICY "Parents can update their own children" ON public.students FOR UPDATE USING (true);
