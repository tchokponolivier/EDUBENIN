import fs from 'fs';
let content = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf-8');

if (!content.includes('case "DIRECTOR_OF_STUDIES":')) {
  content = content.replace(
    '      case "TEACHER":',
    `      case "DIRECTOR_OF_STUDIES":
        return [
          { name: "Direction des Études", href: "/director", icon: BookOpen },
          commonSettings
        ];
      case "TEACHER":`
  );

  fs.writeFileSync('src/components/layout/DashboardLayout.tsx', content);
}
