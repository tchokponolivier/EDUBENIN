ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage academic years" ON public.academic_years
    FOR ALL USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN')
    );
CREATE POLICY "Anyone can view academic years" ON public.academic_years
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.fees_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fees_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fees config" ON public.fees_config
    FOR ALL USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN')
    );
CREATE POLICY "Anyone can view fees config" ON public.fees_config
    FOR SELECT USING (true);
