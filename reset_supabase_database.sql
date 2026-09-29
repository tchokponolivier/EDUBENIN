-- =========================================================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES SUPABASE (EDU-BENIN)
-- À exécuter dans : Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. VIDER TOUTES LES TABLES DE DONNÉES DE L'APPLICATION (AVEC CASCADE)
-- Ceci efface toutes les écoles, membres, profs, élèves, paiements, cours et notes
TRUNCATE TABLE 
  public.payments,
  public.students,
  public.courses,
  public.timetables,
  public.grades,
  public.attendance,
  public.announcements,
  public.invitations,
  public.academic_years,
  public.fee_config,
  public.school_fees,
  public.profiles,
  public.schools
CASCADE;

-- 2. SUPPRIMER TOUS LES UTILISATEURS D'AUTHENTIFICATION SUPABASE (GOOGLE & EMAIL)
-- ATTENTION : Ceci force la déconnexion de tous les utilisateurs et supprime
-- leurs sessions Google. Ainsi, lorsqu'un directeur se reconnectera avec Google,
-- Supabase lui demandera à nouveau de choisir son compte et de renseigner son école !
DELETE FROM auth.users;

-- 3. (OPTIONNEL) RECÉDER LE COMPTE SUPER ADMIN PAR DÉFAUT SI NÉCESSAIRE
-- Après exécution, connectez-vous avec contact.tchok@gmail.com pour être SUPER_ADMIN
