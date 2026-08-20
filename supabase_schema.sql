-- =========================================================================================
-- CONFIGURATION PROFESSIONNELLE MULTI-ÉTABLISSEMENTS (MULTI-TENANT) POUR SUPABASE
-- =========================================================================================

-- 1. Activer l'extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Création de la table des établissements (Écoles)
CREATE TABLE IF NOT EXISTS public.schools (
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
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'PARENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Création de la table des Élèves
CREATE TABLE IF NOT EXISTS public.students (
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
CREATE TABLE IF NOT EXISTS public.payments (
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
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
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
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notification_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, user_id)
);
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Table: calendar_events
-- Description: Stocke les événements du calendrier partagé de l'établissement
-- -----------------------------------------------------------------------------
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    time TEXT,
    type TEXT NOT NULL CHECK (type IN ('EXAM', 'HOLIDAY', 'KEY_DATE', 'MEETING')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Les utilisateurs d'une école peuvent voir les événements
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar events" ON public.calendar_events
    FOR SELECT USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Staff can insert calendar events" ON public.calendar_events
    FOR INSERT WITH CHECK (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'DIRECTOR_OF_STUDIES'))
    );

CREATE POLICY "Staff can delete calendar events" ON public.calendar_events
    FOR DELETE USING (
        school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'DIRECTOR_OF_STUDIES'))
    );

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
