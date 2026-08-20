const fs = require('fs');
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

const target = `      case "SECRETARY":`;
const insert = `      case "SUPERVISOR":
        return [
          { name: "Tableau de Bord", href: "/supervisor", icon: LayoutDashboard },
          { name: "Absences Élèves", href: "/supervisor?tab=ABSENCES", icon: Clock },
          { name: "Sorties Pédagogiques", href: "/supervisor?tab=TRIPS", icon: Building },
          { name: "Absences Profs", href: "/supervisor?tab=TEACHER_ABSENCES", icon: Users },
          { name: "Matériel", href: "/supervisor?tab=MATERIALS", icon: BookOpen },
          commonSettings
        ];
      case "SECRETARY":`;

content = content.replace(target, insert);

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
console.log("Patched DashboardLayout for Supervisor");
