const fs = require('fs');
let content = fs.readFileSync('src/pages/SupervisorDashboard.tsx', 'utf-8');
content = content.replace(/\\\\\\\`/g, '\`');
fs.writeFileSync('src/pages/SupervisorDashboard.tsx', content);
console.log("Patched SupervisorDashboard");
