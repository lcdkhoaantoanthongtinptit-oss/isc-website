import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  Input,
  Select,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Slider,
  InputNumber,
  Form,
  message,
  Divider,
  Avatar,
  Typography,
  Empty,
  Spin,
} from 'antd';
import {
  Search,
  UserCheck,
  Award,
  Phone,
  Mail,
  Building2,
  ExternalLink,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Printer,
  Sparkles,
  HeartHandshake,
  Flame,
  Wrench,
  BookOpen,
} from 'lucide-react';
import { collaboratorService } from '../../services/collaborator.service';
import { departmentService } from '../../services/department.service';
import { authService } from '../../services/auth.service';
import { Collaborator, CollaboratorStatus, Department, AdminUser } from '../../types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

// Check if candidate has been interviewed
const isCandidateInterviewed = (candidate?: Collaborator | null) => {
  if (!candidate) return false;
  return Boolean(
    (candidate.interviewStatus && candidate.interviewStatus !== 'CHUA_PV') ||
    (candidate.interviewScore !== undefined && candidate.interviewScore !== null)
  );
};

// Render interviewed badge: chỉ hiện Đã phỏng vấn hay Chưa phỏng vấn
const renderInterviewedStatusBadge = (candidate?: Collaborator | null) => {
  if (isCandidateInterviewed(candidate)) {
    return (
      <Tag color="success" style={{ borderRadius: '6px', fontWeight: 700 }}>
        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
        Đã phỏng vấn
      </Tag>
    );
  }
  return (
    <Tag color="default" style={{ borderRadius: '6px', fontWeight: 600 }}>
      Chưa phỏng vấn
    </Tag>
  );
};

export const InterviewSearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<string>('ALL');

  // Active selected candidate for interview
  const [selectedCandidate, setSelectedCandidate] = useState<Collaborator | null>(null);

  // Form for scoring
  const [form] = Form.useForm();

  // Department name helper
  const getDeptName = (id?: string | null) => {
    if (!id) return null;
    const found = departments.find((d) => d.id === id);
    return found ? found.name : id;
  };

  // Handle selecting candidate
  const handleSelectCandidate = (candidate?: Collaborator | null) => {
    if (!candidate) {
      setSelectedCandidate(null);
      return;
    }
    setSelectedCandidate(candidate);

    // Initialize form with existing score & assessment
    const criteria = candidate.interviewCriteriaScores || {};
    form.setFieldsValue({
      interviewScore: candidate.interviewScore ?? 7,
      attitude: criteria.attitude ?? 8,
      communication: criteria.communication ?? 7,
      professionalSkills: criteria.professionalSkills ?? 7,
      commitment: criteria.commitment ?? 8,
      interviewStatus: candidate.interviewStatus || 'DANG_PV',
      interviewEvaluation: candidate.interviewEvaluation || candidate.adminNote || '',
    });
  };

  // ONLY load static metadata (departments & user), NO candidates preloaded!
  useEffect(() => {
    async function loadMetadata() {
      try {
        setInitialLoading(true);
        const [depts, user] = await Promise.all([
          departmentService.getDepartments(),
          authService.getCurrentUser(),
        ]);
        setDepartments(depts);
        setCurrentUser(user);
      } catch (err) {
        console.error('Error loading metadata:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadMetadata();
  }, []);

  // Handle explicit on-demand search
  const handleSearch = async () => {
    const q = searchInput.trim();
    if (!q) {
      setActiveSearchQuery('');
      setSearchResults([]);
      message.info('Vui lòng nhập MSSV, Họ tên hoặc SĐT để tìm kiếm.');
      return;
    }

    try {
      setSearchLoading(true);
      setActiveSearchQuery(q);
      const results = await collaboratorService.searchCollaboratorsForInterview(q);
      setSearchResults(results);

      // Auto-select if exactly 1 candidate matches
      if (results.length === 1) {
        handleSelectCandidate(results[0]);
      } else if (results.length === 0) {
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      message.error('Lỗi khi tra cứu thí sinh.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Filtered list: Filters the current search results by department/status
  const filteredCandidates = useMemo(() => {
    if (!activeSearchQuery) {
      return [];
    }

    return searchResults.filter((item) => {
      const matchDept =
        deptFilter === 'ALL' ||
        item.appliedDepartmentId === deptFilter ||
        item.acceptedDepartmentId === deptFilter;

      const currentIntStatus = item.interviewStatus || 'CHUA_PV';
      const matchIntStatus =
        interviewStatusFilter === 'ALL' ||
        currentIntStatus === interviewStatusFilter ||
        (interviewStatusFilter === 'CHUA_PV' && (!item.interviewStatus || item.interviewStatus === 'CHUA_PV'));

      return matchDept && matchIntStatus;
    });
  }, [searchResults, activeSearchQuery, deptFilter, interviewStatusFilter]);

  // Auto-select if exactly 1 candidate matches search query
  useEffect(() => {
    if (filteredCandidates.length === 1) {
      if (selectedCandidate?.id !== filteredCandidates[0].id) {
        handleSelectCandidate(filteredCandidates[0]);
      }
    }
  }, [filteredCandidates]);

  // Quick calculate overall average score
  const handleValuesChange = (_: any, allValues: any) => {
    const { attitude, communication, professionalSkills, commitment } = allValues;
    if (
      typeof attitude === 'number' &&
      typeof communication === 'number' &&
      typeof professionalSkills === 'number' &&
      typeof commitment === 'number'
    ) {
      const avg = Number(((attitude + communication + professionalSkills + commitment) / 4).toFixed(1));
      form.setFieldsValue({ interviewScore: avg });
    }
  };

  // Save interview assessment
  const handleSaveAssessment = async (values: any) => {
    if (!selectedCandidate) return;

    try {
      setSaving(true);
      const isPassed = values.interviewStatus === 'DAT';
      const isFailed = values.interviewStatus === 'KHONG_DAT';
      const finalCollabStatus: CollaboratorStatus = isPassed
        ? 'PASSED'
        : isFailed
          ? 'FAILED'
          : 'PENDING';

      const updatePayload: Partial<Collaborator> = {
        interviewScore: values.interviewScore,
        interviewStatus: values.interviewStatus,
        interviewEvaluation: values.interviewEvaluation,
        adminNote: values.interviewEvaluation,
        interviewerName: currentUser?.displayName || currentUser?.email || 'Cán bộ PV',
        interviewDate: new Date().toISOString(),
        interviewCriteriaScores: {
          attitude: values.attitude,
          communication: values.communication,
          professionalSkills: values.professionalSkills,
          commitment: values.commitment,
        },
        status: finalCollabStatus,
        // If passed and no accepted department yet, default to applied department
        ...(isPassed && !selectedCandidate.acceptedDepartmentId && selectedCandidate.appliedDepartmentId
          ? { acceptedDepartmentId: selectedCandidate.appliedDepartmentId }
          : {}),
      };

      await collaboratorService.updateInterviewAssessment(selectedCandidate.id, updatePayload);

      // Local update
      const updatedCandidate = { ...selectedCandidate, ...updatePayload };
      setSelectedCandidate(updatedCandidate);
      setSearchResults((prev) =>
        prev.map((c) => (c.id === selectedCandidate.id ? updatedCandidate : c))
      );

      message.success(`Đã lưu kết quả phỏng vấn thí sinh ${selectedCandidate.fullName}! Trạng thái CTV đã được đồng bộ.`);
    } catch (err: any) {
      console.error('Error saving interview assessment:', err);
      message.error(err.message || 'Lỗi khi lưu kết quả phỏng vấn.');
    } finally {
      setSaving(false);
    }
  };



  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        padding: '0 0 32px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
      className="interview-page-container"
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                Bàn Phỏng Vấn & Tra Cứu Thí Sinh
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.86rem' }}>
                Tra cứu nhanh hồ sơ ứng viên, xem đơn đăng ký Google Form và chấm điểm phỏng vấn trực tiếp
              </p>
            </div>
          </div>
        </div>

        {/* On-Demand Status Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

          {activeSearchQuery && (
            <Tag
              color="blue"
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Kết quả: {filteredCandidates.length} thí sinh
            </Tag>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <Row gutter={[16, 16]} style={{ marginLeft: 0, marginRight: 0 }}>
        {/* ───────────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Candidate Search & Queue List (Width 38%)       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Col xs={24} lg={10} xl={9}>
          <Card
            bordered={false}
            style={{
              borderRadius: '14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              height: 'calc(100vh - 170px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            styles={{
              body: {
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
              },
            }}
          >
            {/* Search Input Bar with explicit Submit Button */}
            <div style={{ marginBottom: '12px' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  size="large"
                  placeholder="Nhập MSSV, Họ tên hoặc SĐT..."
                  prefix={<Search size={18} color="#0284c7" style={{ marginRight: '6px' }} />}
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (!e.target.value) {
                      setActiveSearchQuery('');
                    }
                  }}
                  onPressEnter={handleSearch}
                  allowClear
                  style={{
                    borderRadius: '10px 0 0 10px',
                    height: '44px',
                    fontWeight: 600,
                  }}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<Search size={16} />}
                  onClick={handleSearch}
                  style={{
                    height: '44px',
                    borderRadius: '0 10px 10px 0',
                    fontWeight: 700,
                    background: '#0284c7',
                    padding: '0 18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Tìm kiếm
                </Button>
              </Space.Compact>
            </div>

            {/* Quick Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <Select
                value={deptFilter}
                onChange={setDeptFilter}
                style={{ flex: '1 1 140px', minWidth: '130px' }}
                options={[
                  { value: 'ALL', label: 'Tất cả ban' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
              <Select
                value={interviewStatusFilter}
                onChange={setInterviewStatusFilter}
                style={{ width: '160px', flexShrink: 0 }}
                options={[
                  { value: 'ALL', label: 'Tất cả trạng thái' },
                  { value: 'CHUA_PV', label: 'Chưa phỏng vấn' },
                  { value: 'DANG_PV', label: 'Đang phỏng vấn' },
                  { value: 'DAT', label: 'Đạt phỏng vấn' },
                  { value: 'KHONG_DAT', label: 'Không đạt' },
                  { value: 'CAN_XEM_XET', label: 'Cần xem xét' },
                ]}
              />
            </div>

            {/* Candidate List Scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {searchLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '12px', color: '#64748b' }}>Đang tra cứu hồ sơ thí sinh...</div>
                </div>
              ) : !activeSearchQuery ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      marginBottom: '14px',
                    }}
                  >
                    <Search size={26} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', marginBottom: '6px' }}>
                    Nhập thông tin & bấm nút Tìm kiếm
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.84rem', maxWidth: '270px', lineHeight: 1.5 }}>
                    Nhập <strong>Mã sinh viên (MSSV)</strong>, <strong>Họ tên</strong> hoặc <strong>SĐT</strong> rồi ấn nút <strong>Tìm kiếm</strong> (hoặc nhấn phím Enter).
                  </div>
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      fontSize: '0.78rem',
                      color: '#475569',
                    }}
                  >
                    💡 <em>Gợi ý: Tìm theo MSSV là nhanh và chính xác nhất cho từng bàn phỏng vấn.</em>
                  </div>
                </div>
              ) : filteredCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <Empty
                    description={
                      <span>
                        Không tìm thấy thí sinh nào khớp với từ khóa "<strong>{activeSearchQuery}</strong>"
                      </span>
                    }
                  />
                </div>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isSelected = selectedCandidate?.id === candidate.id;
                  const deptName = getDeptName(candidate.appliedDepartmentId);
                  const hasScore = candidate.interviewScore !== undefined && candidate.interviewScore !== null;

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleSelectCandidate(candidate)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                        boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <Avatar
                            style={{
                              backgroundColor: isSelected ? '#0284c7' : '#e2e8f0',
                              color: isSelected ? '#ffffff' : '#334155',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {candidate.fullName[0]?.toUpperCase() || 'U'}
                          </Avatar>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.94rem',
                                color: isSelected ? '#0369a1' : '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {candidate.fullName}
                            </div>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: '#64748b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#334155' }}>
                                {candidate.studentId}
                              </span>{' '}
                              • {candidate.className || 'Chưa rõ lớp'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <Tag color="blue" style={{ fontSize: '0.72rem', borderRadius: '4px' }}>
                          <Building2 size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {deptName || 'Chưa chọn ban'}
                        </Tag>
                        <div>
                          {renderInterviewedStatusBadge(candidate)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Candidate Dossier & Live Grading Console      */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Col xs={24} lg={14} xl={15}>
          {selectedCandidate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Candidate Info Dossier Header */}
              <Card
                bordered={false}
                style={{
                  borderRadius: '14px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: '20px 24px' } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Avatar
                      size={60}
                      style={{
                        backgroundColor: '#0284c7',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      {selectedCandidate.fullName[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                          {selectedCandidate.fullName}
                        </h3>
                        {renderInterviewedStatusBadge(selectedCandidate)}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>
                        Mã sinh viên:{' '}
                        <span style={{ fontWeight: 700, color: '#0284c7' }}>
                          {selectedCandidate.studentId}
                        </span>{' '}
                        • Lớp: <strong>{selectedCandidate.className || 'Chưa rõ'}</strong>
                      </div>
                    </div>
                  </div>

                  <Space>
                    {selectedCandidate.facebookUrl && (
                      <Button
                        type="default"
                        icon={<ExternalLink size={15} />}
                        href={selectedCandidate.facebookUrl}
                        target="_blank"
                        style={{ borderRadius: '8px', fontWeight: 600 }}
                      >
                        Facebook
                      </Button>
                    )}
                    <Button
                      type="default"
                      icon={<Printer size={15} />}
                      onClick={handlePrint}
                      style={{ borderRadius: '8px' }}
                    >
                      In phiếu
                    </Button>
                  </Space>
                </div>

                {/* Quick contact row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '18px',
                    marginTop: '16px',
                    padding: '10px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', minWidth: 0 }}>
                    <Phone size={15} color="#0284c7" style={{ flexShrink: 0 }} />
                    <strong>SĐT:</strong> <span style={{ wordBreak: 'break-all' }}>{selectedCandidate.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', minWidth: 0 }}>
                    <Mail size={15} color="#0284c7" style={{ flexShrink: 0 }} />
                    <strong>Email:</strong> <span style={{ wordBreak: 'break-all' }}>{selectedCandidate.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', minWidth: 0 }}>
                    <Building2 size={15} color="#0284c7" style={{ flexShrink: 0 }} />
                    <strong>Ban ứng tuyển:</strong>{' '}
                    <Tag color="cyan" style={{ fontWeight: 700, margin: 0 }}>
                      {getDeptName(selectedCandidate.appliedDepartmentId) || 'Chưa chọn'}
                    </Tag>
                  </div>
                </div>
              </Card>

              {/* Form Answers & Live Assessment Tabs */}
              <Row gutter={[16, 16]} style={{ marginLeft: 0, marginRight: 0 }}>
                {/* Application Details (Google Form) */}
                <Col xs={24} xl={12}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#0284c7" />
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Hồ Sơ Ứng Tuyển & Đơn Google Form</span>
                      </div>
                    }
                    bordered={false}
                    style={{ borderRadius: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', height: '100%' }}
                    styles={{ body: { padding: '16px 20px', maxHeight: '550px', overflowY: 'auto' } }}
                  >
                    {/* Strengths & Weaknesses */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} /> Điểm mạnh:
                      </div>
                      <Paragraph style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {selectedCandidate.strengths || <Text type="secondary">Chưa cập nhật</Text>}
                      </Paragraph>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HelpCircle size={16} /> Điểm yếu & Thách thức:
                      </div>
                      <Paragraph style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {selectedCandidate.weaknesses || <Text type="secondary">Chưa cập nhật</Text>}
                      </Paragraph>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* IT / Technical experience */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wrench size={16} /> Kỹ năng & Kinh nghiệm CNTT:
                      </div>
                      <Paragraph style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {selectedCandidate.itExperience || <Text type="secondary">Chưa cập nhật</Text>}
                      </Paragraph>
                    </div>

                    {/* Reasons to join */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Flame size={16} /> Lý do muốn tham gia LCĐ ATTT:
                      </div>
                      <Paragraph style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {selectedCandidate.reasonsToJoin || <Text type="secondary">Chưa cập nhật</Text>}
                      </Paragraph>
                    </div>

                    {/* Expectations */}
                    <div>
                      <div style={{ fontWeight: 700, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HeartHandshake size={16} /> Kỳ vọng khi trở thành CTV:
                      </div>
                      <Paragraph style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-wrap' }}>
                        {selectedCandidate.expectations || <Text type="secondary">Chưa cập nhật</Text>}
                      </Paragraph>
                    </div>
                  </Card>
                </Col>

                {/* Live Scoring & Assessment Console */}
                <Col xs={24} xl={12}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} color="#0284c7" />
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Bàn Chấm Điểm & Đánh Giá Trực Tiếp</span>
                      </div>
                    }
                    bordered={false}
                    style={{ borderRadius: '14px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
                    styles={{ body: { padding: '16px 20px' } }}
                  >
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSaveAssessment}
                      onValuesChange={handleValuesChange}
                    >
                      {/* Criteria 1: Attitude */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>1. Thái độ & Tác phong:</span>
                          <Form.Item name="attitude" noStyle>
                            <InputNumber min={1} max={10} style={{ width: '60px' }} />
                          </Form.Item>
                        </div>
                        <Form.Item name="attitude" style={{ margin: '4px 0 0' }}>
                          <Slider min={1} max={10} step={0.5} marks={{ 1: '1', 5: '5', 10: '10' }} />
                        </Form.Item>
                      </div>

                      {/* Criteria 2: Communication */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>2. Kỹ năng Giao tiếp & Tự tin:</span>
                          <Form.Item name="communication" noStyle>
                            <InputNumber min={1} max={10} style={{ width: '60px' }} />
                          </Form.Item>
                        </div>
                        <Form.Item name="communication" style={{ margin: '4px 0 0' }}>
                          <Slider min={1} max={10} step={0.5} marks={{ 1: '1', 5: '5', 10: '10' }} />
                        </Form.Item>
                      </div>

                      {/* Criteria 3: Professional Skills */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>3. Năng lực & Kiến thức chuyên môn:</span>
                          <Form.Item name="professionalSkills" noStyle>
                            <InputNumber min={1} max={10} style={{ width: '60px' }} />
                          </Form.Item>
                        </div>
                        <Form.Item name="professionalSkills" style={{ margin: '4px 0 0' }}>
                          <Slider min={1} max={10} step={0.5} marks={{ 1: '1', 5: '5', 10: '10' }} />
                        </Form.Item>
                      </div>

                      {/* Criteria 4: Commitment */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>4. Mức độ Cam kết & Nhiệt huyết:</span>
                          <Form.Item name="commitment" noStyle>
                            <InputNumber min={1} max={10} style={{ width: '60px' }} />
                          </Form.Item>
                        </div>
                        <Form.Item name="commitment" style={{ margin: '4px 0 0' }}>
                          <Slider min={1} max={10} step={0.5} marks={{ 1: '1', 5: '5', 10: '10' }} />
                        </Form.Item>
                      </div>

                      <Divider style={{ margin: '14px 0' }} />

                      {/* Final Overall Score & Result */}
                      <Row gutter={12} style={{ marginLeft: 0, marginRight: 0 }}>
                        <Col span={10}>
                          <Form.Item
                            name="interviewScore"
                            label={<span style={{ fontWeight: 700 }}>Điểm(1-10)</span>}
                            rules={[{ required: true, message: 'Nhập điểm' }]}
                          >
                            <InputNumber
                              min={0}
                              max={10}
                              step={0.1}
                              style={{ width: '100%', height: '42px', fontSize: '1.2rem', fontWeight: 800 }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={14}>
                          <Form.Item
                            name="interviewStatus"
                            label={<span style={{ fontWeight: 700 }}>Trạng thái phỏng vấn</span>}
                            rules={[{ required: true, message: 'Chọn trạng thái phỏng vấn' }]}
                          >
                            <Select
                              style={{ height: '42px' }}
                              options={[
                                {
                                  value: 'CHUA_PV',
                                  label: (
                                    <span style={{ color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }}></span>
                                      Chưa phỏng vấn
                                    </span>
                                  ),
                                },
                                {
                                  value: 'DANG_PV',
                                  label: (
                                    <span style={{ color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <Clock size={14} />
                                      Đang phỏng vấn
                                    </span>
                                  ),
                                },
                                {
                                  value: 'DAT',
                                  label: (
                                    <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <CheckCircle2 size={14} />
                                      Đạt phỏng vấn
                                    </span>
                                  ),
                                },
                                {
                                  value: 'KHONG_DAT',
                                  label: (
                                    <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <XCircle size={14} />
                                      Không đạt
                                    </span>
                                  ),
                                },
                                {
                                  value: 'CAN_XEM_XET',
                                  label: (
                                    <span style={{ color: '#d97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <HelpCircle size={14} />
                                      Cần xem xét
                                    </span>
                                  ),
                                },
                              ]}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* Notes / Assessment comments */}
                      <Form.Item
                        name="interviewEvaluation"
                        label={<span style={{ fontWeight: 700 }}>Nhận xét & Đánh giá của Cán bộ Phỏng vấn</span>}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Nhập ghi chú chi tiết về câu trả lời, ấn tượng, lý do đạt/không đạt..."
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Cán bộ chấm:{' '}
                          <strong>{selectedCandidate.interviewerName || currentUser?.displayName || 'Bạn'}</strong>
                        </div>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={saving}
                          icon={<Save size={16} />}
                          style={{
                            height: '44px',
                            padding: '0 24px',
                            fontWeight: 700,
                            borderRadius: '8px',
                            background: '#0284c7',
                          }}
                        >
                          Lưu kết quả phỏng vấn
                        </Button>
                      </div>
                    </Form>
                  </Card>
                </Col>
              </Row>
            </div>
          ) : (
            <Card
              bordered={false}
              style={{
                borderRadius: '14px',
                height: 'calc(100vh - 170px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                      Chọn một thí sinh từ danh sách bên trái
                    </h3>
                    <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                      Tìm kiếm theo MSSV hoặc Họ tên để mở hồ sơ chi tiết và bàn chấm điểm phỏng vấn
                    </p>
                  </div>
                }
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};
