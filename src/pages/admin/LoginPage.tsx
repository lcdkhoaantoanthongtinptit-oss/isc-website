import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, message, Alert, Typography } from 'antd';
import { ArrowLeft, Lock, Mail, ShieldCheck, KeyRound, Info } from 'lucide-react';
import { authService, ROLE_PERMISSIONS } from '../../services/auth.service';
import logoImg from '../../assets/logo.png';

const { Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    async function checkExisting() {
      const user = await authService.getCurrentUser();
      if (user) {
        const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      }
    }
    checkExisting();
  }, [navigate, location]);

  const handleLogin = async (values: { email: string; pass: string }) => {
    try {
      setLoading(true);
      const user = await authService.login(values.email, values.pass);
      message.success(`Đăng nhập thành công! Quyền hạn: ${ROLE_PERMISSIONS[user.role]?.label || user.role}`);
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      message.error(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    form.setFieldsValue({ email, pass });
  };

  return (
    <div
      className="cyber-bg-pattern"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 20px',
        position: 'relative',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* Back to public website */}
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#0284c7',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.9rem',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <ArrowLeft size={16} /> Quay về Trang chủ
        </Link>
      </div>

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src={logoImg}
            alt="Logo LCĐ Khoa ATTT"
            style={{
              width: '76px',
              height: '76px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 16px rgba(2, 132, 199, 0.25))',
              marginBottom: '12px',
            }}
          />
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Hệ Thống Quản Trị
          </h2>
          <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.95rem' }}>
            Liên chi đoàn Khoa An toàn thông tin
          </div>
        </div>

        {/* Login Card */}
        <div
          className="glass-card"
          style={{
            padding: '32px 28px',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08)',
            border: 'none',
            borderRadius: '18px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                marginBottom: '10px',
              }}
            >
              <KeyRound size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
              Đăng Nhập
            </h3>

          </div>


          {/* Email & Password Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<span style={{ fontWeight: 600, color: '#334155' }}>Email Cán bộ </span>}
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' },
              ]}
            >
              <Input
                size="large"
                prefix={<Mail size={18} color="#94a3b8" style={{ marginRight: '6px' }} />}
                placeholder="Ví dụ: admin@lcdattt.edu.vn"
                style={{ height: '46px', borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="pass"
              label={<span style={{ fontWeight: 600, color: '#334155' }}>Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                size="large"
                prefix={<Lock size={18} color="#94a3b8" style={{ marginRight: '6px' }} />}
                placeholder="Nhập mật khẩu được cấp"
                style={{ height: '46px', borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '24px', marginBottom: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                icon={<ShieldCheck size={18} />}
                style={{
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: '#0284c7',
                  border: 'none',
                }}
              >
                Đăng nhập hệ thống
              </Button>
            </Form.Item>
          </Form>

        </div>
      </div>
    </div>
  );
};
