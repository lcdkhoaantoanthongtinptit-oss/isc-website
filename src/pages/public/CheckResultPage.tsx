import React, { useState } from 'react';
import { Input, Button, Modal, Tag, Space, Typography } from 'antd';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
  ArrowLeft,
  UserCheck,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { collaboratorService } from '../../services/collaborator.service';
import { PublicCollaboratorResult } from '../../types';
import logoImg from '../../assets/logo.png';

const { Title, Text, Paragraph } = Typography;

export const CheckResultPage: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicCollaboratorResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const triggerConfetti = () => {
    // Elegant dual celebration confetti with high zIndex to appear in front of Modal
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#0284c7', '#38bdf8', '#10b981', '#f59e0b', '#6366f1', '#ec4899'],
        zIndex: 100005,
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.6 },
          zIndex: 100005,
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.6 },
          zIndex: 100005,
        });
      }, 200);
    } catch (e) {
      console.log('Confetti trigger skipped');
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = studentId.trim().toUpperCase();
    if (!cleanId) return;

    try {
      setLoading(true);
      const res = await collaboratorService.checkCollaboratorResult(cleanId);

      // Check if result lookup is blocked by admin
      if ((res as any)._blocked) {
        setIsBlocked(true);
        setIsModalOpen(true);
        return;
      }

      setIsBlocked(false);
      setResult(res);
      setIsModalOpen(true);

      if (res.found && res.status === 'PASSED') {
        triggerConfetti();
      }
    } catch (err) {
      console.error('Error checking collaborator result:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-bg-pattern" style={{ minHeight: 'calc(100vh - 80px)', padding: '32px 0 80px', position: 'relative' }}>
      <div className="hero-glow-bg" />
      <div className="hero-glow-left" />

      <div className="container-custom" style={{ position: 'relative', zIndex: 1 }}>
        {/* Top bar for standalone layout */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '36px',
            paddingBottom: '16px',
            border: 'none',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0284c7',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#f0f9ff',
              border: 'none',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>Quay lại Trang chủ</span>
          </Link>

          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <img
              src={logoImg}
              alt="Logo ISC"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.1 }}>
                LCĐ KHOA ATTT
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', letterSpacing: '0.05em' }}>
                ISC - PTIT
              </span>
            </div>
          </Link>
        </div>

        {/* Header Title */}
        <div style={{ maxWidth: '680px', margin: '0 auto 40px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <img
              src={logoImg}
              alt="Logo LCĐ Khoa An toàn thông tin"
              style={{
                width: '84px',
                height: '84px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 20px rgba(2, 132, 199, 0.3))',
              }}
            />
          </div>
          <div className="cyber-badge" style={{ marginBottom: '14px', border: 'none' }}>
            <ShieldCheck size={16} />
            <span>TUYỂN CỘNG TÁC VIÊN GEN 2.0</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              marginBottom: '14px',
            }}
          >
            Tra cứu kết quả
          </h1>

        </div>

        {/* Search Box */}
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div
            className="glass-card"
            style={{
              padding: '32px 30px',
              boxShadow: '0 15px 35px -5px rgba(2, 132, 199, 0.12)',
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '20px',
            }}
          >
            <form onSubmit={handleSearch}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: '#1e293b',
                    marginBottom: '8px',
                  }}
                >
                  Mã sinh viên (MSSV)
                </label>
                <Input
                  size="large"
                  bordered={false}
                  prefix={<GraduationCap size={18} color="#94a3b8" style={{ marginRight: '8px' }} />}
                  placeholder="Ví dụ: B23DCAT001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  allowClear
                  style={{
                    height: '52px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: 'none',
                    padding: '0 16px',
                  }}
                />
              </div>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<Search size={18} />}
                block
                style={{
                  height: '50px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  background: '#0284c7',
                  borderRadius: '10px',
                  border: 'none',
                }}
              >
                Kiểm tra kết quả
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* RESULT POPUP MODAL */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={980}
        centered
        destroyOnClose
        style={{ borderRadius: '20px', overflow: 'hidden' }}
        styles={{
          body: {
            padding: 0,
            overflow: 'hidden',
            border: 'none',
            borderRadius: '20px',
          },
        }}
      >
        {result && (
          <div>
                    {/* CASE BLOCKED: Result lookup not yet open */}
            {isBlocked && (
              <div style={{ padding: '40px 32px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e0f2fe, #bfdbfe)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '2rem',
                  }}
                >
                  🔒
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Cổng tra cứu chưa mở
                </h3>
                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, maxWidth: '460px', margin: '0 auto 8px' }}>
                  Ban quản trị chưa công bố kết quả tuyển CTV đợt này.
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 24px' }}>
                  Vui lòng theo dõi fanpage chính thức của Liên chi đoàn Khoa An toàn thông tin để nhận thông báo khi kết quả được công bố.
                </p>
                <Button
                  type="primary"
                  style={{ background: '#0284c7', fontWeight: 600, height: '42px', padding: '0 28px' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Đã hiểu
                </Button>
              </div>
            )}

            {/* CASE 1: NOT FOUND */}
            {!isBlocked && !result?.found && (
              <div style={{ padding: '40px 32px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                  }}
                >
                  <Info size={34} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Không tìm thấy thông tin ứng viên
                </h3>
                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 24px' }}>
                  Mã sinh viên <strong>{studentId}</strong> không có trong danh sách đăng ký hoặc chưa hoàn tất form ứng tuyển. Bạn vui lòng kiểm tra lại định dạng MSSV.
                </p>
                <Space size="middle">
                  <Button
                    type="primary"
                    style={{ background: '#0284c7', fontWeight: 600, height: '42px', padding: '0 24px' }}
                    onClick={() => {
                      setIsModalOpen(false);
                      setStudentId('');
                    }}
                  >
                    Thử lại mã khác
                  </Button>
                  <Button
                    style={{ height: '42px', padding: '0 20px', fontWeight: 600 }}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Đóng
                  </Button>
                </Space>
              </div>
            )}

            {/* CASE 2: PENDING */}
            {!isBlocked && result?.found && result.status === 'PENDING' && (
              <div style={{ padding: '40px 32px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                  }}
                >
                  <Clock size={34} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Kết quả đang được cập nhật
                </h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '20px' }}>
                  Hồ sơ ứng viên <strong>{result.fullName}</strong> ({result.studentId}) đang trong quá trình xét duyệt hoặc phỏng vấn đợt bổ sung.
                </p>
                {result.note && (
                  <div
                    style={{
                      padding: '16px 20px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      fontSize: '0.92rem',
                      color: '#334155',
                      textAlign: 'left',
                      marginBottom: '20px',
                    }}
                  >
                    <strong style={{ color: '#0284c7' }}>Thông báo từ Ban Giám khảo:</strong> {result.note}
                  </div>
                )}
                <div style={{ marginBottom: '24px' }}>
                  <Tag color="processing" style={{ padding: '6px 18px', fontSize: '0.92rem', borderRadius: '6px', fontWeight: 600 }}>
                    Trạng thái: Đang chờ kết quả
                  </Tag>
                </div>
                <Button
                  type="primary"
                  style={{ background: '#0284c7', fontWeight: 600, height: '42px', padding: '0 28px' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Đã hiểu
                </Button>
              </div>
            )}

            {/* CASE 3: FAILED */}
            {!isBlocked && result?.found && result.status === 'FAILED' && (
              <div style={{ padding: '40px 32px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                  }}
                >
                  <XCircle size={34} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Thông báo kết quả ứng tuyển
                </h3>
                <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '16px' }}>
                  Rất tiếc, bạn chưa có tên trong danh sách trúng tuyển đợt này.
                </p>
                <div
                  style={{
                    padding: '18px 20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    fontSize: '0.92rem',
                    color: '#475569',
                    lineHeight: 1.6,
                    textAlign: 'left',
                    marginBottom: '24px',
                  }}
                >
                  Chào <strong>{result.fullName}</strong>, Liên chi đoàn Khoa An toàn thông tin xin chân thành cảm ơn sự quan tâm và thời gian bạn đã dành để tham gia ứng tuyển đợt này. Do số lượng chỉ tiêu có hạn, chúng mình rất tiếc chưa thể đồng hành cùng bạn với tư cách CTV chính thức.
                  <br /><br />
                  {result.note || 'Hy vọng sẽ sớm gặp lại bạn tại các buổi Workshop, giải đấu CTF và các sự kiện mở sắp tới của Khoa ATTT!'}
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <Tag color="default" style={{ padding: '6px 18px', fontSize: '0.92rem', borderRadius: '6px', fontWeight: 600 }}>
                    Trạng thái: Chưa trúng tuyển
                  </Tag>
                </div>
                <Button
                  type="primary"
                  style={{ background: '#0284c7', fontWeight: 600, height: '42px', padding: '0 28px' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Đóng thông báo
                </Button>
              </div>
            )}

            {/* CASE 4: PASSED CV ROUND - INTERVIEW INVITATION */}
            {result.found && result.status === 'PASSED' && (
              <div style={{ padding: '36px 28px', backgroundColor: '#ffffff', position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Sparkles size={34} />
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      background: '#dcfce7',
                      color: '#15803d',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      letterSpacing: '0.06em',
                      padding: '4px 14px',
                      borderRadius: '9999px',
                      marginBottom: '8px',
                    }}
                  >
                    KẾT QUẢ VÒNG CV • TUYỂN CTV GEN 2.0
                  </div>

                  <h2
                    style={{
                      fontSize: 'clamp(1.7rem, 3.2vw, 2.1rem)',
                      fontWeight: 900,
                      color: '#15803d',
                      margin: '0 0 6px',
                    }}
                  >
                    CHÚC MỪNG BẠN!
                  </h2>
                  <p style={{ color: '#475569', fontSize: '0.96rem', margin: 0, fontWeight: 600 }}>
                    Bạn đã chính thức vượt qua vòng CV và tiến vào phỏng vấn của Liên chi Đoàn!
                  </p>
                </div>

                {/* Candidate basic info summary */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ứng viên: </span>
                    <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{result.fullName}</strong>
                    <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>MSSV: </span>
                    <strong style={{ color: '#0284c7', fontSize: '1rem' }}>{result.studentId}</strong>
                  </div>


                </div>

                {/* Official Letter Content */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '22px 20px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                    color: '#1e293b',
                    fontSize: '0.94rem',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                >
                  <p style={{ fontWeight: 700, marginBottom: '10px' }}>
                    Xin chào bạn <span style={{ color: '#0284c7' }}>{result.fullName}</span>,
                  </p>
                  <p style={{ marginBottom: '10px' }}>
                    Lời đầu tiên, LCĐ Khoa ATTT xin cảm ơn sự quan tâm của bạn dành cho sự kiện Tuyển CTV Gen 2.0.
                  </p>
                  <p style={{ marginBottom: '10px' }}>
                    Sau quá trình xem xét và đánh giá hồ sơ, chúng mình rất vui mừng được thông báo:
                    <br />
                    <span style={{ color: '#15803d', fontWeight: 700, fontSize: '1rem' }}>
                      Bạn đã chính thức vượt qua vòng CV và tiến vào phỏng vấn của Liên chi Đoàn!
                    </span>
                  </p>
                  <p style={{ marginBottom: '16px' }}>
                    Chúng mình đánh giá cao sự phù hợp của bạn với định hướng hoạt động của Liên chi. Hy vọng có thể trao đổi thêm với bạn trong buổi phỏng vấn này để hai bên có thể hiểu thêm về nhau hơn.
                  </p>

                  {/* Detailed Interview Info Box */}
                  <div
                    style={{
                      background: '#f0f9ff',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(2, 132, 199, 0.05)',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: '12px', fontSize: '0.96rem' }}>
                      DƯỚI ĐÂY LÀ CÁC THÔNG TIN CHI TIẾT CHO BUỔI PHỎNG VẤN:
                    </div>

                    <div style={{ marginBottom: '12px', fontSize: '0.94rem' }}>
                      <strong>Thời gian:</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>Chủ nhật, ngày 20/09/2026</span>
                    </div>

                    {/* Shifts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.88rem', marginBottom: '4px' }}>
                          Buổi Sáng:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155' }}>• <strong>Ca 1:</strong> 8h00 - 10h00</div>
                        <div style={{ fontSize: '0.88rem', color: '#334155' }}>• <strong>Ca 2:</strong> 10h00 - 12h00</div>
                      </div>

                      <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.88rem', marginBottom: '4px' }}>
                          Buổi Chiều:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155' }}>• <strong>Ca 3:</strong> 13h00 - 15h00</div>
                        <div style={{ fontSize: '0.88rem', color: '#334155' }}>• <strong>Ca 4:</strong> 15h00 - 17h00</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <strong>Bạn có thể lựa chọn thời gian phỏng vấn tại link sau đây:</strong>
                      <div style={{ marginTop: '6px' }}>
                        <a
                          href="https://forms.gle/isc-interview-gen2"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            background: '#0284c7',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                          }}
                        >
                          👉 Đăng ký ca phỏng vấn tại đây
                        </a>
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <strong>Địa điểm:</strong> Văn phòng Đoàn Thanh niên / Phòng Hội trường Khoa ATTT (Chi tiết sẽ gửi qua email & nhóm Zalo)
                    </div>

                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 6px rgba(154, 52, 18, 0.08)',
                        fontSize: '0.88rem',
                        color: '#9a3412',
                      }}
                    >
                      <strong>Lưu ý:</strong> Hãy đến sớm trước 10 phút để chuẩn bị tâm lý sẵn sàng và tự tin để có một buổi phỏng vấn thành công nhé. Chúng tôi mong rằng bạn sẽ có cơ hội thể hiện sự nhiệt huyết và kỹ năng của mình.
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: '16px' }}>
                    <div style={{ fontStyle: 'italic', color: '#64748b' }}>Thân mến,</div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>Liên Chi Đoàn Khoa An toàn thông tin</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      background: '#10b981',
                      fontWeight: 700,
                      height: '44px',
                      padding: '0 24px',
                    }}
                    onClick={triggerConfetti}
                  >
                    Bắn pháo hoa chúc mừng 🎉
                  </Button>
                  <Button
                    size="large"
                    style={{ height: '44px', padding: '0 24px', fontWeight: 600 }}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
