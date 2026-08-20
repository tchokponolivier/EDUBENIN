const fs = require('fs');
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

const target = `      case "SECRETARY":
        return [
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Documents", href: "/school-admin/students?tab=DOCUMENTS", icon: FileText },
          { name: "Emplois du temps", href: "/school-admin/students?tab=TIMETABLES", icon: Calendar },
          commonSettings
        ];`;
        
const insert = `      case "SECRETARY":
        return [
          { name: "Inscriptions & Élèves", href: "/school-admin/students?tab=STUDENTS", icon: Users },
          { name: "Liste des Élèves", href: "/school-admin/students-list", icon: Users },
          { name: "Professeurs", href: "/school-admin/teachers", icon: Users },
          { name: "Absences & Retards", href: "/school-admin/students?tab=ABSENCES", icon: Clock },
          { name: "Documents", href: "/school-admin/students?tab=DOCUMENTS", icon: FileText },
          { name: "Courriers", href: "/school-admin/students?tab=MAILS", icon: FileText },
          { name: "Épreuves", href: "/school-admin/students?tab=EXAMS", icon: BookOpen },
          { name: "Planning", href: "/school-admin/students?tab=PLANNING", icon: Calendar },
          commonSettings
        ];`;

content = content.replace(target, insert);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
console.log("Patched layout for secretary");
