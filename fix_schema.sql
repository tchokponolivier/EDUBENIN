-- Fix fees_config vs fee_config
ALTER TABLE IF EXISTS public.fees_config RENAME TO fee_config;

-- Add payment_date and payment_method to payments if they don't exist
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Drop absences and create attendance
DROP TABLE IF EXISTS public.absences;
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- ABSENCE, DELAY
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    is_justified BOOLEAN DEFAULT FALSE,
    reported_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance is viewable by everyone in same school."
    ON public.attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.school_id = attendance.school_id
        )
    );
CREATE POLICY "Attendance can be created by school staff."
    ON public.attendance FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.school_id = attendance.school_id
        )
    );
CREATE POLICY "Attendance can be updated by school staff."
    ON public.attendance FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.school_id = attendance.school_id
        )
    );
