import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf-8');

content = content.replace(
  `function ClassSection({ className, students, teachers }: { className: string, students: any[], teachers: any[] }) {`,
  `function ClassSection({ className, students, teachers }: { key?: string, className: string, students: any[], teachers: any[] }) {`
);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', content);
