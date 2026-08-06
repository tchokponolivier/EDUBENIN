import { ReactNode, useState } from "react";
import { useAuth } from "../../lib/auth";
import { LogOut, LayoutDashboard, Users, CreditCard, BookOpen, Building, HelpCircle, User, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { EduBeninLogo } from "../Logo";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const getNavigation = () => {
    switch (user.role) {
      case "SUPER_ADMIN":
        return [{ name: "Établissements", href: "/super-admin", icon: Building }];
      case "SCHOOL_ADMIN":
        return [
          { name: "Tableau de bord", href: "/school-admin", icon: LayoutDashboard },
          { name: "Élèves", href: "/school-admin/students", icon: Users },
          { name: "Paiements", href: "/school-admin/payments", icon: CreditCard },
          { name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
        ];
      case "SECRETARY":
        return [
          { name: "Élèves (Saisie)", href: "/school-admin/students", icon: Users },
        ];
      case "CASHIER":
        return [
          { name: "Paiements (Caisse)", href: "/school-admin/payments", icon: CreditCard },
        ];
      case "PARENT":
        return [
          { name: "Mes Enfants", href: "/parent", icon: Users },
          { name: "Paiements", href: "/parent/payments", icon: CreditCard },
          { name: "Prospectus", href: "/parent/prospectus", icon: BookOpen },
          { name: "Assistance", href: "/parent/support", icon: HelpCircle },
        ];
      case "TEACHER":
        return [
          { name: "Mes Classes & Notes", href: "/teacher", icon: BookOpen },
          { name: "Mon Profil", href: "/teacher/profile", icon: User },
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
            const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/super-admin' && item.href !== '/school-admin' && item.href !== '/parent' && item.href !== '/teacher');
            const ItemIcon = item.icon;
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
            <div className="overflow-hidden">
              <p className="text-xs font-medium truncate text-white">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
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
            <h2 className="text-xl font-bold text-gray-700 hidden md:block">Vue d'ensemble du Système</h2>
            <h2 className="text-xl font-bold text-gray-700 md:hidden">EduBénin</h2>
            <span className="hidden md:inline-block px-2 py-0.5 bg-emerald-100 text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Bénin • 2026</span>
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
      </main>
    </div>
  );
}
