import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminStudentList.tsx', 'utf-8');

content = content.replace(
  'className={\\`text-[10px] font-bold uppercase px-2 py-1 rounded \\${',
  'className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${'
);
content = content.replace(
  "s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'",
  "s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
);
content = content.replace(
  '                    }\\`}>',
  '                    }`}>'
);

fs.writeFileSync('src/pages/SchoolAdminStudentList.tsx', content);
