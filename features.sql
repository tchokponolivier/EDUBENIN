-- NOUVELLES FONCTIONNALITÉS ERP SCOLAIRE

-- 1. Années Académiques
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ex: "2023-2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- 2. Configuration des frais
CREATE TABLE IF NOT EXISTS public.fees_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    fee_type TEXT NOT NULL, -- INSCRIPTION, MONTHLY, TRANSPORT, CANTEEN
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.fees_config ENABLE ROW LEVEL SECURITY;

-- 3. Dépenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL,
    category TEXT NOT NULL, -- FOURNITURE, FACTURE, SALAIRE
    proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. Absences
CREATE TABLE IF NOT EXISTS public.absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    absence_date DATE NOT NULL,
    motif TEXT,
    is_justified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

-- 5. Cours
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 6. Notes
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    evaluation_type TEXT NOT NULL, -- DEVOIR, COMPOSITION, INTERROGATION
    score NUMERIC NOT NULL,
    max_score NUMERIC NOT NULL DEFAULT 20,
    comment TEXT,
    grade_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- 7. Appréciations
CREATE TABLE IF NOT EXISTS public.appreciations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    term TEXT NOT NULL, -- TRIMESTRE 1, etc.
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.appreciations ENABLE ROW LEVEL SECURITY;

-- 8. Emploi du temps
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 1=Lundi, 7=Dimanche
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- POLITIQUES COMMUNES (SIMPLIFIÉES POUR L'EXEMPLE, À AFFINER SELON SÉCURITÉ)
CREATE POLICY "Staff view academic_years" ON public.academic_years FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins manage academic_years" ON public.academic_years FOR ALL USING (public.is_school_admin(school_id));

CREATE POLICY "Staff view fees" ON public.fees_config FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins manage fees" ON public.fees_config FOR ALL USING (public.is_school_admin(school_id));

CREATE POLICY "Staff view expenses" ON public.expenses FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER')));
CREATE POLICY "Staff manage expenses" ON public.expenses FOR ALL USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER')));

CREATE POLICY "Staff view absences" ON public.absences FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY', 'TEACHER')));
CREATE POLICY "Parents view own children absences" ON public.absences FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid()));
CREATE POLICY "Staff manage absences" ON public.absences FOR ALL USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY', 'TEACHER')));

CREATE POLICY "Staff view courses" ON public.courses FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (public.is_school_admin(school_id));

CREATE POLICY "Staff view grades" ON public.grades FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Parents view own children grades" ON public.grades FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid()));
CREATE POLICY "Teachers manage grades" ON public.grades FOR ALL USING (course_id IN (SELECT id FROM public.courses WHERE teacher_id = auth.uid()));

CREATE POLICY "Staff view appreciations" ON public.appreciations FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Parents view own children appreciations" ON public.appreciations FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE parent_id = auth.uid()));
CREATE POLICY "Teachers manage appreciations" ON public.appreciations FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Staff view timetables" ON public.timetables FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins manage timetables" ON public.timetables FOR ALL USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY')));
