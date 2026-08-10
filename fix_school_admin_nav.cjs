const fs = require('fs');
let content = fs.readFileSync('src/pages/SchoolAdmin.tsx', 'utf-8');

content = content.replace(
  `const activeTab = searchParams.get('tab') === 'SETTINGS' ? 'SETTINGS' : 'DASHBOARD';`,
  `const activeTab = searchParams.get('tab') || 'DASHBOARD';`
);

fs.writeFileSync('src/pages/SchoolAdmin.tsx', content);
