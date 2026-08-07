CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by everyone in school"
    ON public.announcements FOR SELECT
    USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Announcements creatable by admins"
    ON public.announcements FOR ALL
    USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));


CREATE TABLE IF NOT EXISTS public.special_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.special_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requests viewable by admins and parent"
    ON public.special_requests FOR SELECT
    USING (
        parent_id = auth.uid() OR
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN')
    );
CREATE POLICY "Requests creatable by parents"
    ON public.special_requests FOR INSERT
    WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Requests updatable by admins"
    ON public.special_requests FOR UPDATE
    USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));
