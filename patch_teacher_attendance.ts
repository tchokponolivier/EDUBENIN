import fs from 'fs';
let content = fs.readFileSync('src/components/TeacherAttendance.tsx', 'utf-8');

if (content.includes("Enregistrer l'appel")) {
  content = content.replace(
    "Enregistrer l'appel",
    "Faire l'appel"
  );
  fs.writeFileSync('src/components/TeacherAttendance.tsx', content);
}
