import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Update imports
content = content.replace(
  `import { LogOut, LayoutDashboard, Users, CreditCard, BookOpen, Building, HelpCircle, User, Menu, X, Settings } from "lucide-react";`,
  `import { LogOut, LayoutDashboard, Users, CreditCard, BookOpen, Building, HelpCircle, User, Menu, X, Settings, Clock, FileText, Calendar, ArrowDownToLine, Banknote, Shield } from "lucide-react";`
);

// Update getNavigation
content = content.replace(
  `const getNavigation = () => {
    const commonSettings = { name: "Paramètres", href: "#settings", icon: Settings, action: () => setIsSettingsOpen(true) };
    switch (user.role) {
      case "SUPER_ADMIN":
        return [
          { name: "Établissements", href: "/super-admin", icon: Building },
          commonSettings
        ];
      case "SCHOOL_ADMIN":
        return [
          { name: "Tableau de bord", href: "/school-admin", icon: LayoutDashboard },
          { name: "Élèves", href: "/school-admin/students", icon: Users },
          { name: "Paiements", href: "/school-admin/payments", icon: CreditCard },
          { name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          commonSettings
        ];
      case "SECRETARY":
        return [
          { name: "Élèves (Saisie)", href: "/school-admin/students", icon: Users },
          commonSettings
        ];
      case "CASHIER":
        return [
          { name: "Paiements (Caisse)", href: "/school-admin/payments", icon: CreditCard },
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
          { name: "Mon Profil", href: "/teacher/profile", icon: User },
          commonSettings
        ];
      default:
        return [];
    }
  };`,
  `const getNavigation = () => {
    const commonSettings = { name: "Paramètres", href: "#settings", icon: Settings, action: () => setIsSettingsOpen(true) };
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
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Finances & Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: Banknote },
          { name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          commonSettings
        ];
      case "SECRETARY":
        return [
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Documents", href: "/school-admin/students?tab=DOCUMENTS", icon: FileText },
          { name: "Emplois du temps", href: "/school-admin/students?tab=TIMETABLES", icon: Calendar },
          commonSettings
        ];
      case "CASHIER":
        return [
          { name: "Tableau de Bord Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: LayoutDashboard },
          { name: "Encaissements", href: "/school-admin/payments?tab=PAYMENTS", icon: CreditCard },
          { name: "Dépenses", href: "/school-admin/payments?tab=EXPENSES", icon: ArrowDownToLine },
          { name: "Salaires", href: "/school-admin/payments?tab=SALARIES", icon: Banknote },
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
          { name: "Mon Profil", href: "/teacher/profile", icon: User },
          commonSettings
        ];
      default:
        return [];
    }
  };`
);

// We should also adjust the isActive check to ignore query parameters, otherwise clicking ?tab=ABSENCES might not highlight
content = content.replace(
  `const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/super-admin' && item.href !== '/school-admin' && item.href !== '/parent' && item.href !== '/teacher');`,
  `const itemPath = item.href.split('?')[0];\n            const currentTab = new URLSearchParams(location.search).get('tab');\n            const itemTab = item.href.split('?tab=')[1];\n            const isActive = (location.pathname === itemPath && (!itemTab || currentTab === itemTab)) || (location.pathname.startsWith(itemPath) && itemPath !== '/super-admin' && itemPath !== '/school-admin' && itemPath !== '/parent' && itemPath !== '/teacher' && !itemTab);`
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
