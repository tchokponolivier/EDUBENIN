import fs from 'fs';
let content = fs.readFileSync('src/pages/SchoolAdminPayments.tsx', 'utf-8');

content = content.replace(
  '    const settings = schoolSettings;',
  '    const settings: any = { name: "École" };'
);

fs.writeFileSync('src/pages/SchoolAdminPayments.tsx', content);
