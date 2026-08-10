const fs = require('fs');
let authContent = fs.readFileSync('src/lib/auth.tsx', 'utf-8');
authContent = authContent.replace(
  'id: "00000000-0000-4000-8000-" + Date.now().toString().slice(-12)',
  'id: `00000000-0000-4000-8000-${Date.now().toString().slice(-12)}`'
);
fs.writeFileSync('src/lib/auth.tsx', authContent);
