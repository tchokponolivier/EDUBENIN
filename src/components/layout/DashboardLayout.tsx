import { ReactNode, useState } from "react";
import { useAuth } from "../../lib/auth";
import { LogOut, LayoutDashboard, Users, CreditCard, BookOpen, Building, HelpCircle, User, Menu, X, Settings, Clock, FileText, Calendar, ArrowDownToLine, Banknote, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { EduBeninLogo } from "../Logo";
import { UserSettingsModal } from "../UserSettingsModal";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  useEffect(() => {
    if (user?.schoolId) {
      supabase.from('schools').select('name').eq('id', user.schoolId).single()
        .then(({ data }) => {
          if (data) setSchoolName(data.name);
        });
    }
  }, [user]);

  if (!user) return null;

  const getNavigation = () => {
    const commonSettings = { name: "Mon Profil", href: "#settings", icon: User, action: () => setIsSettingsOpen(true) };
    switch (user.role) {
      case "SUPER_ADMIN":
        return [
          { name: "Administration", href: "/super-admin", icon: Shield },
          commonSettings
        ];
      case "SCHOOL_ADMIN":
        return [
          { name: "Tableau de bord", href: "/school-admin", icon: LayoutDashboard },
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Finances & Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: Banknote },
          { name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },
          commonSettings
        ];
      case "SECRETARY":
        return [
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Documents", href: "/school-admin/students?tab=DOCUMENTS", icon: FileText },
          { name: "Emplois du temps", href: "/school-admin/students?tab=TIMETABLES", icon: Calendar },
          commonSettings
        ];
      case "CASHIER":
        return [
          { name: "Tableau de Bord Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: LayoutDashboard },
          { name: "Inscriptions Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Encaissements", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },
          { name: "Dépenses", href: "/school-admin/payments?tab=EXPENSES", icon: ArrowDownToLine },
          { name: "Salaires", href: "/school-admin/payments?tab=SALARIES", icon: Banknote },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },
          commonSettings
        ];
      case "PARENT":
        return [
          { name: "Mes Enfants", href: "/parent", icon: Users },
          { name: "Paiements", href: "/parent/payments", icon: CreditCard },
          { name: "Prospectus", href: "/parent/prospectus", icon: BookOpen },
          { name: "Assistance", href: "/parent/support", icon: HelpCircle },
          commonSettings
        ];
      case "TEACHER":
        return [
          { name: "Mes Classes & Notes", href: "/teacher", icon: BookOpen },
          
          commonSettings
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-700 flex text-sm relative">
      {/* Sidebar */}
      <aside className={clsx("w-64 bg-slate-900 text-white flex-col shrink-0 md:flex z-50",
        isMobileMenuOpen ? "fixed inset-y-0 left-0 flex" : "hidden"
      )}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <EduBeninLogo className="w-8 h-8" />
              <h1 className="text-lg font-bold leading-none tracking-tight">EDU-BENIN</h1>
            </div>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest mt-2">Gestion Scolaire</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
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
                    "flex items-center gap-3 px-3 py-2 rounded transition-colors font-medium w-full text-left",
                    "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <ItemIcon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded transition-colors font-medium",
                  isActive 
                    ? "bg-emerald-600 text-white" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <ItemIcon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-700 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-medium truncate text-white">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:text-white p-1 ml-auto">
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-700 hidden md:block">{schoolName || "Vue d'ensemble du Système"}</h2>
            <h2 className="text-xl font-bold text-gray-700 md:hidden">{schoolName ? schoolName.substring(0, 15) + (schoolName.length > 15 ? '...' : '') : "EduBénin"}</h2>
            <span className="hidden md:inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Année Scolaire 2025-2026</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Système En Ligne
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 hover:text-emerald-600 p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 md:p-8">
            {children}
          </div>
        </div>
        <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </main>
    </div>
  );
}
