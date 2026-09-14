import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Upload,
  message,
  Popconfirm,
  Avatar,
  Tag,
  Row,
  Col,
} from 'antd';
import { Plus, Edit2, Trash2, UploadCloud, Calendar, UserCheck } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { memberService } from '../../services/member.service';
import { storageService } from '../../services/storage.service';
import { ExecutiveMember } from '../../types';

export const ExecutiveMembersPage: React.FC = () => {
  const [members, setMembers] = useState<ExecutiveMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ExecutiveMember | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  // Watch years for dynamic term preview
  const watchStartYear = Form.useWatch('termStartYear', form);
  const watchEndYear = Form.useWatch('termEndYear', form);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await memberService.getMembers();
      setMembers(data);
    } catch (err) {
      message.error('Lỗi khi tải danh sách Ban Chấp hành.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setAvatarUrl('');
    form.resetFields();
    form.setFieldsValue({
      termStartYear: 2026,
      termEndYear: 2027,
      cohort: 'D23',
      displayOrder: (members.length || 0) + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: ExecutiveMember) => {
    setEditingMember(m);
    setAvatarUrl(m.avatarUrl);
    form.resetFields();

    let sYear = m.termStartYear;
    let eYear = m.termEndYear;
    if (!sYear || !eYear) {
      const match = m.term?.match(/(\d{4})\s*-\s*(\d{4})/);
      if (match) {
        sYear = parseInt(match[1], 10);
        eYear = parseInt(match[2], 10);
      } else {
        sYear = 2026;
        eYear = 2027;
      }
    }

    // Clean up fullName if it previously had hyphen
    let cleanName = m.fullName;
    let autoCohort = m.cohort;
    if (!autoCohort && cleanName.includes(' - ')) {
      const parts = cleanName.split(' - ');
      cleanName = parts[0].trim();
      autoCohort = parts[1].trim();
    }

    form.setFieldsValue({
      ...m,
      fullName: cleanName,
      cohort: autoCohort,
      termStartYear: sYear,
      termEndYear: eYear,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await memberService.deleteMember(id);
      message.success('Đã xóa thành viên khỏi danh sách BCH.');
      loadMembers();
    } catch (err: any) {
      message.error('Lỗi khi xóa: ' + err.message);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      setUploading(true);
      const url = await storageService.uploadImage(`executive-members/${Date.now()}_${file.name}`, file);
      setAvatarUrl(url);
      message.success('Tải ảnh đại diện thành công!');
    } catch (err: any) {
      message.error(err.message || 'Lỗi upload ảnh.');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleFormSubmit = async (values: any) => {
    if (!avatarUrl) {
      message.warning('Vui lòng chọn ảnh đại diện cho thành viên BCH.');
      return;
    }

    const sYear = Number(values.termStartYear || 2026);
    const eYear = Number(values.termEndYear || 2027);

    if (eYear < sYear) {
      message.error('Năm kết thúc nhiệm kỳ phải lớn hơn hoặc bằng năm bắt đầu!');
      return;
    }

    const computedTerm = `Nhiệm kỳ ${sYear} - ${eYear}`;

    try {
      const payload: Omit<ExecutiveMember, 'id'> = {
        fullName: values.fullName.trim(),
        cohort: values.cohort?.trim() || 'D23',
        className: values.className?.trim() || null,
        position: values.position.trim(),
        avatarUrl,
        term: computedTerm,
        termStartYear: sYear,
        termEndYear: eYear,
        email: values.email?.trim() || null,
        facebook: values.facebook?.trim() || null,
        displayOrder: Number(values.displayOrder || 1),
      };

      if (editingMember) {
        await memberService.updateMember(editingMember.id, payload);
        message.success('Cập nhật thông tin nhân sự BCH thành công!');
      } else {
        await memberService.createMember(payload);
        message.success('Thêm thành viên BCH thành công!');
      }
      setIsModalOpen(false);
      loadMembers();
    } catch (err: any) {
      message.error(err.message || 'Thao tác không thành công.');
    }
  };

  const columns: ColumnsType<ExecutiveMember> = [
    {
      title: 'Thứ tự',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.displayOrder - b.displayOrder,
      render: (v) => <strong>#{v}</strong>,
    },
    {
      title: 'Ảnh',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 80,
      align: 'center',
      render: (url) => <Avatar src={url} size={46} />,
    },
    {
      title: 'Họ và tên & Khóa',
      key: 'memberInfo',
      render: (_, r) => {
        // Handle legacy strings if any
        let name = r.fullName;
        let cohort = r.cohort;
        if (!cohort && name.includes(' - ')) {
          const parts = name.split(' - ');
          name = parts[0].trim();
          cohort = parts[1].trim();
        }

        return (
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              {cohort && (
                <Tag color="blue" style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                  Khóa {cohort}
                </Tag>
              )}
              {r.className && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {r.className}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      render: (pos) => (
        <span style={{ color: '#0284c7', fontWeight: 600 }}>{pos}</span>
      ),
    },
    {
      title: 'Nhiệm kỳ',
      dataIndex: 'term',
      key: 'term',
      width: 170,
      render: (term) => (
        <Tag color="cyan" style={{ fontWeight: 600, padding: '4px 10px', borderRadius: '6px' }}>
          {term}
        </Tag>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (e) => e || <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, r) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit2 size={16} color="#0284c7" />}
            onClick={() => handleOpenEdit(r)}
          />
          <Popconfirm
            title="Xóa thành viên này khỏi BCH?"
            onConfirm={() => handleDelete(r.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Quản lý Ban Chấp hành (BCH)
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Danh sách và thông tin nhân sự Ban Chấp hành Liên chi đoàn Khoa ATTT
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          style={{ background: '#0284c7', fontWeight: 600 }}
        >
          Thêm thành viên BCH
        </Button>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: 'none',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </div>

      {/* Modal Add / Edit */}
      <Modal
        title={
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            {editingMember ? 'Chỉnh sửa thông tin nhân sự BCH' : 'Thêm thành viên BCH mới'}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '16px' }}>
          {/* Section 1: Thông tin cá nhân & Khóa */}
          <div
            style={{
              padding: '18px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#0284c7" />
              <span>Thông tin cá nhân & Khóa học</span>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fullName"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng điền họ và tên!' }]}
                >
                  <Input placeholder="Ví dụ: Lê Thị Phương Thảo" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="cohort"
                  label="Khóa sinh viên"
                  rules={[{ required: true, message: 'Vui lòng điền khóa!' }]}
                >
                  <Input placeholder="Ví dụ: D23" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="className"
                  label="Lớp sinh viên"
                >
                  <Input placeholder="Ví dụ: D23CQAT01-B" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="position"
                  label="Chức vụ trong LCĐ"
                  rules={[{ required: true, message: 'Vui lòng điền chức vụ!' }]}
                >
                  <Input placeholder="Ví dụ: Bí thư Liên chi đoàn, Phó Bí thư, Ủy viên Ban Chấp hành..." />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item name="displayOrder" label="Thứ tự ưu tiên hiển thị">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 2: Nhiệm kỳ công tác (Điền năm) */}
          <div
            style={{
              padding: '18px',
              background: '#f0f9ff',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0369a1', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="#0284c7" />
              <span>Nhiệm kỳ công tác (Điền năm)</span>
            </div>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="termStartYear"
                  label="Năm bắt đầu nhiệm kỳ"
                  rules={[{ required: true, message: 'Vui lòng điền năm bắt đầu!' }]}
                >
                  <Input placeholder="Ví dụ: 2026" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="termEndYear"
                  label="Năm kết thúc nhiệm kỳ"
                  rules={[{ required: true, message: 'Vui lòng điền năm kết thúc!' }]}
                >
                  <Input placeholder="Ví dụ: 2027" />
                </Form.Item>
              </Col>
            </Row>

            {/* Live preview tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#64748b' }}>
                Hiển thị:
              </span>
              <Tag color="blue" style={{ fontWeight: 700, fontSize: '0.88rem', padding: '2px 10px' }}>
                Nhiệm kỳ {watchStartYear || 2026} - {watchEndYear || 2027}
              </Tag>
            </div>
          </div>

          {/* Section 3: Ảnh đại diện & Liên hệ */}
          <Form.Item label="Ảnh đại diện (Avatar)" required>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUploadAvatar}
              >
                <Button icon={<UploadCloud size={16} />} loading={uploading}>
                  Tải ảnh avatar
                </Button>
              </Upload>
              <Input
                placeholder="Hoặc dán URL ảnh trực tiếp"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            {avatarUrl && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar src={avatarUrl} size={64} />
                <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                  ✓ Đã tải ảnh xem trước
                </span>
              </div>
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email liên hệ">
                <Input placeholder="ví dụ: thaoltp.b23at@gmail.com" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item name="facebook" label="Link Facebook cá nhân (nếu có)">
                <Input placeholder="https://facebook.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7', fontWeight: 600 }}>
              {editingMember ? 'Lưu cập nhật' : 'Thêm thành viên'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
