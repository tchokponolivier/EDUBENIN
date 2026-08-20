const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `import { SuperAdminDashboard } from './pages/SuperAdmin';`;
const insert = `import { SuperAdminDashboard } from './pages/SuperAdmin';
import { SupervisorDashboard } from "./pages/SupervisorDashboard";`;

content = content.replace(target, insert);
fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx");
