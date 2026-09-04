const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

code = code.replace(
  `          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },\n`,
  ``
);
code = code.replace(
  `          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },\n`,
  ``
);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
