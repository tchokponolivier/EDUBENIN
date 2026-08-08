import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

const replacement = `  const getNavigation = () => {
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
  };`;

content = content.replace(/  const getNavigation = \(\) => \{[\s\S]*?  \};/, replacement);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
