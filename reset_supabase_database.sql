-- =========================================================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE DE LA BASE DE DONNÉES SUPABASE (EDU-BENIN)
-- À exécuter dans : Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. VIDER TOUTES LES TABLES DE DONNÉES DE L'APPLICATION (AVEC CASCADE)
-- Ceci efface toutes les écoles, membres, profs, élèves, paiements, salaires, dépenses et notes
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
  public.salaries,
  public.expenses,
  public.profiles,
  public.schools
CASCADE;

-- 2. SUPPRIMER TOUS LES UTILISATEURS D'AUTHENTIFICATION SUPABASE (GOOGLE & EMAIL)
-- ATTENTION : Ceci force la déconnexion et supprime tous les comptes dans auth.users.
-- Les sessions Google seront entièrement révoquées.
-- Dès lors, lorsqu'un directeur se reconnectera avec Google :
--   - Google affichera obligatoirement la demande de sélection de compte Google
--   - L'application affichera le popup demandant le nom de l'établissement,
--     le numéro de téléphone et la monnaie utilisée pour les données financières !
DELETE FROM auth.users;
