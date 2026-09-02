const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  `<Route path="/parent/prospectus" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentProspectus /></ProtectedRoute>} />`,
  `<Route path="/parent/prospectus" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentProspectus /></ProtectedRoute>} />
          <Route path="/teacher/prospectus" element={<ProtectedRoute allowedRoles={['TEACHER']}><ParentProspectus /></ProtectedRoute>} />`
);
fs.writeFileSync('src/App.tsx', appCode);

let layoutCode = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  `{ name: "Mon Profil", href: "/teacher/profile", icon: Settings },`,
  `{ name: "Prospectus", href: "/teacher/prospectus", icon: BookOpen },
          { name: "Mon Profil", href: "/teacher/profile", icon: Settings },`
);
fs.writeFileSync('src/components/layout/DashboardLayout.tsx', layoutCode);

