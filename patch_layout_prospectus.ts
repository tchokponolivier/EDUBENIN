import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

content = content.replace(
  `{ name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },`,
  `{ name: "Synthèse & Bilans", href: "/school-admin/stats", icon: BookOpen },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },`
);

content = content.replace(
  `{ name: "Salaires", href: "/school-admin/payments?tab=SALARIES", icon: Banknote },`,
  `{ name: "Salaires", href: "/school-admin/payments?tab=SALARIES", icon: Banknote },
          { name: "Prospectus", href: "/school-admin/prospectus", icon: BookOpen },`
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
