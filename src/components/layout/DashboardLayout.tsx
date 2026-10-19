import { ReactNode, useState } from "react";
import { useAuth } from "../../lib/auth";
import { LogOut, LayoutDashboard, Users, CreditCard, BookOpen, Building, HelpCircle, User, UserCheck, Menu, X, Settings, Clock, FileText, Calendar, ArrowDownToLine, Banknote, Shield, AlertCircle, ShieldAlert, Award, Megaphone, FileSpreadsheet, Database, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { EduBeninLogo } from "../Logo";
import { UserSettingsModal } from "../UserSettingsModal";
import { NotificationMenu } from "../NotificationMenu";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(
    user?.schoolName || localStorage.getItem('edubenin_active_school_name') || null
  );
  const [academicYear, setAcademicYear] = useState<string | null>(null);

  useEffect(() => {
    if (user?.schoolName) {
      setSchoolName(user.schoolName);
    }
    const targetSchoolId = user?.schoolId || localStorage.getItem('edubenin_active_school_id');
    if (targetSchoolId) {
      supabase.from('schools').select('name, academic_year').eq('id', targetSchoolId).maybeSingle()
        .then(({ data }) => {
          if (data) {
            if (data.name) {
              setSchoolName(data.name);
              localStorage.setItem('edubenin_active_school_name', data.name);
            }
            if (data.academic_year) setAcademicYear(data.academic_year);
          }
        });
    } else {
      const stored = localStorage.getItem('edubenin_active_school_name');
      if (stored) setSchoolName(stored);
    }
  }, [user]);

  if (!user) return null;

  const getNavigation = () => {
    const commonSettings = { name: "Mon Profil", href: "#settings", icon: User, action: () => setIsSettingsOpen(true) };
    const commonHelp = { name: "Aide & Guide", href: `/help?role=${user.role}`, icon: HelpCircle };
    switch (user.role) {
      case "SUPER_ADMIN":
        return [
          { name: "Administration", href: "/super-admin", icon: Shield },
          commonHelp,
          commonSettings
        ];
      case "SCHOOL_ADMIN":
        return [
          { name: "Tableau de bord", href: "/school-admin", icon: LayoutDashboard },
          { name: "Membres & Invitations", href: "/school-admin?tab=MEMBERS", icon: UserCheck },
          { name: "Caisse du Jour", href: "/school-admin/payments?tab=DAILY_SUMMARY", icon: Clock },
          { name: "Finances & Caisse", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: Banknote },
          { name: "Liste Financière", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: FileSpreadsheet },
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },
          { name: "Sauvegarde", href: "/school-admin?tab=BACKUP", icon: Database },
          { name: "Paramètres Établissement", href: "/school-admin?tab=SETTINGS", icon: Settings },
          commonHelp,
          commonSettings
        ];
      case "SUPERVISOR":
        return [
          { name: "Tableau de Bord", href: "/supervisor", icon: LayoutDashboard },
          { name: "Discipline & Sanctions", href: "/supervisor?tab=DISCIPLINE", icon: ShieldAlert },
          { name: "Absences Élèves", href: "/supervisor?tab=ABSENCES", icon: Clock },
          { name: "Sorties & Mouvements", href: "/supervisor?tab=TRIPS", icon: Building },
          { name: "Absences Profs", href: "/supervisor?tab=TEACHER_ABSENCES", icon: Users },
          { name: "Matériel", href: "/supervisor?tab=MATERIALS", icon: BookOpen },
          commonHelp,
          commonSettings
        ];
      case "SECRETARY":
        return [
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Personnel & RH", href: "/school-admin/students?tab=HR", icon: Users },
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Documents", href: "/school-admin/students?tab=DOCUMENTS", icon: FileText },
          { name: "Courriers", href: "/school-admin/students?tab=MAILS", icon: FileText },
          { name: "Épreuves", href: "/school-admin/students?tab=EXAMS", icon: BookOpen },
          { name: "Planning", href: "/school-admin/students?tab=PLANNING", icon: Calendar },
          commonHelp,
          commonSettings
        ];
      case "CASHIER":
        return [
          { name: "Tableau de Bord Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: LayoutDashboard },
          { name: "Liste Financière", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: FileSpreadsheet },
          { name: "Caisse du Jour", href: "/school-admin/payments?tab=DAILY_SUMMARY", icon: Clock },
          { name: "Vérifications", href: "/school-admin/payments?tab=VERIFICATION", icon: CreditCard },
          { name: "Encaissements", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },
          { name: "Créances", href: "/school-admin/payments?tab=CREANCES", icon: AlertCircle },
          { name: "Dépenses", href: "/school-admin/payments?tab=EXPENSES", icon: ArrowDownToLine },
          { name: "Salaires", href: "/school-admin/payments?tab=SALARIES", icon: Banknote },
          { name: "Inscriptions Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },
          commonHelp,
          commonSettings
        ];
      case "PARENT":
        return [
          { name: "Mes Enfants", href: "/parent", icon: Users },
          { name: "Paiements", href: "/parent/payments", icon: CreditCard },
          { name: "Prospectus", href: "/parent/prospectus", icon: BookOpen },
          { name: "Assistance", href: "/parent/support", icon: MessageCircle },
          commonHelp,
          commonSettings
        ];
      case "DIRECTOR_OF_STUDIES":
        return [
          { name: "Tableau de bord", href: "/school-admin", icon: LayoutDashboard },
          { name: "Membres & Invitations", href: "/school-admin?tab=MEMBERS", icon: UserCheck },
          { name: "Caisse du Jour", href: "/school-admin/payments?tab=DAILY_SUMMARY", icon: Clock },
          { name: "Finances & Caisse", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: Banknote },
          { name: "Liste Financière", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: FileSpreadsheet },
          { name: "Planification Académique", href: "/director", icon: Calendar },
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Bulletins", href: "/director/bulletins", icon: Award },
          { name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },
          { name: "Annonces", href: "/director/announcements", icon: Megaphone },
          { name: "Sauvegarde", href: "/school-admin?tab=BACKUP", icon: Database },
          { name: "Paramètres Établissement", href: "/school-admin?tab=SETTINGS", icon: Settings },
          commonHelp,
          commonSettings
        ];
      case "TEACHER":
        return [
          { name: "Mes Classes & Notes", href: "/teacher", icon: BookOpen },
          commonHelp,
          commonSettings
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigation();

  // Mobile Bottom Quick Navigation
  const getMobileBottomNav = () => {
    switch (user.role) {
      case "PARENT":
        return [
          { name: "Enfants", href: "/parent", icon: Users },
          { name: "Payer", href: "/parent/payments", icon: CreditCard },
          { name: "Prospectus", href: "/parent/prospectus", icon: BookOpen },
          { name: "Aide", href: "/help?role=PARENT", icon: HelpCircle },
        ];
      case "TEACHER":
        return [
          { name: "Notes", href: "/teacher", icon: BookOpen },
          { name: "Prospectus", href: "/teacher/prospectus", icon: BookOpen },
          { name: "Profil", href: "#settings", icon: User, action: () => setIsSettingsOpen(true) },
          { name: "Aide", href: "/help?role=TEACHER", icon: HelpCircle },
        ];
      case "CASHIER":
        return [
          { name: "Finances", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: FileSpreadsheet },
          { name: "Caisse", href: "/school-admin/payments?tab=DAILY_SUMMARY", icon: Clock },
          { name: "Vérif", href: "/school-admin/payments?tab=VERIFICATION", icon: CreditCard },
          { name: "Créances", href: "/school-admin/payments?tab=CREANCES", icon: AlertCircle },
        ];
      case "SECRETARY":
        return [
          { name: "Inscriptions", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Docs", href: "/school-admin/students?tab=DOCUMENTS", icon: FileText },
          { name: "Aide", href: "/help?role=SECRETARY", icon: HelpCircle },
        ];
      case "SUPERVISOR":
        return [
          { name: "Discipline", href: "/supervisor?tab=DISCIPLINE", icon: ShieldAlert },
          { name: "Absences", href: "/supervisor?tab=ABSENCES", icon: Clock },
          { name: "Sorties", href: "/supervisor?tab=TRIPS", icon: Building },
          { name: "Aide", href: "/help?role=SUPERVISOR", icon: HelpCircle },
        ];
      case "SCHOOL_ADMIN":
      case "DIRECTOR_OF_STUDIES":
      default:
        return [
          { name: "Accueil", href: "/school-admin", icon: LayoutDashboard },
          { name: "Finances", href: "/school-admin/payments?tab=FINANCIAL_LIST", icon: Banknote },
          { name: "Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Aide", href: `/help?role=${user.role}`, icon: HelpCircle },
        ];
    }
  };

  const mobileBottomNav = getMobileBottomNav();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-700 flex text-sm relative overflow-x-hidden">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop sticky & Mobile off-canvas slide-in) */}
      <aside className={clsx(
        "bg-slate-900 text-white flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out",
        "w-72 max-w-[85vw] md:w-64",
        "fixed inset-y-0 left-0 md:static flex",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <EduBeninLogo className="w-7 h-7 sm:w-8 sm:h-8" />
              <h1 className="text-base sm:text-lg font-bold leading-none tracking-tight">EDU-BENIN</h1>
            </div>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest mt-1.5 font-medium">Gestion Scolaire</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 touch-scroll">
          {navigation.map((item) => {
            const itemPath = item.href.split('?')[0];
            const currentTab = new URLSearchParams(location.search).get('tab');
            const itemTab = item.href.split('?tab=')[1];
            const isActive = (location.pathname === itemPath && (!itemTab || currentTab === itemTab)) || (location.pathname.startsWith(itemPath) && itemPath !== '/super-admin' && itemPath !== '/school-admin' && itemPath !== '/parent' && itemPath !== '/teacher' && !itemTab);
            const ItemIcon = item.icon;
            if ((item as any).action) {
              return (
                <button
                  key={item.name}
                  onClick={() => { (item as any).action(); setIsMobileMenuOpen(false); }}
                  className={clsx(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium w-full text-left text-xs sm:text-sm min-h-[44px]",
                    "text-slate-400 hover:text-white hover:bg-slate-800 active:scale-98"
                  )}
                >
                  <ItemIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium text-xs sm:text-sm min-h-[44px]",
                  isActive 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-98"
                )}
              >
                <ItemIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden text-xs">
              {user.avatar ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
            <button 
              onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }} 
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Paramètres de profil"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800/80 transition min-h-[40px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Top Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 md:px-8 flex items-center justify-between shrink-0 gap-2 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate leading-snug">
              {schoolName || user?.schoolName || localStorage.getItem('edubenin_active_school_name') || "Établissement Scolaire"}
            </h2>
            {academicYear && (
              <span className="hidden sm:inline-flex shrink-0 px-2 sm:px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {academicYear}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En Ligne
            </div>

            <Link
              to={`/help?role=${user.role}`}
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition-colors shrink-0"
              title="Centre d'Aide & Procédures"
            >
              <HelpCircle size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">Aide & Guide</span>
            </Link>

            <NotificationMenu />

            <div className="hidden md:block w-px h-5 bg-slate-200"></div>

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 active:scale-95 transition"
              aria-label="Ouvrir le menu latéral"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Viewport with Bottom Padding for Mobile Nav */}
        <div className="flex-1 overflow-y-auto bg-slate-50 touch-scroll">
          <div className="p-3 sm:p-5 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar (Fluid, Native-feel & Thumb-friendly) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-pb px-1 py-1 shadow-lg flex items-center justify-around">
          {mobileBottomNav.map((bItem) => {
            const bPath = bItem.href.split('?')[0];
            const currentTab = new URLSearchParams(location.search).get('tab');
            const itemTab = bItem.href.split('?tab=')[1];
            const isActive = (location.pathname === bPath && (!itemTab || currentTab === itemTab)) || 
                             (location.pathname.startsWith(bPath) && bPath !== '/school-admin' && bPath !== '/parent' && bPath !== '/teacher' && !itemTab);
            const BIcon = bItem.icon;
            
            if ((bItem as any).action) {
              return (
                <button
                  key={bItem.name}
                  onClick={(bItem as any).action}
                  className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[48px] text-slate-500 hover:text-slate-900 transition active:scale-95"
                >
                  <BIcon size={19} />
                  <span className="text-[10px] font-semibold mt-0.5">{bItem.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={bItem.name}
                to={bItem.href}
                className={clsx(
                  "flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[48px] rounded-lg transition active:scale-95",
                  isActive
                    ? "text-emerald-700 font-bold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <BIcon size={19} className={isActive ? "text-emerald-600 stroke-[2.4]" : "text-slate-500"} />
                <span className="text-[10px] font-semibold mt-0.5 truncate">{bItem.name}</span>
              </Link>
            );
          })}

          {/* Menu Drawer Opener */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[48px] text-slate-500 hover:text-slate-900 transition active:scale-95"
            aria-label="Toutes les rubriques"
          >
            <Menu size={19} />
            <span className="text-[10px] font-semibold mt-0.5">Plus</span>
          </button>
        </nav>

        <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </main>
    </div>
  );
}
