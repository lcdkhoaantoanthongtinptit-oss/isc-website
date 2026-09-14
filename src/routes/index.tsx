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
import { CollaboratorsPage } from '../pages/admin/CollaboratorsPage';
import { ActivitiesAdminPage } from '../pages/admin/ActivitiesAdminPage';
import { ExecutiveMembersPage } from '../pages/admin/ExecutiveMembersPage';
import { SettingsPage } from '../pages/admin/SettingsPage';

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
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="collaborators" element={<CollaboratorsPage />} />
          <Route path="activities" element={<ActivitiesAdminPage />} />
          <Route path="executive-members" element={<ExecutiveMembersPage />} />
          {/* Tạm thời ẩn chức năng Quản lý nội dung website theo yêu cầu */}
          <Route path="settings" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      {/* 4. Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
