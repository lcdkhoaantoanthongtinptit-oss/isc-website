import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Layout & Pages
import { PublicLayout } from '../layouts/PublicLayout';
import { LookupLayout } from '../layouts/LookupLayout';
import { HomePage } from '../pages/public/HomePage';
import { CheckResultPage } from '../pages/public/CheckResultPage';
import { ActivitiesPage } from '../pages/public/ActivitiesPage';
import { ActivityDetailPage } from '../pages/public/ActivityDetailPage';

// Admin Layout & Pages
import { LoginPage } from '../pages/admin/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { InterviewSearchPage } from '../pages/admin/InterviewSearchPage';
import { CollaboratorsPage } from '../pages/admin/CollaboratorsPage';
import { ActivitiesAdminPage } from '../pages/admin/ActivitiesAdminPage';
import { ExecutiveMembersPage } from '../pages/admin/ExecutiveMembersPage';
import { AccountsAdminPage } from '../pages/admin/AccountsAdminPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { ProfileAdminPage } from '../pages/admin/ProfileAdminPage';
import { authService, hasPathPermission, ROLE_PERMISSIONS } from '../services/auth.service';

const AdminIndexRedirect: React.FC = () => {
  const [target, setTarget] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function check() {
      const user = await authService.getCurrentUser();
      if (!user) {
        setTarget('/admin/login');
        return;
      }
      if (hasPathPermission(user, '/admin/dashboard')) {
        setTarget('/admin/dashboard');
        return;
      }
      const allowed = user.permissions || ROLE_PERMISSIONS[user.role]?.allowedPaths || [];
      const firstAllowed =
        allowed.find((p) => hasPathPermission(user, p)) ||
        (user.role === 'interviewer' ? '/admin/interview' : '/admin/collaborators');
      setTarget(firstAllowed);
    }
    check();
  }, []);

  if (!target) return null;
  return <Navigate to={target} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Dedicated Standalone Lookup Route (No Header) */}
      <Route element={<LookupLayout />}>
        <Route path="/tra-cuu-ctv" element={<CheckResultPage />} />
      </Route>

      {/* 2. Main Public Routes (With Header & Footer) */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="hoat-dong" element={<ActivitiesPage />} />
        <Route path="hoat-dong/:slug" element={<ActivityDetailPage />} />
      </Route>

      {/* 2. Admin Authentication Route */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* 3. Protected Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminIndexRedirect />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="interview" element={<InterviewSearchPage />} />
          <Route path="collaborators" element={<CollaboratorsPage />} />
          <Route path="activities" element={<ActivitiesAdminPage />} />
          <Route path="executive-members" element={<ExecutiveMembersPage />} />
          {/* Quản lý tài khoản cán bộ */}
          <Route path="accounts" element={<AccountsAdminPage />} />
          {/* Cài đặt website & Công khai kết quả */}
          <Route path="settings" element={<SettingsPage />} />
          {/* Hồ sơ cá nhân (Bí thư, Phó bí thư, Trưởng ban, Phó ban, Admin) */}
          <Route path="profile" element={<ProfileAdminPage />} />
        </Route>
      </Route>

      {/* 4. Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
