import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from './components/ui/primitives';
import AppLayout from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnly } from './components/layout/ProtectedRoute';
const AdminAudit = lazy(() => import('./pages/admin/AuditLogs'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminEmployeeDetail = lazy(() => import('./pages/admin/EmployeeDetail'));
const AdminEmployees = lazy(() => import('./pages/admin/Employees'));
const AdminMonitoring = lazy(() => import('./pages/admin/Monitoring'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminTasks = lazy(() => import('./pages/admin/Tasks'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Login = lazy(() => import('./pages/auth/Login'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'));
const EmployeeTasks = lazy(() => import('./pages/employee/Tasks'));
const EmployeeTimesheet = lazy(() => import('./pages/employee/Timesheet'));
const EmployeeUpdates = lazy(() => import('./pages/employee/Updates'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const ProfilePage = lazy(() => import('./pages/Profile'));

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>}>
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Login portal="employee" />} />
        <Route path="/admin/login" element={<Login portal="admin" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route path="/change-password" element={<ChangePassword />} />

      <Route path="/admin" element={<ProtectedRoute role="admin" />}>
        <Route element={<AppLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="employees/:id" element={<AdminEmployeeDetail />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="monitoring" element={<AdminMonitoring />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/employee" element={<ProtectedRoute role="employee" />}>
        <Route element={<AppLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="updates" element={<EmployeeUpdates />} />
          <Route path="timesheet" element={<EmployeeTimesheet />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
}
