import React from 'react';
import { Outlet } from 'react-router-dom';

export const LookupLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Standalone layout without header for Tra cứu thành viên */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Clean Minimalist Footer */}
      <footer
        style={{
          background: '#0f172a',
          color: '#94a3b8',
          padding: '24px 0',
          textAlign: 'center',
          fontSize: '0.85rem',
          borderTop: '1px solid #1e293b',
        }}
      >
        <div className="container-custom">
          <p style={{ margin: 0, color: '#94a3b8' }}>
            © {new Date().getFullYear()} Liên chi đoàn Khoa An toàn thông tin (ISC) • Học viện Công nghệ Bưu chính Viễn thông
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            Hệ thống tra cứu kết quả ứng tuyển Cộng tác viên chính thức
          </p>
        </div>
      </footer>
    </div>
  );
};
