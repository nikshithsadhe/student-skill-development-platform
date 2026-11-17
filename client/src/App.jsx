import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Landing from './pages/auth/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminSignup from './pages/auth/AdminSignup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ModulesList from './pages/student/ModulesList';
import ModuleDetail from './pages/student/ModuleDetail';
import AssessmentsList from './pages/student/AssessmentsList';
import AssessmentTake from './pages/student/AssessmentTake';
import AssessmentResults from './pages/student/AssessmentResults';
import MockInterview from './pages/student/MockInterview';
import LearningPath from './pages/student/LearningPath';
import ProgressPage from './pages/student/ProgressPage';
import Achievements from './pages/student/Achievements';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import FacultyAssignments from './pages/admin/FacultyAssignments';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import AuditLogs from './pages/admin/AuditLogs';
import PlatformSettings from './pages/admin/PlatformSettings';
import ModuleManage from './pages/faculty/ModuleManage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#081E15',
              color: '#E5E7EB',
              border: '1px solid #164E37',
              fontSize: '13px',
              borderRadius: '10px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#081E15',
              },
            },
            error: {
              iconTheme: {
                primary: '#F43F5E',
                secondary: '#081E15',
              },
            },
          }}
        />

        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-signup" element={<AdminSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Student Routes (Protected, Nested inside DashboardLayout) */}
          <Route
            path="/student"
            element={
              <RoleRoute allowedRoles={['student']}>
                <DashboardLayout title="Student Skill Workspace" />
              </RoleRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="modules" element={<ModulesList />} />
            <Route path="modules/:id" element={<ModuleDetail />} />
            <Route path="assessments" element={<AssessmentsList />} />
            <Route path="assessments/:id/take" element={<AssessmentTake />} />
            <Route path="assessments/:id/results" element={<AssessmentResults />} />
            <Route path="interviews" element={<MockInterview />} />
            <Route path="learning-path" element={<LearningPath />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="achievements" element={<Achievements />} />
          </Route>

          {/* Admin Routes (Protected, Nested inside DashboardLayout) */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <DashboardLayout title="Platform Administration" />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="assignments" element={<FacultyAssignments />} />
            <Route path="modules" element={<ModuleManage />} />
            <Route path="analytics" element={<PlatformAnalytics />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-6xl font-black text-primary mb-2">404</h1>
                <p className="text-xl font-bold text-text-heading mb-2">Page Not Found</p>
                <p className="text-sm text-text-muted mb-6">
                  The requested page does not exist or has been relocated.
                </p>
                <a
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-all"
                >
                  Return Home
                </a>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
