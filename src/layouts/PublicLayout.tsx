import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Space } from 'antd';
import { MenuOutlined, SearchOutlined } from '@ant-design/icons';
import {
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Giới thiệu', path: '/#gioi-thieu' },
    { label: 'Hoạt động', path: '/hoat-dong' },
    { label: 'Ban Chấp hành', path: '/#ban-chap-hanh' },
    { label: 'Tuyển CTV', path: '/#tuyen-ctv' },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate(path);
      } else {
        const hash = path.replace('/', '');
        const elem = document.querySelector(hash);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(path);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Banner Notice (Cyber Blue theme) */}
      <div
        style={{
          background: '#0284c7',
          color: '#ffffff',
          fontSize: '0.8rem',
          padding: '6px 0',
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: '0.03em',
        }}
      >
        <div className="container-custom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} color="#38bdf8" />
            <span>Cổng thông tin chính thức — Liên chi đoàn Khoa An toàn thông tin (ISC)</span>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <header
        className="glass-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          transition: 'all 0.3s ease',
        }}
      >
        <div
          className="container-custom"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '74px',
          }}
        >
          {/* Logo & Brand */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <img
              src={logoImg}
              alt="Logo LCĐ Khoa ATTT"
              style={{
                width: '46px',
                height: '46px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(2, 132, 199, 0.25))',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  lineHeight: 1.15,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                LCĐ KHOA ATTT
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#0284c7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                ISC - Information Security Council
              </div>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'none' }} className="desktop-nav">
            <style>{`
              @media (min-width: 900px) {
                .desktop-nav { display: flex !important; align-items: center; gap: 24px; }
                .mobile-toggle { display: none !important; }
              }
            `}</style>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#334155',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'color 0.2s, background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0284c7';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#334155';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.label}
              </button>
            ))}

            {/* Contact CTA button */}
            <Button
              type="primary"
              size="large"
              style={{
                background: '#0284c7',
                fontWeight: 700,
                padding: '0 20px',
              }}
              onClick={() => handleNavClick('/#lien-he')}
            >
              Liên hệ
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="mobile-toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="primary"
              size="middle"
              style={{ background: '#0284c7', fontWeight: 600 }}
              onClick={() => handleNavClick('/#lien-he')}
            >
              Liên hệ
            </Button>
            <Button
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ borderColor: '#cbd5e1' }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoImg} alt="Logo LCĐ ATTT" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Menu Điều Hướng</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { padding: '16px' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navItems.map((item) => (
            <Button
              key={item.label}
              type="text"
              block
              style={{
                textAlign: 'left',
                height: '44px',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1e293b',
              }}
              onClick={() => handleNavClick(item.path)}
            >
              {item.label}
            </Button>
          ))}
          <div style={{ margin: '16px 0 8px', borderTop: '1px solid #e2e8f0' }} />
          <Button
            type="primary"
            block
            size="large"
            style={{ background: '#0284c7', fontWeight: 700 }}
            onClick={() => {
              setMobileMenuOpen(false);
              handleNavClick('/#lien-he');
            }}
          >
            Liên hệ ngay
          </Button>

        </div>
      </Drawer>

      {/* Main Page Body */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#0b1329',
          color: '#cbd5e1',
          paddingTop: '60px',
          paddingBottom: '30px',
          borderTop: '1px solid #1e293b',
          position: 'relative',
        }}
      >
        <div className="container-custom">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '40px',
              marginBottom: '40px',
            }}
          >
            {/* Col 1: About */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <img
                  src={logoImg}
                  alt="Logo LCĐ Khoa ATTT"
                  style={{
                    width: '46px',
                    height: '46px',
                    objectFit: 'contain',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '4px',
                  }}
                />
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '1rem', margin: 0, fontWeight: 800 }}>
                    LIÊN CHI ĐOÀN
                  </h4>
                  <div style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                    KHOA AN TOÀN THÔNG TIN
                  </div>
                </div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Tổ chức Đoàn tiên phong trong rèn luyện chuyên môn an ninh mạng, bản lĩnh chính trị và tinh thần cống hiến vì cộng đồng cho sinh viên Khoa ATTT.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '18px', fontWeight: 700 }}>
                Liên kết nhanh
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                <li>
                  <Link to="/#gioi-thieu" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link to="/hoat-dong" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                    Hoạt động & Sự kiện
                  </Link>
                </li>
                <li>
                  <Link to="/tra-cuu-ctv" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
                    Tra cứu kết quả CTV 2026
                  </Link>
                </li>
                <li>
                  <Link to="/#tuyen-ctv" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                    Các Ban Chuyên môn
                  </Link>
                </li>

              </ul>
            </div>

            {/* Col 3: Contact */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', marginBottom: '18px', fontWeight: 700 }}>
                Thông tin liên hệ
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={18} color="#38bdf8" style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span>Học viên Công nghệ Bưu chính Viễn thông, 96A, Trần Phú, Hà Đông, Hà Nội </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <span>lcdkhoaantoanthongtinptit@gmail.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <span>038 800 7519</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #1e293b',
              paddingTop: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            <div>
              © 2026 Liên chi đoàn Khoa An toàn thông tin. Bản quyền thuộc về LCĐ ATTT.
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
};
