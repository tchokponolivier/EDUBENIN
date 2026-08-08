import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('SchoolAdminStudentList')) {
  content = content.replace(
    `import { SchoolAdminStudents } from './pages/SchoolAdminStudents';`,
    `import { SchoolAdminStudents } from './pages/SchoolAdminStudents';\nimport { SchoolAdminStudentList } from './pages/SchoolAdminStudentList';\nimport { SchoolAdminTeachers } from './pages/SchoolAdminTeachers';`
  );

  content = content.replace(
    `<Route path="/school-admin/students" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SECRETARY', 'CASHIER']}><SchoolAdminStudents /></ProtectedRoute>} />`,
    `<Route path="/school-admin/students" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SECRETARY', 'CASHIER']}><SchoolAdminStudents /></ProtectedRoute>} />\n          <Route path="/school-admin/students-list" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SECRETARY', 'CASHIER']}><SchoolAdminStudentList /></ProtectedRoute>} />\n          <Route path="/school-admin/teachers" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SECRETARY', 'CASHIER']}><SchoolAdminTeachers /></ProtectedRoute>} />`
  );

  fs.writeFileSync('src/App.tsx', content);
}
