import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Tooltip,
  Alert,
  Avatar,
} from 'antd';
import {
  UserPlus,
  ShieldCheck,
  Users,
  Award,
  Calendar,
  Settings,
  Trash2,
  Edit2,
  CheckCircle2,
  UserCheck,
  Shield,
  Search,
  KeyRound,
  LayoutDashboard,
  Building2,
  ClipboardCheck,
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { accountService, ManagedAccountItem, CreateAccountInput } from '../../services/account.service';
import { authService, ROLE_PERMISSIONS } from '../../services/auth.service';
import { departmentService } from '../../services/department.service';
import { AdminRole, AdminUser, Department } from '../../types';

// Danh sách các tab trong hệ thống để phân quyền
const AVAILABLE_TABS = [
  {
    path: '/admin/dashboard',
    label: 'Tổng quan',
    icon: <LayoutDashboard size={15} />,
    description: 'Xem số liệu thống kê chung',
  },
  {
    path: '/admin/interview',
    label: 'Phỏng vấn CTV',
    icon: <ClipboardCheck size={15} />,
    description: 'Bàn tra cứu hồ sơ thí sinh và chấm điểm phỏng vấn trực tiếp',
  },
  {
    path: '/admin/collaborators',
    label: 'Quản lý CTV',
    icon: <Users size={15} />,
    description: 'Xem hồ sơ, danh sách và lọc kết quả tuyển CTV',
  },
  {
    path: '/admin/activities',
    label: 'Hoạt động & Sự kiện',
    icon: <Calendar size={15} />,
    description: 'Đăng bài và quản lý sự kiện của khoa',
  },
  {
    path: '/admin/executive-members',
    label: 'Ban Chấp hành',
    icon: <Award size={15} />,
    description: 'Quản lý danh sách nhân sự Ban Chấp hành',
  },
  {
    path: '/admin/accounts',
    label: 'Tạo & Quản lý Tài khoản',
    icon: <UserCheck size={15} />,
    description: 'Tạo tài khoản cán bộ và tùy chỉnh phân quyền các tab',
  },
  {
    path: '/admin/settings',
    label: 'Cài đặt',
    icon: <Settings size={15} />,
    description: 'Cấu hình hệ thống, form tuyển dụng và công khai kết quả',
  },
  {
    path: '/admin/profile',
    label: 'Hồ sơ cá nhân',
    icon: <UserCheck size={15} />,
    description: 'Trang thông tin cá nhân và cập nhật ảnh đại diện cán bộ',
  },
];

export const AccountsAdminPage: React.FC = () => {
  const [accounts, setAccounts] = useState<ManagedAccountItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<AdminRole>('interviewer');

  // Modal Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ManagedAccountItem | null>(null);
  const [editForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, depts, user] = await Promise.all([
        accountService.getAccounts(),
        departmentService.getDepartments(),
        authService.getCurrentUser(),
      ]);
      setAccounts(accs);
      setDepartments(depts);
      setCurrentUser(user);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tài khoản:', err);
      message.error('Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý khi thay đổi vai trò trong Form Tạo
  const handleRoleChange = (role: AdminRole) => {
    setSelectedRole(role);
    if (role === 'interviewer') {
      createForm.setFieldsValue({
        permissions: ['/admin/interview', '/admin/collaborators'],
      });
    } else if (role === 'lead' || role === 'deputy_lead') {
      createForm.setFieldsValue({
        permissions: [
          '/admin/dashboard',
          '/admin/interview',
          '/admin/collaborators',
          '/admin/activities',
          '/admin/executive-members',
        ],
      });
    } else if (role === 'secretary' || role === 'admin') {
      createForm.setFieldsValue({
        permissions: [
          '/admin/dashboard',
          '/admin/interview',
          '/admin/collaborators',
          '/admin/activities',
          '/admin/executive-members',
          '/admin/accounts',
          '/admin/settings',
        ],
      });
    } else if (role === 'deputy_secretary') {
      createForm.setFieldsValue({
        permissions: [
          '/admin/dashboard',
          '/admin/interview',
          '/admin/collaborators',
          '/admin/activities',
          '/admin/executive-members',
          '/admin/accounts',
        ],
      });
    }
  };

  const handleOpenCreate = () => {
    createForm.resetFields();
    setSelectedRole('interviewer');
    createForm.setFieldsValue({
      role: 'interviewer',
      permissions: ['/admin/interview', '/admin/collaborators'],
    });
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (values: any) => {
    try {
      setCreateLoading(true);

      const dept = departments.find((d) => d.id === values.departmentId);

      const payload: CreateAccountInput = {
        email: values.email,
        password: values.password,
        displayName: values.displayName,
        role: values.role,
        departmentId: values.departmentId || null,
        departmentName: dept?.name || null,
        permissions:
          Array.isArray(values.permissions)
            ? values.permissions
            : ROLE_PERMISSIONS[values.role as AdminRole]?.allowedPaths || [],
      };

      await accountService.createAccount(payload);
      message.success(`Đã tạo tài khoản cán bộ thành công cho ${values.email}`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo tài khoản.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (acc: ManagedAccountItem) => {
    setEditingAccount(acc);
    editForm.resetFields();
    editForm.setFieldsValue({
      displayName: acc.displayName,
      role: acc.role,
      departmentId: acc.departmentId || undefined,
      permissions: acc.permissions || ROLE_PERMISSIONS[acc.role]?.allowedPaths || [],
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (!editingAccount) return;
    try {
      setEditLoading(true);
      const dept = departments.find((d) => d.id === values.departmentId);

      await accountService.updateAccount(editingAccount.uid, {
        displayName: values.displayName,
        role: values.role,
        departmentId: values.departmentId || null,
        departmentName: dept?.name || null,
        permissions: Array.isArray(values.permissions) ? values.permissions : [],
        password: values.newPassword || undefined,
      });

      message.success('Cập nhật quyền hạn tài khoản thành công!');
      setIsEditOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cập nhật tài khoản.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await accountService.deleteAccount(uid, currentUser?.uid);
      message.success('Đã xóa tài khoản thành công.');
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi xóa tài khoản.');
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchQuery =
      acc.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'ALL' || acc.role === roleFilter;
    return matchQuery && matchRole;
  });

  // Calculate statistics
  const countAdmin = accounts.filter((a) => a.role === 'admin').length;
  const countLead = accounts.filter((a) => a.role === 'lead').length;
  const countInterviewer = accounts.filter((a) => a.role === 'interviewer' || a.role === 'recruiter').length;

  const renderRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'admin':
        return (
          <Tag color="blue" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Quản trị viên Cấp cao
          </Tag>
        );
      case 'secretary':
        return (
          <Tag color="cyan" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Bí thư LCĐ
          </Tag>
        );
      case 'deputy_secretary':
        return (
          <Tag color="geekblue" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Phó Bí thư
          </Tag>
        );
      case 'lead':
        return (
          <Tag color="purple" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Trưởng ban
          </Tag>
        );
      case 'deputy_lead':
        return (
          <Tag color="magenta" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <Award size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Phó ban
          </Tag>
        );
      case 'interviewer':
      case 'recruiter':
        return (
          <Tag color="green" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Cán bộ Phỏng vấn
          </Tag>
        );
      case 'editor':
        return (
          <Tag color="magenta" style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
            <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Cán bộ Truyền thông
          </Tag>
        );
      default:
        return <Tag>{role}</Tag>;
    }
  };

  const columns: ColumnsType<ManagedAccountItem> = [
    {
      title: 'Cán bộ',
      key: 'user',
      width: 260,
      render: (_, record) => (
        <Space style={{ maxWidth: '100%' }}>
          <Avatar
            style={{
              backgroundColor:
                record.role === 'admin'
                  ? '#0284c7'
                  : record.role === 'lead'
                  ? '#7e22ce'
                  : '#16a34a',
              fontWeight: 700,
            }}
          >
            {record.displayName?.[0]?.toUpperCase() || 'C'}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              {record.displayName || 'Cán bộ LCĐ'}
              {currentUser?.uid === record.uid && (
                <Tag color="cyan" style={{ marginLeft: '6px', fontSize: '0.72rem' }}>
                  Bạn
                </Tag>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role: AdminRole) => renderRoleBadge(role),
    },
    {
      title: 'Ban trực thuộc',
      key: 'department',
      width: 160,
      render: (_, record) => {
        const deptName =
          record.departmentName ||
          departments.find((d) => d.id === record.departmentId)?.name;

        if (deptName) {
          return (
            <Tag color="default" style={{ fontWeight: 600 }}>
              <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {deptName}
            </Tag>
          );
        }
        if (record.role === 'admin' || record.role === 'secretary') {
          return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Toàn tổ chức</span>;
        }
        return <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>;
      },
    },
    {
      title: 'Quyền truy cập tab',
      key: 'permissions',
      width: 260,
      render: (_, record) => {
        const paths = record.permissions || ROLE_PERMISSIONS[record.role]?.allowedPaths || [];
        if (record.role === 'admin' && (!record.permissions || record.permissions.length >= 6)) {
          return (
            <Tag color="geekblue" style={{ fontWeight: 600 }}>
              Toàn quyền hệ thống
            </Tag>
          );
        }
        return (
          <Space wrap size={[4, 4]}>
            {paths.map((p) => {
              const tab = AVAILABLE_TABS.find((t) => t.path === p);
              return (
                <Tag key={p} color="blue" style={{ fontSize: '0.75rem', borderRadius: '4px' }}>
                  {tab?.label || p.replace('/admin/', '')}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa quyền">
            <Button
              type="text"
              icon={<Edit2 size={16} color="#0284c7" />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          {currentUser?.uid !== record.uid ? (
            <Popconfirm
              title="Xóa tài khoản cán bộ"
              description={`Bạn có chắc chắn muốn xóa tài khoản ${record.email}?`}
              onConfirm={() => handleDelete(record.uid)}
              okText="Xác nhận xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa tài khoản">
                <Button type="text" danger icon={<Trash2 size={16} />} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Không thể xóa chính mình">
              <Button type="text" disabled icon={<Trash2 size={16} />} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '4px 0 30px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#0f172a' }}>
            Quản Lý Tài Khoản & Phân Quyền
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Tạo tài khoản và phân quyền cán bộ (Phỏng vấn CTV, Trưởng ban, Quản trị viên)
          </p>
        </div>

        <Button
          type="primary"
          icon={<UserPlus size={16} />}
          onClick={handleOpenCreate}
          style={{
            height: '42px',
            borderRadius: '8px',
            fontWeight: 700,
            background: '#0284c7',
            padding: '0 20px',
          }}
        >
          Thêm tài khoản cán bộ
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px', marginLeft: 0, marginRight: 0 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>Tổng tài khoản</span>}
              value={accounts.length}
              prefix={<UserCheck size={20} color="#0284c7" style={{ marginRight: '6px' }} />}
              valueStyle={{ fontWeight: 800, color: '#0f172a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>Cán bộ Phỏng vấn</span>}
              value={countInterviewer}
              prefix={<Users size={20} color="#16a34a" style={{ marginRight: '6px' }} />}
              valueStyle={{ fontWeight: 800, color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>Trưởng ban</span>}
              value={countLead}
              prefix={<Award size={20} color="#7e22ce" style={{ marginRight: '6px' }} />}
              valueStyle={{ fontWeight: 800, color: '#7e22ce' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Statistic
              title={<span style={{ fontWeight: 600, color: '#64748b' }}>Quản trị viên</span>}
              value={countAdmin}
              prefix={<ShieldCheck size={20} color="#0284c7" style={{ marginRight: '6px' }} />}
              valueStyle={{ fontWeight: 800, color: '#0284c7' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card
        bordered={false}
        style={{
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginLeft: 0, marginRight: 0 }}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Tìm theo email hoặc họ tên cán bộ..."
              prefix={<Search size={16} color="#94a3b8" style={{ marginRight: '6px' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              style={{ borderRadius: '8px', height: '40px' }}
            />
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Space>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Lọc theo vai trò:</span>
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 220, height: '40px' }}
                options={[
                  { value: 'ALL', label: 'Tất cả vai trò' },
                  { value: 'secretary', label: 'Bí thư LCĐ' },
                  { value: 'deputy_secretary', label: 'Phó Bí thư' },
                  { value: 'lead', label: 'Trưởng ban' },
                  { value: 'deputy_lead', label: 'Phó ban' },
                  { value: 'interviewer', label: 'Cán bộ Phỏng vấn' },
                  { value: 'admin', label: 'Quản trị viên' },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        bordered={false}
        style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Table
          columns={columns}
          dataSource={filteredAccounts}
          rowKey="uid"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng ${t} tài khoản` }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: TẠO TÀI KHOẢN MỚI                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="#0284c7" />
            <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>Thêm Tài Khoản Cán Bộ Mới</span>
          </div>
        }
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={580}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          style={{ marginTop: '16px' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="displayName"
                label={<span style={{ fontWeight: 600 }}>Họ và tên Cán bộ</span>}
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input placeholder="Ví dụ: Nguyễn Văn A" style={{ height: '42px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600 }}>Email đăng nhập</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không đúng định dạng!' },
                ]}
              >
                <Input placeholder="admin.ten@lcdattt.edu.vn" style={{ height: '42px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600 }}>Mật khẩu ban đầu</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' },
            ]}
          >
            <Input.Password
              placeholder="Tối thiểu 6 ký tự"
              style={{ height: '42px', borderRadius: '8px' }}
            />
          </Form.Item>

          {/* Chọn vai trò */}
          <Form.Item
            name="role"
            label={<span style={{ fontWeight: 600 }}>Phân quyền / Vai trò</span>}
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select
              style={{ height: '44px' }}
              onChange={handleRoleChange}
              options={[
                {
                  value: 'secretary',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="cyan">Bí thư</Tag>
                      <span>Bí thư LCĐ (Lãnh đạo cao nhất, toàn quyền hệ thống)</span>
                    </div>
                  ),
                },
                {
                  value: 'deputy_secretary',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="geekblue">Phó Bí thư</Tag>
                      <span>Phó Bí thư LCĐ (Chỉ đạo hoạt động, nhân sự, CTV)</span>
                    </div>
                  ),
                },
                {
                  value: 'lead',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="purple">Trưởng ban</Tag>
                      <span>Trưởng ban (Quản lý CTV, Hoạt động & Sự kiện, BCH)</span>
                    </div>
                  ),
                },
                {
                  value: 'deputy_lead',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="magenta">Phó ban</Tag>
                      <span>Phó ban (Phối hợp quản lý CTV, hoạt động của ban)</span>
                    </div>
                  ),
                },
                {
                  value: 'interviewer',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="green">Phỏng vấn</Tag>
                      <span>Cán bộ Phỏng vấn (Bàn phỏng vấn & tra cứu thí sinh CTV)</span>
                    </div>
                  ),
                },
                {
                  value: 'admin',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="blue">Admin</Tag>
                      <span>Quản trị viên Cấp cao (Toàn quyền hệ thống)</span>
                    </div>
                  ),
                },
              ]}
            />
          </Form.Item>

          {/* Chọn ban trực thuộc */}
          <Form.Item
            name="departmentId"
            label={<span style={{ fontWeight: 600 }}>Ban trực thuộc</span>}
            rules={[
              {
                required: selectedRole === 'lead' || selectedRole === 'deputy_lead',
                message: 'Vui lòng chọn ban trực thuộc!',
              },
            ]}
          >
            <Select
              placeholder="Chọn Ban trực thuộc (nếu có)"
              allowClear
              style={{ height: '42px' }}
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Form.Item>

          {/* Quyền hạn cụ thể các Tab */}
          <Form.Item
            name="permissions"
            label={
              <span style={{ fontWeight: 600 }}>
                Các tab được phép truy cập (Tự động tích theo vai trò hoặc tùy chỉnh)
              </span>
            }
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {AVAILABLE_TABS.map((tab) => (
                  <div
                    key={tab.path}
                    style={{
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Checkbox value={tab.path} style={{ fontWeight: 600, color: '#0f172a' }}>
                      <Space>
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.82rem' }}>
                          — {tab.description}
                        </span>
                      </Space>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Alert
            message="Ghi chú phân quyền"
            description="Tài khoản cán bộ sau khi tạo có thể đăng nhập ngay vào Cổng Quản trị. Hệ thống sẽ tự động ẩn các menu không thuộc quyền hạn truy cập của cán bộ đó."
            type="info"
            showIcon
            style={{ marginBottom: '20px', borderRadius: '8px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button onClick={() => setIsCreateOpen(false)} style={{ borderRadius: '8px' }}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createLoading}
              icon={<CheckCircle2 size={16} />}
              style={{
                borderRadius: '8px',
                fontWeight: 700,
                background: '#0284c7',
                padding: '0 24px',
              }}
            >
              Tạo tài khoản
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CHỈNH SỬA TÀI KHOẢN                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit2 size={20} color="#0284c7" />
            <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>
              Chỉnh Sửa Quyền Hạn: {editingAccount?.email}
            </span>
          </div>
        }
        open={isEditOpen}
        onCancel={() => setIsEditOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            name="displayName"
            label={<span style={{ fontWeight: 600 }}>Họ và tên Cán bộ</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input style={{ height: '42px', borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span style={{ fontWeight: 600 }}>Vai trò</span>}
            rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          >
            <Select
              style={{ height: '44px' }}
              onChange={(role: AdminRole) => {
                if (role === 'interviewer') {
                  editForm.setFieldsValue({
                    permissions: ['/admin/interview', '/admin/collaborators'],
                  });
                } else if (role === 'lead' || role === 'deputy_lead') {
                  editForm.setFieldsValue({
                    permissions: [
                      '/admin/dashboard',
                      '/admin/interview',
                      '/admin/collaborators',
                      '/admin/activities',
                      '/admin/executive-members',
                    ],
                  });
                } else if (role === 'secretary' || role === 'admin') {
                  editForm.setFieldsValue({
                    permissions: [
                      '/admin/dashboard',
                      '/admin/interview',
                      '/admin/collaborators',
                      '/admin/activities',
                      '/admin/executive-members',
                      '/admin/accounts',
                      '/admin/settings',
                    ],
                  });
                } else if (role === 'deputy_secretary') {
                  editForm.setFieldsValue({
                    permissions: [
                      '/admin/dashboard',
                      '/admin/interview',
                      '/admin/collaborators',
                      '/admin/activities',
                      '/admin/executive-members',
                      '/admin/accounts',
                    ],
                  });
                }
              }}
              options={[
                {
                  value: 'secretary',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="cyan">Bí thư</Tag>
                      <span>Bí thư LCĐ (Lãnh đạo cao nhất, toàn quyền hệ thống)</span>
                    </div>
                  ),
                },
                {
                  value: 'deputy_secretary',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="geekblue">Phó Bí thư</Tag>
                      <span>Phó Bí thư LCĐ (Chỉ đạo hoạt động, nhân sự, CTV)</span>
                    </div>
                  ),
                },
                {
                  value: 'lead',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="purple">Trưởng ban</Tag>
                      <span>Trưởng ban (Quản lý CTV, Hoạt động & Sự kiện, BCH)</span>
                    </div>
                  ),
                },
                {
                  value: 'deputy_lead',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="magenta">Phó ban</Tag>
                      <span>Phó ban (Phối hợp quản lý CTV, hoạt động của ban)</span>
                    </div>
                  ),
                },
                {
                  value: 'interviewer',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="green">Phỏng vấn</Tag>
                      <span>Cán bộ Phỏng vấn (Bàn phỏng vấn & tra cứu thí sinh CTV)</span>
                    </div>
                  ),
                },
                {
                  value: 'admin',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag color="blue">Admin</Tag>
                      <span>Quản trị viên Cấp cao (Toàn quyền hệ thống)</span>
                    </div>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="departmentId"
            label={<span style={{ fontWeight: 600 }}>Ban trực thuộc</span>}
          >
            <Select
              placeholder="Chọn Ban trực thuộc (nếu có)"
              allowClear
              style={{ height: '42px' }}
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="permissions"
            label={<span style={{ fontWeight: 600 }}>Tùy chỉnh tab được phép truy cập</span>}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AVAILABLE_TABS.map((tab) => (
                  <div
                    key={tab.path}
                    style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Checkbox value={tab.path} style={{ fontWeight: 600, color: '#0f172a' }}>
                      <Space>
                        {tab.icon}
                        <span>{tab.label}</span>
                        <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.82rem' }}>
                          — {tab.description}
                        </span>
                      </Space>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={
              <span style={{ fontWeight: 600 }}>
                Đổi mật khẩu mới (Để trống nếu không muốn đổi)
              </span>
            }
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới nếu muốn đổi"
              style={{ height: '42px', borderRadius: '8px' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button onClick={() => setIsEditOpen(false)} style={{ borderRadius: '8px' }}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={editLoading}
              icon={<CheckCircle2 size={16} />}
              style={{
                borderRadius: '8px',
                fontWeight: 700,
                background: '#0284c7',
                padding: '0 24px',
              }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
