CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON public.invitations
    FOR ALL USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN')
    );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    inv_school_id UUID;
    inv_role TEXT;
BEGIN
  SELECT school_id, role INTO inv_school_id, inv_role 
  FROM public.invitations WHERE email = new.email;

  IF inv_school_id IS NOT NULL THEN
      INSERT INTO public.profiles (id, email, full_name, role, school_id)
      VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', inv_role, inv_school_id);
      
      DELETE FROM public.invitations WHERE email = new.email;
  ELSE
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'PARENT');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
