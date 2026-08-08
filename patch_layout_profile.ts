import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

// Update getNavigation
content = content.replace(
  `const commonSettings = { name: "Paramètres", href: "#settings", icon: Settings, action: () => setIsSettingsOpen(true) };`,
  `const commonSettings = { name: "Mon Profil", href: "#settings", icon: User, action: () => setIsSettingsOpen(true) };`
);

content = content.replace(
  `{ name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },`,
  `{ name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },`
);

content = content.replace(
  `{ name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },`,
  `{ name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },`
);

content = content.replace(
  `{ name: "Tableau de Bord Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: LayoutDashboard },`,
  `{ name: "Tableau de Bord Caisse", href: "/school-admin/payments?tab=DASHBOARD", icon: LayoutDashboard },
          { name: "Inscriptions Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },`
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
