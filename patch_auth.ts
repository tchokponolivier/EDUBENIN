import fs from 'fs';
let content = fs.readFileSync('src/lib/auth.tsx', 'utf-8');

if (!content.includes('"director@school.com"')) {
  content = content.replace(
    '  "prof@school.com": {',
    `  "director@school.com": {
    id: "dir_1",
    email: "director@school.com",
    name: "Directeur des Études",
    role: "DIRECTOR_OF_STUDIES",
    schoolId: "school_1",
  },
  "prof@school.com": {`
  );

  fs.writeFileSync('src/lib/auth.tsx', content);
}
