import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

content = content.replace(
  `{ name: "Mon Profil", href: "/teacher/profile", icon: User },`,
  ``
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
