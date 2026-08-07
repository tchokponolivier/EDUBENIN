CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    inv_school_id UUID;
    inv_role TEXT;
BEGIN
  -- Si l'email est contact.tchok@gmail.com, on le force SUPER_ADMIN sans école
  IF new.email = 'contact.tchok@gmail.com' THEN
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Super Admin'), 'SUPER_ADMIN');
      RETURN new;
  END IF;

  -- Vérifier s'il y a une invitation
  SELECT school_id, role INTO inv_school_id, inv_role 
  FROM public.invitations WHERE email = new.email;

  IF inv_school_id IS NOT NULL THEN
      INSERT INTO public.profiles (id, email, full_name, role, school_id)
      VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Utilisateur Invité'), inv_role, inv_school_id);
      
      -- Supprimer l'invitation
      DELETE FROM public.invitations WHERE email = new.email;
  ELSE
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Parent'), 'PARENT');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
