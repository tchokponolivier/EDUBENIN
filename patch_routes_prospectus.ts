import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  `<Route path="/school-admin/stats" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}><SchoolAdminStats /></ProtectedRoute>} />`,
  `<Route path="/school-admin/stats" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}><SchoolAdminStats /></ProtectedRoute>} />\n          <Route path="/school-admin/prospectus" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'CASHIER']}><ParentProspectus /></ProtectedRoute>} />`
);

fs.writeFileSync('src/App.tsx', content);
