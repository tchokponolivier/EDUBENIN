import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('DirectorDashboard')) {
  content = content.replace(
    "import { TeacherDashboard } from './pages/TeacherDashboard';",
    "import { TeacherDashboard } from './pages/TeacherDashboard';\nimport { DirectorDashboard } from './pages/DirectorDashboard';"
  );

  content = content.replace(
    '<Route path="/teacher" element={<ProtectedRoute allowedRoles={[\'TEACHER\']}><TeacherDashboard /></ProtectedRoute>} />',
    '<Route path="/teacher" element={<ProtectedRoute allowedRoles={[\'TEACHER\']}><TeacherDashboard /></ProtectedRoute>} />\n          <Route path="/director" element={<ProtectedRoute allowedRoles={[\'DIRECTOR_OF_STUDIES\']}><DirectorDashboard /></ProtectedRoute>} />'
  );

  fs.writeFileSync('src/App.tsx', content);
}
