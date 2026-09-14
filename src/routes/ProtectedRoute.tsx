import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { authService, hasPathPermission, ROLE_PERMISSIONS } from '../services/auth.service';
import { AdminUser } from '../types';

export const ProtectedRoute: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Auth verification error:', err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [location.pathname]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#64748b', fontWeight: 600 }}>
            Đang xác thực quyền Quản trị viên (Admin Token)...
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to /admin/login
  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check specific path permission for the user's role
  const isAllowed = hasPathPermission(currentUser, location.pathname);

  if (!isAllowed) {
    const roleInfo = ROLE_PERMISSIONS[currentUser.role]?.label || currentUser.role;
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <Result
          status="403"
          title="403 - Quyền truy cập bị từ chối"
          subTitle={`Tài khoản của bạn (${currentUser.email} • Phân quyền: ${roleInfo}) không có quyền truy cập vào chức năng này.`}
          extra={[
            <Button
              key="dashboard"
              type="primary"
              onClick={() => (window.location.href = '/admin/dashboard')}
              style={{ background: '#0284c7' }}
            >
              Quay về Trang Tổng quan
            </Button>,
            <Button
              key="switch"
              onClick={async () => {
                await authService.logout();
                window.location.href = '/admin/login';
              }}
            >
              Đăng nhập tài khoản khác
            </Button>,
          ]}
        />
      </div>
    );
  }

  return <Outlet />;
};
