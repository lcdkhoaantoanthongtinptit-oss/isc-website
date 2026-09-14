import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Tag, Skeleton, Row, Col, Space, Divider, message } from 'antd';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  Users,
  Award,
  Calendar,
  Clock,
  Terminal,
  Cpu,
  Layers,
  HeartHandshake,
  Lightbulb,
  TrendingUp,
  Compass,
  Target,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Mail,
  Send,
} from 'lucide-react';
import { activityService } from '../../services/activity.service';
import { memberService } from '../../services/member.service';
import { departmentService } from '../../services/department.service';
import { settingsService } from '../../services/settings.service';
import { Activity, ExecutiveMember, Department, WebsiteSettings } from '../../types';
import dayjs from 'dayjs';
import logoImg from '../../assets/logo.png';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [members, setMembers] = useState<ExecutiveMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  function formatEventDate(dateVal: any): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'object' && 'seconds' in dateVal) {
      return dayjs(dateVal.seconds * 1000).format('DD/MM/YYYY');
    }
    if (typeof dateVal === 'object' && 'toDate' in dateVal && typeof dateVal.toDate === 'function') {
      return dayjs(dateVal.toDate()).format('DD/MM/YYYY');
    }
    const parsed = dayjs(dateVal);
    return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '';
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [settData, actData, memData, deptData] = await Promise.all([
          settingsService.getSettings(),
          activityService.getActivities(true),
          memberService.getMembers(),
          departmentService.getDepartments(),
        ]);
        setSettings(settData);
        // Prioritize featured activities, backfill with newest published activities
        const featured = actData.filter((a) => a.isFeatured);
        const nonFeatured = actData.filter((a) => !a.isFeatured);
        const combined = [...featured, ...nonFeatured];
        setActivities(combined.slice(0, 3));
        setMembers(memData);
        setDepartments(deptData);
      } catch (err) {
        console.error('Error loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const valuesList = [
    {
      title: 'Kết bạn mới',
      icon: <Users size={28} color="#0284c7" />,
      desc:
        settings?.whyJoinNewFriends ||
        'Đến với ISC, giá trị đầu tiên mà sinh viên nhận được là những người bạn mới. Đây là một cộng đồng nhiệt huyết, nơi mọi người cùng chia sẻ niềm quan tâm và đam mê với lĩnh vực An toàn thông tin.',
      color: '#e0f2fe',
    },
    {
      title: 'Kết nối thế hệ',
      icon: <TrendingUp size={28} color="#0d9488" />,
      desc:
        settings?.whyJoinGenerations ||
        'ISC tạo môi trường để sinh viên được trải nghiệm, làm việc và nhận sự hỗ trợ trực tiếp từ các anh chị khóa trên. Đây là cơ hội để học hỏi kinh nghiệm học tập, hoạt động và phát triển bản thân trong môi trường Học viện.',
      color: '#ccfbf1',
    },
    {
      title: 'Học những thứ mới',
      icon: <Lightbulb size={28} color="#f59e0b" />,
      desc:
        settings?.whyJoinNewSkills ||
        'ISC không chỉ là sân chơi hoạt động mà còn hướng đến phát triển học thuật. Sinh viên có cơ hội xây dựng nền tảng lập trình và tiếp cận thực tế với bảo mật thông qua các chương trình như: Training C, Training CTF chuyên sâu.',
      color: '#fef3c7',
    },
    {
      title: 'Bứt phá bản thân',
      icon: <HeartHandshake size={28} color="#e11d48" />,
      desc:
        settings?.whyJoinBreakthrough ||
        'Các buổi seminar chia sẻ định hướng công việc giúp sinh viên có thêm kiến thức thực tế, chuẩn bị hành trang và sẵn sàng tham gia các cuộc thi lớn trong lĩnh vực An toàn thông tin.',
      color: '#ffe4e6',
    },
  ];

  return (
    <div className="cyber-bg-pattern" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Tech Glows */}
      <div className="hero-glow-bg" />
      <div className="hero-glow-left" />

      {/* 1. HERO SECTION */}
      <section style={{ paddingTop: '80px', paddingBottom: '90px', position: 'relative', zIndex: 1 }}>
        <div className="container-custom">
          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
            {/* Official Logo Emblem */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <img
                src={logoImg}
                alt="Logo Liên chi đoàn Khoa An toàn thông tin"
                style={{
                  width: '96px',
                  height: '96px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 24px rgba(2, 132, 199, 0.35))',
                }}
              />
            </div>

            {/* Top Pill */}
            <div style={{ display: 'inline-flex', marginBottom: '24px' }}>
              <div className="cyber-badge">
                <span className="cyber-badge-dot" />
                <span>
                  {settings?.shortName
                    ? `${settings.shortName}`
                    : 'ISC - INFORMATION SECURITY COUNCIL'}
                </span>
              </div>
            </div>

            {/* Main Hero Title */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginBottom: '20px',
                color: '#0f172a',
              }}
            >
              LIÊN CHI ĐOÀN <br />
              <span style={{ color: '#0284c7' }}>KHOA AN TOÀN THÔNG TIN</span>
            </h1>

            {/* Subtitle / Slogan */}
            <p
              style={{
                fontSize: 'clamp(1.15rem, 2.2vw, 1.35rem)',
                color: '#0284c7',
                lineHeight: 1.5,
                marginBottom: '16px',
                fontWeight: 700,
              }}
            >
              {settings?.heroSubtitle ||
                'Kết nối đam mê. Phát triển kỹ năng. Xây dựng cộng đồng An toàn thông tin.'}
            </p>

            {/* Hero Description */}
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: '720px',
                margin: '0 auto 36px',
                fontWeight: 500,
              }}
            >
              {settings?.heroDescription ||
                'Mái nhà chung dành cho sinh viên yêu thích An toàn thông tin, nơi kết nối các thế hệ, phát triển kỹ năng và cùng nhau tạo nên một cộng đồng năng động, đoàn kết.'}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRight size={18} />}
                style={{
                  height: '52px',
                  padding: '0 32px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  background: '#0284c7',
                }}
                onClick={() => {
                  const elem = document.querySelector('#gioi-thieu');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Khám phá ISC
              </Button>

              <Button
                size="large"
                icon={<Mail size={18} color="#0284c7" />}
                style={{
                  height: '52px',
                  padding: '0 32px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  borderColor: '#0284c7',
                  color: '#0284c7',
                  background: 'rgba(255, 255, 255, 0.95)',
                }}
                onClick={() => {
                  const elem = document.querySelector('#lien-he');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Liên hệ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section style={{ padding: '30px 0 70px', position: 'relative', zIndex: 1 }}>
        <div className="container-custom">
          <div
            className="glass-card"
            style={{
              padding: '36px 30px',
              boxShadow: '0 12px 30px -8px rgba(2, 132, 199, 0.12)',
            }}
          >
            <Row gutter={[24, 24]} justify="center">
              <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', fontWeight: 800, color: '#0284c7', lineHeight: 1.1 }}>
                  {settings?.totalStudents || 850}+
                </div>
                <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginTop: '6px' }}>
                  Sinh viên
                </div>
              </Col>
              <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', fontWeight: 800, color: '#0d9488', lineHeight: 1.1 }}>
                  {settings?.totalActivities || 40}+
                </div>
                <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginTop: '6px' }}>
                  Hoạt động đã tổ chức
                </div>
              </Col>
              <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', fontWeight: 800, color: '#3b82f6', lineHeight: 1.1 }}>
                  {settings?.totalCollaborators || 50}+
                </div>
                <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginTop: '6px' }}>
                  Cộng tác viên
                </div>
              </Col>
              <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(2rem, 3.5vw, 2.7rem)', fontWeight: 800, color: '#f59e0b', lineHeight: 1.1 }}>
                  {settings?.activeYears || 10}+
                </div>
                <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, marginTop: '6px' }}>
                  Năm hoạt động
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {/* 3. ABOUT US SECTION */}
      <section id="gioi-thieu" style={{ padding: '70px 0 80px', position: 'relative', zIndex: 1 }}>
        <div className="container-custom">
          <Row gutter={[48, 40]} align="middle">
            <Col xs={24} md={12}>
              <div className="cyber-badge" style={{ marginBottom: '16px' }}>
                <Terminal size={15} />
                <span>GIỚI THIỆU LIÊN CHI ĐOÀN</span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                  fontWeight: 800,
                  marginBottom: '16px',
                  color: '#0f172a',
                  lineHeight: 1.25,
                }}
              >
                Mái nhà chung của sinh viên đam mê An toàn thông tin
              </h2>
              <p style={{ color: '#475569', fontSize: '1.02rem', lineHeight: 1.7, marginBottom: '24px' }}>
                {settings?.aboutDescription ||
                  'Liên chi đoàn Khoa An toàn thông tin (ISC - Information Security Council) được thành lập năm 2025, đánh dấu bước ngoặt khi tách ra từ Liên chi CNTT 1. ISC hướng tới trở thành một tổ chức Đoàn Thanh niên tiên phong, một mái nhà chung dành cho những sinh viên có niềm đam mê với ngành An toàn thông tin.'}
              </p>

              {/* Vision & Mission Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '20px 22px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Compass size={18} color="#0284c7" />
                    </div>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>TẦM NHÌN</span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
                    {settings?.vision ||
                      'Trở thành tổ chức thanh niên tiên phong trong lĩnh vực An toàn thông tin, là cầu nối gắn kết sinh viên và lan tỏa tinh thần học hỏi, sáng tạo.'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '20px 22px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#ccfbf1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Target size={18} color="#0d9488" />
                    </div>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>SỨ MỆNH</span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
                    {settings?.mission ||
                      'Đồng hành cùng sinh viên trong học tập, phát triển kỹ năng, nuôi dưỡng đam mê và xây dựng cộng đồng An toàn thông tin năng động, đoàn kết.'}
                  </p>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px -15px rgba(2, 132, 199, 0.25)',
                  border: 'none',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80"
                  alt="Liên chi đoàn Khoa ATTT"
                  style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#0f172a',
                    padding: '24px',
                    color: '#ffffff',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ISC - INFORMATION SECURITY COUNCIL
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                    Tiên phong rèn luyện bản lĩnh an ninh mạng
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 4. MISSION & VALUES SECTION (VÌ SAO NÊN THAM GIA ISC) */}
      <section style={{ padding: '70px 0 85px', backgroundColor: '#f8fafc', position: 'relative' }}>
        <div className="container-custom">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
            <div className="cyber-badge" style={{ marginBottom: '14px' }}>
              <Sparkles size={15} />
              <span>GIÁ TRỊ CỐT LÕI</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
              Vì sao nên tham gia ISC?
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>
              Môi trường lý tưởng để kết bạn, học hỏi kinh nghiệm từ các thế hệ và bứt phá kỹ năng an toàn thông tin
            </p>
          </div>

          <Row gutter={[24, 24]}>
            {valuesList.map((val) => (
              <Col xs={24} sm={12} lg={6} key={val.title}>
                <div
                  className="glass-card"
                  style={{
                    padding: '32px 24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ffffff',
                    border: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      backgroundColor: val.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    {val.icon}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                    {val.title}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                    {val.desc}
                  </p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 5. FEATURED ACTIVITIES SECTION */}
      <section id="hoat-dong" style={{ padding: '80px 0', position: 'relative' }}>
        <div className="container-custom">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <div>
              <div className="cyber-badge" style={{ marginBottom: '12px' }}>
                <Calendar size={15} />
                <span>PHONG TRÀO & SỰ KIỆN</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0f172a' }}>
                Hoạt động nổi bật
              </h2>
            </div>
            <Link to="/hoat-dong">
              <Button type="link" style={{ fontWeight: 700, fontSize: '1rem', color: '#0284c7', padding: 0 }}>
                Xem tất cả hoạt động <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </Button>
            </Link>
          </div>

          {loading ? (
            <Row gutter={[24, 24]}>
              {[1, 2, 3].map((i) => (
                <Col xs={24} md={8} key={i}>
                  <Card loading style={{ borderRadius: '16px' }} />
                </Col>
              ))}
            </Row>
          ) : activities.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
              }}
            >
              <Calendar size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Đang cập nhật các hoạt động mới
              </h3>
              <p style={{ color: '#64748b', maxWidth: '460px', margin: '0 auto 20px' }}>
                Các phong trào, hội thảo học thuật và giải đấu CTF của Liên chi đoàn Khoa ATTT sẽ được đăng tải sớm nhất.
              </p>
              <Link to="/hoat-dong">
                <Button type="primary" style={{ fontWeight: 600 }}>
                  Xem danh mục sự kiện
                </Button>
              </Link>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {activities.map((act) => (
                <Col xs={24} md={8} key={act.id}>
                  <div
                    className="glass-card"
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                    }}
                  >
                    <div style={{ position: 'relative', height: '210px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                      <img
                        src={
                          act.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
                        }
                        alt={act.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                        <Tag color="blue" style={{ fontWeight: 600, borderRadius: '4px' }}>
                          {act.category}
                        </Tag>
                        {act.isFeatured && (
                          <Tag color="orange" style={{ fontWeight: 600, borderRadius: '4px' }}>
                            Nổi bật
                          </Tag>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#64748b',
                          fontSize: '0.85rem',
                          marginBottom: '10px',
                        }}
                      >
                        <Clock size={14} />
                        <span>{formatEventDate(act.eventDate)}</span>
                      </div>
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          lineHeight: 1.4,
                          marginBottom: '10px',
                          color: '#0f172a',
                        }}
                      >
                        {act.title}
                      </h3>
                      <p
                        style={{
                          color: '#64748b',
                          fontSize: '0.9rem',
                          lineHeight: 1.6,
                          marginBottom: '20px',
                          flex: 1,
                        }}
                      >
                        {act.shortDescription}
                      </p>
                      <Link to={`/hoat-dong/${act.slug || act.id}`}>
                        <Button
                          type="default"
                          block
                          style={{
                            fontWeight: 600,
                            color: '#0284c7',
                            borderColor: '#bae6fd',
                            backgroundColor: '#f0f9ff',
                          }}
                        >
                          Xem chi tiết <ChevronRight size={15} style={{ display: 'inline' }} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* 6. EXECUTIVE BOARD SECTION */}
      <section id="ban-chap-hanh" style={{ padding: '80px 0', backgroundColor: '#f8fafc', position: 'relative' }}>
        <div className="container-custom">
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 50px' }}>
            <div className="cyber-badge" style={{ marginBottom: '14px' }}>
              <Award size={15} />
              <span>CƠ CẤU TỔ CHỨC</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Ban Chấp hành nhiệm kỳ 2026 - 2027
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>
              Đội ngũ cán bộ Đoàn nhiệt huyết, trách nhiệm, định hướng chiến lược và đại diện cho đoàn viên sinh viên Khoa ATTT
            </p>
          </div>

          <Row gutter={[24, 24]} justify="center">
            {members.map((mem) => (
              <Col xs={24} sm={12} md={8} lg={6} key={mem.id}>
                <div
                  className="glass-card"
                  style={{
                    padding: '28px 20px',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    height: '100%',
                    border: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      padding: '4px',
                      background: '#0284c7',
                      boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)',
                    }}
                  >
                    <img
                      src={mem.avatarUrl}
                      alt={mem.fullName}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  {/* Member Name & Cohort */}
                  {(() => {
                    let displayName = mem.fullName;
                    let displayCohort = mem.cohort;
                    if (!displayCohort && displayName.includes(' - ')) {
                      const parts = displayName.split(' - ');
                      displayName = parts[0].trim();
                      displayCohort = parts[1].trim();
                    }
                    return (
                      <>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
                          {displayName}
                        </h4>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {displayCohort && (
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#0284c7',
                                backgroundColor: '#f0f9ff',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px solid #bae6fd',
                              }}
                            >
                              Khóa {displayCohort}
                            </span>
                          )}
                          {mem.className && (
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                              {mem.className}
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
                  <div style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px' }}>
                    {mem.position}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500, marginBottom: '14px' }}>
                    {mem.term}
                  </div>
                  {mem.email && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      <Mail size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {mem.email}
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* 7. RECRUITMENT CALL TO ACTION & DEPARTMENTS */}
      <section id="tuyen-ctv" style={{ padding: '90px 0', position: 'relative' }}>
        <div className="container-custom">
          <div
            style={{
              background: '#0f172a',
              borderRadius: '24px',
              padding: '60px 40px',
              color: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '9999px',
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '20px',
                }}
              >
                <Sparkles size={16} />
                <span>{settings?.recruitmentPeriod || 'TUYỂN THÀNH VIÊN GEN 2.0 (23/08 - 10/09)'}</span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: '10px',
                  lineHeight: 1.2,
                }}
              >
                {settings?.recruitmentTitle || 'Gia nhập ISC'}
              </h2>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#38bdf8',
                  marginBottom: '16px',
                }}
              >
                {settings?.recruitmentSubtitle || 'Trở thành một phần của Liên chi đoàn Khoa An toàn thông tin'}
              </div>
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  marginBottom: '36px',
                }}
              >
                {settings?.recruitmentDescription ||
                  'Tham gia ISC để kết nối với những người bạn có chung đam mê, học hỏi từ các anh chị khóa trên, phát triển kỹ năng và trải nghiệm các hoạt động học thuật, sự kiện và phong trào sinh viên.'}
              </p>

              {/* Departments Badges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '40px',
                }}
              >
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    style={{
                      padding: '8px 18px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#e2e8f0',
                    }}
                  >
                    {dept.name}
                  </div>
                ))}
              </div>

              {/* Action Buttons - Chỉ để nút tra cứu theo yêu cầu */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Link to="/tra-cuu-ctv">
                  <Button
                    type="primary"
                    size="large"
                    icon={<Search size={18} />}
                    style={{
                      height: '52px',
                      padding: '0 36px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      background: '#0284c7',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(2, 132, 199, 0.3)',
                    }}
                  >
                    Tra cứu kết quả CTV
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CONTACT SECTION */}
      <section id="lien-he" style={{ padding: '70px 0 90px', backgroundColor: '#f8fafc' }}>
        <div className="container-custom">
          <Row gutter={[40, 40]}>
            <Col xs={24} md={12}>
              <div className="cyber-badge" style={{ marginBottom: '14px' }}>
                <Mail size={15} />
                <span>LIÊN HỆ TRỰC TIẾP</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                Chúng tôi luôn lắng nghe bạn
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '28px' }}>
                Mọi thắc mắc về tuyển dụng CTV, đóng góp ý kiến cho các hoạt động hoặc liên hệ hợp tác học thuật xin vui lòng gửi thông tin cho chúng tôi.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>EMAIL</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{settings?.email || 'lcd.antoanthongtin@gmail.com'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>FANPAGE FACEBOOK</div>
                    <a href={settings?.facebook || 'https://facebook.com'} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: '#0284c7', textDecoration: 'none' }}>
                      Liên chi đoàn Khoa An toàn thông tin <ExternalLink size={12} style={{ display: 'inline' }} />
                    </a>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="glass-card" style={{ padding: '36px 30px', backgroundColor: '#ffffff' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a' }}>
                  Gửi lời nhắn nhanh
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    message.success('Cảm ơn bạn! Lời nhắn của bạn đã được gửi tới Ban Chấp hành.');
                    (e.target as HTMLFormElement).reset();
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Họ và tên
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Email hoặc SĐT
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="email@domain.com"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Nội dung lời nhắn
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Bạn muốn trao đổi điều gì với LCĐ..."
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<Send size={16} />}
                    style={{ background: '#0284c7', fontWeight: 700, marginTop: '4px' }}
                  >
                    Gửi lời nhắn
                  </Button>
                </form>
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};
