const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const importTarget = `import { ParentSupport } from "./pages/ParentSupport";`;
const importInsert = `import { ParentSupport } from "./pages/ParentSupport";
import { SupervisorDashboard } from "./pages/SupervisorDashboard";`;
content = content.replace(importTarget, importInsert);

const routeTarget = `          <Route path="/parent/support" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentSupport /></ProtectedRoute>} />`;
const routeInsert = `          <Route path="/parent/support" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentSupport /></ProtectedRoute>} />
          <Route path="/supervisor" element={<ProtectedRoute allowedRoles={['SUPERVISOR']}><SupervisorDashboard /></ProtectedRoute>} />`;
content = content.replace(routeTarget, routeInsert);

const switchTarget = `    case 'TEACHER': return <Navigate to="/teacher" replace />;
    case 'PARENT': return <Navigate to="/parent" replace />;`;
const switchInsert = `    case 'TEACHER': return <Navigate to="/teacher" replace />;
    case 'PARENT': return <Navigate to="/parent" replace />;
    case 'SUPERVISOR': return <Navigate to="/supervisor" replace />;`;
content = content.replace(switchTarget, switchInsert);

fs.writeFileSync('src/App.tsx', content);
console.log("Patched App.tsx for Supervisor");
