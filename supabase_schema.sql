-- =========================================================================================
-- CONFIGURATION PROFESSIONNELLE MULTI-ÉTABLISSEMENTS (MULTI-TENANT) POUR SUPABASE
-- =========================================================================================

-- 1. Activer l'extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Création de la table des établissements (Écoles)
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    locality TEXT,
    logo TEXT,
    motto TEXT,
    contacts TEXT,
    mobile_money_numbers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- 3. Création de la table des Profils Utilisateurs (liée à auth.users)
-- Types de rôles : SUPER_ADMIN, SCHOOL_ADMIN, SECRETARY, CASHIER, PARENT, TEACHER
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'PARENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Création de la table des Élèves
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    level TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 5. Création de la table des Paiements
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    network TEXT,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =========================================================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security) - Le coeur de l'architecture Pro
-- =========================================================================================

-- POLITIQUES POUR LES ÉCOLES
-- Un administrateur d'école peut voir/modifier uniquement son école

    
CREATE POLICY "Admins can update their own school" ON public.schools
    FOR UPDATE USING (id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));

-- Tous les utilisateurs d'une école peuvent voir les infos de l'école


-- POLITIQUES POUR LES PROFILS
-- Un utilisateur peut voir son propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Un admin d'école peut voir tous les profils de son école
CREATE OR REPLACE FUNCTION public.is_school_admin(check_school_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN' AND school_id = check_school_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "School admins view all profiles in school" ON public.profiles
    FOR SELECT USING ( public.is_school_admin(school_id) );

-- POLITIQUES POUR LES ÉLÈVES
-- Un admin/secrétaire/caisse peut voir tous les élèves de son école
CREATE POLICY "Staff can view all students in their school" ON public.students
    FOR SELECT USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY', 'CASHIER', 'TEACHER'))
    );

-- Un parent ne peut voir QUE ses propres enfants
CREATE POLICY "Parents can only view their own children" ON public.students
    FOR SELECT USING (parent_id = auth.uid());

-- POLITIQUES POUR LES PAIEMENTS
-- La caisse et l'admin voient tous les paiements de l'école
CREATE POLICY "Staff view payments" ON public.payments
    FOR SELECT USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER'))
    );

-- Les parents ne voient que les paiements de leurs enfants
CREATE POLICY "Parents view own payments" ON public.payments
    FOR SELECT USING (parent_id = auth.uid());


-- =========================================================================================
-- FONCTION ET TRIGGER POUR CRÉER LE PROFIL AUTOMATIQUEMENT A L'INSCRIPTION
-- =========================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'PARENT');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur sur la table auth.users de Supabase
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Un utilisateur peut modifier son propre profil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- INSERT pour les écoles : Un utilisateur authentifié peut créer une école
CREATE POLICY "Users can create schools" ON public.schools
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- INSERT pour les élèves : Les admins et secrétaires peuvent insérer
CREATE POLICY "Staff can insert students" ON public.students
    FOR INSERT WITH CHECK (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY'))
    );

-- UPDATE/DELETE pour les élèves : Les admins et secrétaires peuvent modifier/supprimer
CREATE POLICY "Staff can update students" ON public.students
    FOR UPDATE USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY'))
    );

CREATE POLICY "Staff can delete students" ON public.students
    FOR DELETE USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'SECRETARY'))
    );

-- INSERT/UPDATE pour les paiements
CREATE POLICY "Staff can insert payments" ON public.payments
    FOR INSERT WITH CHECK (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER'))
    );

CREATE POLICY "Staff can update payments" ON public.payments
    FOR UPDATE USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'CASHIER'))
    );

-- Les parents peuvent insérer des paiements pour leurs propres enfants
CREATE POLICY "Parents can insert payments" ON public.payments
    FOR INSERT WITH CHECK (parent_id = auth.uid());


CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;
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
  -- Vérifier s'il y a une invitation
  SELECT school_id, role INTO inv_school_id, inv_role 
  FROM public.invitations WHERE email = new.email;

  IF inv_school_id IS NOT NULL THEN
      INSERT INTO public.profiles (id, email, full_name, role, school_id)
      VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', inv_role, inv_school_id);
      
      -- Supprimer l'invitation (Optionnel, on peut la laisser pour historique, mais mieux vaut nettoyer)
      DELETE FROM public.invitations WHERE email = new.email;
  ELSE
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'PARENT');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Fonction pour vérifier si l'utilisateur est SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ajouter les accès complets (ALL) pour le SUPER_ADMIN sur chaque table

-- SCHOOLS
CREATE POLICY "Super admins can manage all schools" ON public.schools
    FOR ALL USING ( public.is_super_admin() );

-- PROFILES
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL USING ( public.is_super_admin() );

-- STUDENTS
CREATE POLICY "Super admins can manage all students" ON public.students
    FOR ALL USING ( public.is_super_admin() );

-- PAYMENTS
CREATE POLICY "Super admins can manage all payments" ON public.payments
    FOR ALL USING ( public.is_super_admin() );

-- INVITATIONS
CREATE POLICY "Super admins can manage all invitations" ON public.invitations
    FOR ALL USING ( public.is_super_admin() );

