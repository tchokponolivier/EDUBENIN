CREATE TABLE IF NOT EXISTS public.salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    employee_role TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    month TEXT NOT NULL, -- e.g. '2023-10'
    status TEXT NOT NULL DEFAULT 'PAYÉ', -- 'PAYÉ', 'EN_ATTENTE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view salaries" ON public.salaries FOR SELECT USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER')));
CREATE POLICY "Staff manage salaries" ON public.salaries FOR ALL USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER')));

CREATE POLICY "Super admins can manage all salaries" ON public.salaries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'SUPER_ADMIN'
  )
);
