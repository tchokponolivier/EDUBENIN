import fs from 'fs';
let content = fs.readFileSync('src/pages/ParentPayments.tsx', 'utf-8');
content = content.replace(
  "studentId: selectedStudentId",
  "studentId: selectedChildId"
);
fs.writeFileSync('src/pages/ParentPayments.tsx', content);
