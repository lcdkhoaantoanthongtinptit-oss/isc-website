import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Space, message, Drawer } from 'antd';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Award,
  Settings,
  LogOut,
  ShieldCheck,
  Menu as MenuIcon,
  ExternalLink,
  ChevronDown,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react';
import { authService, hasPathPermission, ROLE_PERMISSIONS } from '../services/auth.service';
import { AdminUser } from '../types';
import logoImg from '../assets/logo.png';

const { Header, Sider, Content } = Layout;

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      message.success('Đã đăng xuất khỏi trang Quản trị.');
      navigate('/admin/login');
    } catch (err) {
      message.error('Lỗi khi đăng xuất.');
    }
  };

  // Base navigation items
  const allMenuItems = [
    {
      key: '/admin/dashboard',
      icon: <LayoutDashboard size={18} />,
      label: 'Tổng quan',
    },
    {
      key: '/admin/interview',
      icon: <ClipboardCheck size={18} />,
      label: 'Phỏng vấn CTV',
    },
    {
      key: '/admin/collaborators',
      icon: <Users size={18} />,
      label: 'Quản lý CTV',
    },
    {
      key: '/admin/activities',
      icon: <Calendar size={18} />,
      label: 'Hoạt động & Sự kiện',
    },
    {
      key: '/admin/executive-members',
      icon: <Award size={18} />,
      label: 'Ban Chấp hành',
    },
    {
      key: '/admin/accounts',
      icon: <UserCheck size={18} />,
      label: 'Quản lý Tài khoản',
    },
    {
      key: '/admin/settings',
      icon: <Settings size={18} />,
      label: 'Cài đặt',
    },
  ];

  // Filter menu items by user permissions
  const visibleMenuItems = allMenuItems.filter((item) => hasPathPermission(currentUser, item.key));

  const handleMenuClick = ({ key }: { key: string }) => {
    setMobileDrawer(false);
    navigate(key);
  };

  const userDropdownItems = [
    {
      key: 'public-site',
      label: (
        <Link to="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExternalLink size={15} /> Xem trang chủ công khai
        </Link>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      danger: true,
      label: (
        <span onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={15} /> Đăng xuất
        </span>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Desktop Fixed Sider (Sticky top 0 so it never drifts on scroll) */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        breakpoint="lg"
        collapsedWidth={80}
        theme="light"
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto',
          background: '#ffffff',
          boxShadow: '1px 0 3px rgba(0, 0, 0, 0.03)',
          borderRight: '1px solid #e2e8f0',
          zIndex: 101,
        }}
        className="admin-sider-desktop"
      >
        {/* Brand Logo in Sider */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            gap: '12px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <img
            src={logoImg}
            alt="Logo LCĐ ATTT"
            style={{
              width: '36px',
              height: '36px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                LCĐ ATTT
              </div>
              <div style={{ color: '#0284c7', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                CỔNG QUẢN TRỊ
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu filtered by permission */}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleMenuItems}
          onClick={handleMenuClick}
          style={{ background: '#ffffff', marginTop: '12px', fontSize: '0.92rem', borderRight: 'none' }}
        />
      </Sider>

      {/* Main Layout Area */}
      <Layout style={{ background: '#f8fafc', minWidth: 0, overflowX: 'hidden' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e2e8f0',
            height: '64px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Mobile drawer toggle & current page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Button
              type="text"
              icon={<MenuIcon size={20} />}
              onClick={() => setMobileDrawer(true)}
              className="admin-mobile-toggle"
              style={{ display: 'none' }}
            />
            <style>{`
              @media (max-width: 991px) {
                .admin-mobile-toggle { display: inline-flex !important; }
                .admin-sider-desktop { display: none !important; }
              }
            `}</style>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
              {visibleMenuItems.find((m) => m.key === location.pathname)?.label || 'Quản trị hệ thống'}
            </span>
          </div>

          {/* User profile dropdown & view public site */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/" target="_blank" style={{ display: 'none' }} className="view-site-link">
              <style>{`
                @media (min-width: 600px) {
                  .view-site-link { display: inline-flex !important; align-items: center; gap: 6px; color: #0284c7; font-weight: 600; font-size: 0.88rem; text-decoration: none; }
                }
              `}</style>
              <ExternalLink size={15} /> Xem Website
            </Link>

            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}>
                <Avatar style={{ backgroundColor: '#0284c7', fontWeight: 700 }}>
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'A'}
                </Avatar>
                <div style={{ display: 'none' }} className="admin-name">
                  <style>{`
                    @media (min-width: 600px) {
                      .admin-name { display: block !important; line-height: 1.2; text-align: left; }
                    }
                  `}</style>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{currentUser?.displayName || 'Cán bộ LCĐ'}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          currentUser?.role === 'admin' || currentUser?.role === 'secretary'
                            ? '#e0f2fe'
                            : currentUser?.role === 'deputy_secretary'
                            ? '#ede9fe'
                            : currentUser?.role === 'lead' || currentUser?.role === 'deputy_lead'
                            ? '#f3e8ff'
                            : '#dcfce7',
                        color:
                          currentUser?.role === 'admin' || currentUser?.role === 'secretary'
                            ? '#0369a1'
                            : currentUser?.role === 'deputy_secretary'
                            ? '#6d28d9'
                            : currentUser?.role === 'lead' || currentUser?.role === 'deputy_lead'
                            ? '#7e22ce'
                            : '#15803d',
                      }}
                    >
                      {currentUser?.role === 'admin'
                        ? 'Super Admin'
                        : currentUser?.role === 'secretary'
                        ? 'Bí thư LCĐ'
                        : currentUser?.role === 'deputy_secretary'
                        ? 'Phó Bí thư'
                        : currentUser?.role === 'lead'
                        ? 'Trưởng ban'
                        : currentUser?.role === 'deputy_lead'
                        ? 'Phó ban'
                        : currentUser?.role === 'interviewer'
                        ? 'Cán bộ Phỏng vấn'
                        : currentUser?.role === 'recruiter'
                        ? 'Ban Tuyển CTV'
                        : 'Ban Truyền Thông'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {currentUser?.email || 'admin@lcdattt.edu.vn'}
                  </div>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* Mobile Navigation Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={logoImg} alt="Logo LCĐ ATTT" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              <span style={{ fontWeight: 700 }}>Menu Quản Trị</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileDrawer(false)}
          open={mobileDrawer}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={visibleMenuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
          <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
            <Button danger block icon={<LogOut size={16} />} onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </Drawer>

        {/* Content Body */}
        <Content
          style={{
            margin: '24px',
            minHeight: 280,
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
