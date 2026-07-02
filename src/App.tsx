/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { LoginPage } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';

import { SchoolAdminDashboard } from './pages/SchoolAdmin';
import { SchoolAdminPayments } from './pages/SchoolAdminPayments';
import { SchoolAdminStudents } from './pages/SchoolAdminStudents';
import { SchoolAdminStats } from './pages/SchoolAdminStats';
import { ParentDashboard } from './pages/Parent';
import { ParentPayments } from './pages/ParentPayments';
import { ParentSupport } from './pages/ParentSupport';
import { ParentProspectus } from './pages/ParentProspectus';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherProfile } from './pages/TeacherProfile';

// Role-based Dashboards (Placeholders for SuperAdmin and Teacher for now)
const SuperAdminDashboard = () => <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100"><h2 className="text-2xl font-bold text-gray-900 mb-4">Espace Super Admin</h2><p>Gestion des établissements...</p></div>;

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/super-admin" replace />;
    case 'SCHOOL_ADMIN': return <Navigate to="/school-admin" replace />;
    case 'SECRETARY': return <Navigate to="/school-admin/students" replace />;
    case 'PARENT': return <Navigate to="/parent" replace />;
    case 'TEACHER': return <Navigate to="/teacher" replace />;
    default: return <Navigate to="/" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<RoleRouter />} />
          
          <Route path="/super-admin/*" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/school-admin" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}><SchoolAdminDashboard /></ProtectedRoute>} />
          <Route path="/school-admin/payments" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SECRETARY']}><SchoolAdminPayments /></ProtectedRoute>} />
          <Route path="/school-admin/students" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'SECRETARY']}><SchoolAdminStudents /></ProtectedRoute>} />
          <Route path="/school-admin/stats" element={<ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}><SchoolAdminStats /></ProtectedRoute>} />
          
          <Route path="/parent" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentDashboard /></ProtectedRoute>} />
          <Route path="/parent/payments" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentPayments /></ProtectedRoute>} />
          <Route path="/parent/prospectus" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentProspectus /></ProtectedRoute>} />
          <Route path="/parent/support" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentSupport /></ProtectedRoute>} />
          
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherProfile /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
