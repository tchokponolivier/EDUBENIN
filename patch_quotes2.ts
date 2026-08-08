import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf-8');

content = content.replace(
  "                  }}>",
  "                  }`}>"
);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', content);
