import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Spin, Row, Col, Tabs } from 'antd';
import {
  Save,
  ShieldCheck,
  Sparkles,
  BarChart2,
  Mail,
  Compass,
  Target,
  Users,
  Award,
  Calendar,
  Layers,
  Flame,
  UploadCloud,
} from 'lucide-react';
import { settingsService } from '../../services/settings.service';
import { WebsiteSettings } from '../../types';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await settingsService.getAdminSettings();
        form.setFieldsValue(data);
      } catch (err) {
        message.error('Lỗi khi tải thông tin cấu hình website.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [form]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      await settingsService.updateSettings(values);
      message.success('Cập nhật cấu hình website thành công! Nội dung trang chủ đã được làm mới.');
    } catch (err: any) {
      message.error('Lỗi khi lưu cấu hình: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} /> Nhận diện & Giới thiệu
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="organizationName"
                label="Tên tổ chức Đoàn đầy đủ"
                rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức!' }]}
              >
                <Input placeholder="LIÊN CHI ĐOÀN KHOA AN TOÀN THÔNG TIN" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="shortName" label="Tên viết tắt (Thương hiệu)">
                <Input placeholder="ISC - Information Security Council" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="foundedYear" label="Năm thành lập">
                <Input placeholder="2025" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="aboutDescription"
            label="Đoạn giới thiệu tổng quan về LCĐ (Hiển thị tại mục Về chúng tôi)"
            rules={[{ required: true, message: 'Vui lòng nhập đoạn giới thiệu!' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Liên chi đoàn Khoa An toàn thông tin (ISC - Information Security Council) được thành lập năm 2025..."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} /> Hero Banner Trang chủ
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Form.Item
            name="heroTitle"
            label="Tiêu đề chính Hero (Dòng chữ lớn đầu trang)"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chính!' }]}
          >
            <Input placeholder="LIÊN CHI ĐOÀN KHOA AN TOÀN THÔNG TIN" />
          </Form.Item>

          <Form.Item
            name="heroSubtitle"
            label="Khẩu hiệu / Slogan chính"
            rules={[{ required: true, message: 'Vui lòng nhập khẩu hiệu!' }]}
          >
            <Input placeholder="Kết nối đam mê. Phát triển kỹ năng. Xây dựng cộng đồng An toàn thông tin." />
          </Form.Item>

          <Form.Item
            name="heroDescription"
            label="Mô tả phụ dưới Hero"
          >
            <Input.TextArea
              rows={3}
              placeholder="Mái nhà chung dành cho sinh viên yêu thích An toàn thông tin, nơi kết nối các thế hệ, phát triển kỹ năng và cùng nhau tạo nên một cộng đồng năng động, đoàn kết."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={16} /> Tầm nhìn & Sứ mệnh
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Form.Item
            name="vision"
            label="Tầm nhìn (Vision)"
            rules={[{ required: true, message: 'Vui lòng nhập tầm nhìn!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Trở thành tổ chức thanh niên tiên phong trong lĩnh vực An toàn thông tin, là cầu nối gắn kết sinh viên và lan tỏa tinh thần học hỏi, sáng tạo."
            />
          </Form.Item>

          <Form.Item
            name="mission"
            label="Sứ mệnh (Mission)"
            rules={[{ required: true, message: 'Vui lòng nhập sứ mệnh!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Đồng hành cùng sinh viên trong học tập, phát triển kỹ năng, nuôi dưỡng đam mê và xây dựng cộng đồng An toàn thông tin năng động, đoàn kết."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '4',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={16} /> Vì sao nên tham gia ISC?
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Form.Item
            name="whyJoinNewFriends"
            label="1. Kết bạn mới"
          >
            <Input.TextArea
              rows={2}
              placeholder="Đến với ISC, giá trị đầu tiên mà sinh viên nhận được là những người bạn mới. Đây là một cộng đồng nhiệt huyết, nơi mọi người cùng chia sẻ niềm quan tâm và đam mê với lĩnh vực An toàn thông tin."
            />
          </Form.Item>

          <Form.Item
            name="whyJoinGenerations"
            label="2. Kết nối thế hệ"
          >
            <Input.TextArea
              rows={2}
              placeholder="ISC tạo môi trường để sinh viên được trải nghiệm, làm việc và nhận sự hỗ trợ trực tiếp từ các anh chị khóa trên. Đây là cơ hội để học hỏi kinh nghiệm học tập, hoạt động và phát triển bản thân trong môi trường Học viện."
            />
          </Form.Item>

          <Form.Item
            name="whyJoinNewSkills"
            label="3. Học những thứ mới (Training C, Training CTF...)"
          >
            <Input.TextArea
              rows={2}
              placeholder="ISC không chỉ là sân chơi hoạt động mà còn hướng đến phát triển học thuật. Sinh viên có cơ hội xây dựng nền tảng lập trình và tiếp cận thực tế với bảo mật thông qua các chương trình như Training C, Training CTF chuyên sâu."
            />
          </Form.Item>

          <Form.Item
            name="whyJoinBreakthrough"
            label="4. Bứt phá bản thân (Seminar định hướng, CTF lớn...)"
          >
            <Input.TextArea
              rows={2}
              placeholder="Các buổi seminar chia sẻ định hướng công việc giúp sinh viên có thêm kiến thức thực tế, chuẩn bị hành trang và sẵn sàng tham gia các cuộc thi lớn trong lĩnh vực An toàn thông tin."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '5',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={16} /> Tuyển dụng CTV (Gen 2.0)
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="recruitmentTitle"
                label="Tiêu đề khối Tuyển CTV"
              >
                <Input placeholder="Gia nhập ISC" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="recruitmentPeriod"
                label="Thời gian mở đơn / Tên đợt tuyển"
              >
                <Input placeholder="Tuyển thành viên Gen 2.0 (Thời gian mở đơn: 23/08 - 10/09)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="recruitmentSubtitle"
            label="Khẩu hiệu phụ khối tuyển dụng"
          >
            <Input placeholder="Trở thành một phần của Liên chi đoàn Khoa An toàn thông tin" />
          </Form.Item>

          <Form.Item
            name="recruitmentDescription"
            label="Lời mời gọi ứng tuyển CTV"
          >
            <Input.TextArea
              rows={3}
              placeholder="Tham gia ISC để kết nối với những người bạn có chung đam mê, học hỏi từ các anh chị khóa trên, phát triển kỹ năng và trải nghiệm các hoạt động học thuật, sự kiện và phong trào sinh viên."
            />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '6',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={16} /> Số liệu & Liên hệ
        </span>
      ),
      children: (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Số liệu Thống kê trên Trang chủ
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="totalStudents" label="Sinh viên (+)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="totalActivities" label="Hoạt động đã tổ chức (+)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="totalCollaborators" label="Cộng tác viên (+)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="activeYears" label="Năm hoạt động (+)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ fontWeight: 700, color: '#0f172a', margin: '16px 0 12px' }}>
            Thông tin Liên hệ Chính thức
          </div>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email chính thức của LCĐ">
                <Input placeholder="lcdkhoaantoanthongtinptit@gmail.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="phone" label="Số điện thoại / Hotline">
                <Input placeholder="024.3754.7511" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="facebook" label="Link Fanpage Facebook">
                <Input placeholder="https://facebook.com/lcdattt" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="address" label="Địa chỉ văn phòng">
                <Input placeholder="Văn phòng Đoàn TN Khoa ATTT, Học viện Công nghệ Bưu chính Viễn thông" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: '5',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UploadCloud size={16} /> Lưu trữ ảnh (ImageKit.io)
        </span>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '12px',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontSize: '0.92rem',
              lineHeight: 1.6,
            }}
          >
            <strong>Hướng dẫn cấu hình ImageKit.io Upload API:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
              <li>Đăng ký tài khoản miễn phí tại <a href="https://imagekit.io" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#0284c7', fontWeight: 600 }}>imagekit.io</a> (miễn phí 20GB lưu trữ & băng thông mỗi tháng).</li>
              <li>Vào mục <strong>Developer options &rarr; API keys</strong> để sao chép <em>Public Key</em>, <em>Private Key</em> và <em>URL-endpoint</em>.</li>
              <li>Điền các trường bên dưới rồi bấm <strong>Lưu thay đổi cài đặt</strong> để kích hoạt lưu trữ đám mây cho tính năng tải ảnh.</li>
            </ul>
          </div>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="imagekitPublicKey"
                label="ImageKit Public Key"
                tooltip="Mã công khai dùng để xác thực upload từ phía trình duyệt"
              >
                <Input placeholder="public_xxxxxxxxxxxx" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="imagekitPrivateKey"
                label="ImageKit Private Key"
                tooltip="Mã bảo mật dùng để sinh chữ ký số HMAC-SHA1 khi tải ảnh"
              >
                <Input.Password placeholder="private_xxxxxxxxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="imagekitUrlEndpoint"
            label="ImageKit URL-Endpoint"
            tooltip="Đường dẫn phân phối CDN của tài khoản ImageKit của bạn"
          >
            <Input placeholder="https://ik.imagekit.io/your_imagekit_id" />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
          Quản Lý Nội Dung Website
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
          Bí thư, Phó Bí thư và Quản trị viên có thể cập nhật mọi thông tin trên trang chủ tại đây.
          Khi bấm <strong>"Lưu thay đổi cài đặt"</strong>, nội dung sẽ được cập nhật trực tiếp lên website công khai ngay lập tức.
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Card
          bordered={false}
          style={{
            borderRadius: '16px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
            border: 'none',
          }}
        >
          <Tabs defaultActiveKey="1" items={tabItems} />
        </Card>

        {/* Action Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '50px' }}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={saving}
            icon={<Save size={18} />}
            style={{
              background: '#0284c7',
              height: '48px',
              padding: '0 36px',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            Lưu thay đổi cài đặt
          </Button>
        </div>
      </Form>
    </div>
  );
};
