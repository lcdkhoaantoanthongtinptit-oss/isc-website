import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  message,
  Tag,
  Row,
  Col,
  Divider,
  Result,
  Spin,
  Alert,
  Tabs,
  Upload,
} from 'antd';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  ShieldCheck,
  Camera,
  Link as LinkIcon,
  Lock,
  Save,
  CheckCircle2,
  BookOpen,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import ImgCrop from 'antd-img-crop';
import { authService, ROLE_PERMISSIONS } from '../../services/auth.service';
import { storageService, formatFileSize } from '../../services/storage.service';
import { memberService } from '../../services/member.service';
import { AdminUser, AdminRole, ExecutiveMember } from '../../types';

// Allowed roles for Profile page as requested:
// [Bí thư, phó bí thư, trưởng ban, phó ban, admin]
const ALLOWED_ROLES: AdminRole[] = [
  'admin',
  'secretary',
  'deputy_secretary',
  'lead',
  'deputy_lead',
];

export const ProfileAdminPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [linkedMember, setLinkedMember] = useState<ExecutiveMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [customAvatarInput, setCustomAvatarInput] = useState<string>('');
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Load current user profile & linked BCH member
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        if (user) {
          // 1. Tìm thông tin nhân sự tương ứng trong tab BCH
          const bchMember = await memberService.findMemberByUserInfo({
            linkedMemberId: user.linkedMemberId,
            studentId: user.studentId,
            email: user.email,
            userId: user.uid,
          });

          setLinkedMember(bchMember);

          // Lấy avatar ưu tiên: user photoURL -> bch avatarUrl
          const currentAvatar = user.photoURL || user.avatarUrl || bchMember?.avatarUrl || '';
          setAvatarUrl(currentAvatar);

          // Ưu tiên dữ liệu từ user hoặc đồng bộ từ bản ghi BCH nếu user chưa có
          profileForm.setFieldsValue({
            displayName: user.displayName || bchMember?.fullName || '',
            email: user.email || bchMember?.email || '',
            studentId: user.studentId || bchMember?.studentId || '',
            phone: user.phone || bchMember?.phone || '',
            className: user.className || bchMember?.className || '',
            cohort: user.cohort || bchMember?.cohort || '',
            facebookUrl: user.facebookUrl || bchMember?.facebook || '',
            position: user.position || bchMember?.position || '',
            bio: user.bio || '',
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin tài khoản:', err);
        message.error('Không thể tải thông tin tài khoản cán bộ.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [profileForm]);

  // Check role permission
  const isAllowed = currentUser ? ALLOWED_ROLES.includes(currentUser.role) : false;

  // Handle avatar upload via storageService with WebP compression
  const handleUploadAvatar = async (file: File) => {
    try {
      setAvatarUploading(true);
      const res = await storageService.uploadImageWithDetails(
        `avatars/${currentUser?.uid || 'user'}_${Date.now()}_${file.name}`,
        file
      );
      setAvatarUrl(res.url);
      if (res.compression && res.compression.isCompressed) {
        message.success(
          `Tải ảnh đại diện thành công! Đã nén ${formatFileSize(res.compression.originalSize)} ➔ ${formatFileSize(res.compression.compressedSize)} (giảm ${res.compression.savedPercent}%)`
        );
      } else {
        message.success('Tải ảnh đại diện thành công!');
      }
    } catch (err: any) {
      console.error('Upload avatar error:', err);
      message.error(err.message || 'Lỗi tải ảnh đại diện lên bộ nhớ.');
    } finally {
      setAvatarUploading(false);
    }
    return false; // Prevent Antd default post upload
  };

  // Apply custom direct URL
  const handleApplyCustomAvatar = () => {
    if (!customAvatarInput.trim()) {
      message.warning('Vui lòng nhập đường link ảnh hợp lệ.');
      return;
    }
    setAvatarUrl(customAvatarInput.trim());
    setCustomAvatarInput('');
    message.success('Đã áp dụng đường link ảnh đại diện mới!');
  };

  // Submit profile changes & SYNC with BCH tab
  const handleSaveProfile = async (values: any) => {
    try {
      setSaving(true);
      const cleanStudentId = values.studentId?.trim().toUpperCase() || null;
      const cleanPhone = values.phone?.trim() || null;
      const cleanDisplayName = values.displayName?.trim();
      const cleanClassName = values.className?.trim() || null;
      const cleanCohort = values.cohort?.trim() || null;
      const cleanBio = values.bio?.trim() || null;
      const cleanFacebook = values.facebookUrl?.trim() || null;
      const cleanPosition = values.position?.trim() || null;

      // 1. Tìm hoặc xác định bản ghi BCH cần đồng bộ
      let bchMemberToSync = linkedMember;
      if (!bchMemberToSync && currentUser) {
        bchMemberToSync = await memberService.findMemberByUserInfo({
          linkedMemberId: currentUser.linkedMemberId,
          studentId: cleanStudentId || currentUser.studentId,
          email: currentUser.email,
          userId: currentUser.uid,
        });
      }

      // 2. Nếu tìm thấy nhân sự BCH tương ứng, đồng bộ ngay sang collection BCH!
      if (bchMemberToSync) {
        await memberService.syncMemberProfile(bchMemberToSync.id, {
          fullName: cleanDisplayName,
          avatarUrl: avatarUrl || bchMemberToSync.avatarUrl,
          phone: cleanPhone,
          studentId: cleanStudentId,
          className: cleanClassName,
          cohort: cleanCohort,
          facebook: cleanFacebook,
          email: currentUser?.email || bchMemberToSync.email,
          userId: currentUser?.uid,
        });

        // Cập nhật state local
        setLinkedMember({
          ...bchMemberToSync,
          fullName: cleanDisplayName,
          avatarUrl: avatarUrl || bchMemberToSync.avatarUrl,
          phone: cleanPhone,
          studentId: cleanStudentId,
          className: cleanClassName,
          cohort: cleanCohort,
          facebook: cleanFacebook,
          email: currentUser?.email || bchMemberToSync.email,
          userId: currentUser?.uid,
        });
      }

      // 3. Cập nhật hồ sơ tài khoản AdminUser
      const updatedUser = await authService.updateCurrentUserProfile({
        displayName: cleanDisplayName,
        photoURL: avatarUrl || null,
        phone: cleanPhone,
        studentId: cleanStudentId,
        className: cleanClassName,
        cohort: cleanCohort,
        bio: cleanBio,
        facebookUrl: cleanFacebook,
        position: cleanPosition || bchMemberToSync?.position || null,
        linkedMemberId: bchMemberToSync?.id || currentUser?.linkedMemberId || null,
      });

      setCurrentUser(updatedUser);

      if (bchMemberToSync) {
        message.success('Cập nhật hồ sơ cá nhân và đồng bộ với tab Ban Chấp hành thành công!');
      } else {
        message.success('Cập nhật hồ sơ cá nhân thành công!');
      }
    } catch (err: any) {
      console.error('Lỗi khi cập nhật hồ sơ:', err);
      message.error(err.message || 'Không thể lưu thông tin hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  // Submit password change
  const handleChangePassword = async (values: any) => {
    try {
      setSaving(true);
      await authService.updateCurrentUserProfile({
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      message.success('Đổi mật khẩu tài khoản thành công!');
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      message.error(err.message || 'Không thể thay đổi mật khẩu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu hồ sơ cá nhân và thông tin BCH..." />
      </div>
    );
  }

  // If role is not allowed (e.g. interviewer, recruiter, editor)
  if (!isAllowed) {
    return (
      <Result
        status="403"
        title="403 - Giới hạn quyền truy cập"
        subTitle="Trang Hồ sơ cá nhân quản lý chỉ dành cho các vai trò Lãnh đạo và Điều hành: [Bí thư, Phó Bí thư, Trưởng ban, Phó ban, Quản trị viên]."
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại trang trước
          </Button>
        }
      />
    );
  }

  const roleConfig = currentUser ? ROLE_PERMISSIONS[currentUser.role] : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Banner & Card Overview */}
      <Card
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Banner Gradient Header */}
        <div
          style={{
            height: '140px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%)',
            position: 'relative',
          }}
        />

        {/* Profile User Info Row */}
        <div style={{ padding: '0 32px 24px', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            {/* Avatar & Display Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '-55px' }}>
              <div style={{ position: 'relative', flexShrink: 0, zIndex: 10 }}>
                <Avatar
                  size={110}
                  src={avatarUrl || undefined}
                  style={{
                    backgroundColor: '#0284c7',
                    border: '4px solid #ffffff',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                  }}
                >
                  {currentUser?.displayName?.[0]?.toUpperCase() || 'A'}
                </Avatar>
              </div>

              <div style={{ paddingTop: '58px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                  }}
                >
                  {currentUser?.displayName || 'Cán bộ Lãnh đạo LCĐ'}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <Tag
                    color="blue"
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                    }}
                  >
                    <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {roleConfig?.label || currentUser?.role}
                  </Tag>

                  {(currentUser?.position || linkedMember?.position) && (
                    <Tag
                      color="purple"
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      ★ {currentUser?.position || linkedMember?.position}
                    </Tag>
                  )}

                  {currentUser?.departmentName && (
                    <Tag
                      color="cyan"
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Building2 size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {currentUser.departmentName}
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Form Tabs */}
      <Row gutter={[24, 24]}>
        {/* Left Column: Avatar & Quick Info */}
        <Col xs={24} lg={8}>
          {/* Avatar Management Card */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <Camera size={18} color="#0284c7" /> Cập nhật Ảnh đại diện
              </div>
            }
            style={{ borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Avatar
                size={120}
                src={avatarUrl || undefined}
                style={{
                  backgroundColor: '#0284c7',
                  border: '3px solid #e0f2fe',
                  marginBottom: '14px',
                  fontSize: '2.8rem',
                  fontWeight: 700,
                }}
              >
                {currentUser?.displayName?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
                Hỗ trợ ảnh JPG, PNG, WEBP. Hệ thống tự động cắt khung tròn và tối ưu nén WebP tốc độ cao.
              </div>

              {/* Upload with ImgCrop & Antd Upload */}
              <ImgCrop
                rotationSlider
                aspect={1}
                cropShape="round"
                showGrid
                quality={1}
                modalTitle="Cắt & Điều chỉnh ảnh đại diện"
                modalOk="Cắt & Tải lên"
                modalCancel="Hủy"
                resetText="Đặt lại"
                showReset
              >
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleUploadAvatar}
                >
                  <Button
                    type="primary"
                    icon={<Camera size={16} />}
                    loading={avatarUploading}
                    block
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      background: '#0284c7',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
                    }}
                  >
                    Tải ảnh & Cắt ảnh đại diện
                  </Button>
                </Upload>
              </ImgCrop>
            </div>

            <Divider style={{ margin: '16px 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              hoặc dán link ảnh trực tiếp
            </Divider>

            {/* Custom Link Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                placeholder="https://example.com/avatar.jpg"
                value={customAvatarInput}
                onChange={(e) => setCustomAvatarInput(e.target.value)}
                onPressEnter={handleApplyCustomAvatar}
                prefix={<LinkIcon size={14} color="#94a3b8" />}
                style={{ borderRadius: '8px' }}
              />
              <Button onClick={handleApplyCustomAvatar} style={{ borderRadius: '8px', fontWeight: 600 }}>
                Gán
              </Button>
            </div>
          </Card>
        </Col>

        {/* Right Column: Information Tabs (Edit Profile & Change Password) */}
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <Tabs
              defaultActiveKey="general"
              items={[
                {
                  key: 'general',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <User size={16} /> Thông tin cá nhân
                    </span>
                  ),
                  children: (
                    <Form
                      form={profileForm}
                      layout="vertical"
                      onFinish={handleSaveProfile}
                      requiredMark="optional"
                      style={{ marginTop: '10px' }}
                    >


                      <Row gutter={16}>
                        {/* Họ và tên */}
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="displayName"
                            label="Họ và tên cán bộ"
                            rules={[{ required: true, message: 'Vui lòng nhập họ và tên của bạn' }]}
                          >
                            <Input
                              prefix={<User size={16} color="#94a3b8" />}
                              placeholder="Ví dụ: Nguyễn Văn An"
                              size="large"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Email (Readonly) */}
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="email"
                            label="Địa chỉ Email (Đăng nhập)"
                            tooltip="Email được liên kết với tài khoản xác thực Firebase, không thể sửa trực tiếp."
                          >
                            <Input
                              prefix={<Mail size={16} color="#94a3b8" />}
                              disabled
                              size="large"
                              style={{ borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#64748b' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Chức vụ BCH */}
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="position"
                            label="Chức vụ đảm nhiệm (BCH / Đơn vị)"
                            tooltip="Chức vụ hiển thị trong hệ thống và danh sách Ban Chấp hành (ví dụ Bí thư LCĐ, Phó Bí thư LCĐ, Trưởng ban Truyền thông...)"
                          >
                            <Input
                              prefix={<ShieldCheck size={16} color="#94a3b8" />}
                              placeholder="Ví dụ: Bí thư Liên chi đoàn, Trưởng ban..."
                              size="large"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Mã sinh viên */}
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="studentId"
                            label="Mã Sinh viên (MSV)"
                            tooltip="Mã sinh viên được dùng để liên kết chính xác với hồ sơ của bạn bên tab Ban Chấp hành"
                            rules={[{ required: true, message: 'Vui lòng nhập mã sinh viên' }]}
                          >
                            <Input
                              prefix={<GraduationCap size={16} color="#94a3b8" />}
                              placeholder="Ví dụ: B21DCAT001"
                              size="large"
                              style={{ borderRadius: '8px', textTransform: 'uppercase' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Số điện thoại */}
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="phone"
                            label="Số điện thoại liên hệ"
                            rules={[
                              { required: true, message: 'Vui lòng nhập số điện thoại' },
                              {
                                pattern: /(84|0[3|5|7|8|9])+([0-9]{8})\b/,
                                message: 'Số điện thoại không đúng định dạng VN',
                              },
                            ]}
                          >
                            <Input
                              prefix={<Phone size={16} color="#94a3b8" />}
                              placeholder="Ví dụ: 0987654321"
                              size="large"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Khóa */}
                        <Col xs={24} sm={12}>
                          <Form.Item name="cohort" label="Khóa sinh viên">
                            <Input
                              prefix={<BookOpen size={16} color="#94a3b8" />}
                              placeholder="Ví dụ: D21, D22, D23..."
                              size="large"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Lớp sinh hoạt */}
                        <Col xs={24} sm={12}>
                          <Form.Item name="className" label="Lớp sinh hoạt">
                            <Input
                              prefix={<Building2 size={16} color="#94a3b8" />}
                              placeholder="Ví dụ: D21CQAT01-B"
                              size="large"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Link Facebook */}
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="facebookUrl"
                            label="Link trang cá nhân Facebook"
                            rules={[
                              {
                                type: 'url',
                                message: 'Vui lòng nhập đường link URL hợp lệ (bắt đầu bằng https://)',
                              },
                            ]}
                          >
                            <Input
                              prefix={<LinkIcon size={16} color="#94a3b8" />}
                              placeholder="https://facebook.com/username"
                              size="large"
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>

                        {/* Tiểu sử / Giới thiệu */}
                        <Col xs={24}>
                          <Form.Item name="bio" label="Tiểu sử / Giới thiệu ngắn">
                            <Input.TextArea
                              rows={3}
                              placeholder="Chia sẻ vài dòng về châm ngôn công tác Đoàn, sở thích hoặc định hướng hoạt động của bạn..."
                              style={{ borderRadius: '8px' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <div style={{ textAlign: 'right', marginTop: '12px' }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          icon={<Save size={18} />}
                          loading={saving}
                          style={{
                            borderRadius: '8px',
                            fontWeight: 700,
                            padding: '0 28px',
                            background: '#0284c7',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                          }}
                        >
                          Lưu thay đổi hồ sơ
                        </Button>
                      </div>
                    </Form>
                  ),
                },
                {
                  key: 'security',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Lock size={16} /> Đổi mật khẩu
                    </span>
                  ),
                  children: (
                    <Form
                      form={passwordForm}
                      layout="vertical"
                      onFinish={handleChangePassword}
                      style={{ maxWidth: '500px', marginTop: '10px' }}
                    >
                      <Alert
                        message="Bảo mật tài khoản"
                        description="Mật khẩu mới phải có tối thiểu 6 ký tự. Hãy sử dụng kết hợp chữ cái, số và ký tự đặc biệt để đảm bảo an toàn tối đa cho tài khoản quản trị."
                        type="warning"
                        showIcon
                        style={{ marginBottom: '20px', borderRadius: '8px' }}
                      />

                      <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                          { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                          { min: 6, message: 'Mật khẩu phải có tối thiểu 6 ký tự' },
                        ]}
                      >
                        <Input.Password
                          prefix={<KeyRound size={16} color="#94a3b8" />}
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                          size="large"
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        dependencies={['newPassword']}
                        rules={[
                          { required: true, message: 'Vui lòng xác nhận lại mật khẩu mới' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          prefix={<KeyRound size={16} color="#94a3b8" />}
                          placeholder="Nhập lại mật khẩu mới vừa nhập"
                          size="large"
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>

                      <div style={{ marginTop: '16px' }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          size="large"
                          icon={<CheckCircle2 size={18} />}
                          loading={saving}
                          danger
                          style={{
                            borderRadius: '8px',
                            fontWeight: 700,
                            padding: '0 24px',
                          }}
                        >
                          Cập nhật mật khẩu mới
                        </Button>
                      </div>
                    </Form>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
