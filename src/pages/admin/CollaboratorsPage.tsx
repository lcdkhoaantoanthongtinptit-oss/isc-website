import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Drawer,
  Popconfirm,
  Row,
  Col,
  Upload,
  Alert,
  Divider,
  Dropdown,
} from 'antd';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Eye,
  Edit2,
  Trash2,
  UploadCloud,
  FileText,
  Building2,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { collaboratorService } from '../../services/collaborator.service';
import { departmentService } from '../../services/department.service';
import { excelService, normalizePhoneNumber } from '../../services/excel.service';
import { Collaborator, CollaboratorStatus, Department, ExcelValidationError } from '../../types';
import dayjs from 'dayjs';

export const CollaboratorsPage: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchText, setSearchText] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDuplicateFilter, setSelectedDuplicateFilter] = useState<'ALL' | 'DUPLICATE' | 'UNIQUE'>('ALL');

  // Modals / Drawers
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);

  // Form instance
  const [form] = Form.useForm();

  // Excel Import states
  const [importing, setImporting] = useState(false);
  const [previewRecords, setPreviewRecords] = useState<Omit<Collaborator, 'id'>[]>([]);
  const [importErrors, setImportErrors] = useState<ExcelValidationError[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Load data on mount
  const loadData = async () => {
    try {
      setLoading(true);
      const [collabs, depts] = await Promise.all([
        collaboratorService.getCollaborators(),
        departmentService.getDepartments(),
      ]);
      setCollaborators(collabs);
      setDepartments(depts);
    } catch (err) {
      console.error('Error loading collaborators:', err);
      message.error('Không thể tải danh sách CTV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Department map helper
  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  // Filtered list
  const filteredData = useMemo(() => {
    return collaborators.filter((c) => {
      const matchSearch =
        searchText.trim() === '' ||
        c.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
        c.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        c.email.toLowerCase().includes(searchText.toLowerCase()) ||
        c.className.toLowerCase().includes(searchText.toLowerCase());

      const matchDept =
        selectedDeptFilter === 'ALL' ||
        c.appliedDepartmentId === selectedDeptFilter ||
        c.acceptedDepartmentId === selectedDeptFilter;

      const matchStatus =
        selectedStatusFilter === 'ALL' || c.status === selectedStatusFilter;

      const matchDuplicate =
        selectedDuplicateFilter === 'ALL' ||
        (selectedDuplicateFilter === 'DUPLICATE' && c.isDuplicate) ||
        (selectedDuplicateFilter === 'UNIQUE' && !c.isDuplicate);

      return matchSearch && matchDept && matchStatus && matchDuplicate;
    });
  }, [collaborators, searchText, selectedDeptFilter, selectedStatusFilter, selectedDuplicateFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCollaborator(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'PENDING',
      position: 'Cộng tác viên',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (record: Collaborator) => {
    setEditingCollaborator(record);
    form.resetFields();
    form.setFieldsValue({
      ...record,
    });
    setIsFormModalOpen(true);
  };

  // Open Detail Drawer
  const handleOpenDetail = (record: Collaborator) => {
    setSelectedCollaborator(record);
    setIsDetailDrawerOpen(true);
  };

  // Handle Form Submit (Create / Update)
  const handleFormSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        phone: normalizePhoneNumber(values.phone),
        appliedDepartmentId: values.appliedDepartmentId ?? (editingCollaborator?.appliedDepartmentId || ''),
        acceptedDepartmentId: values.acceptedDepartmentId ?? (editingCollaborator?.acceptedDepartmentId || null),
      };
      if (editingCollaborator) {
        // Update
        await collaboratorService.updateCollaborator(editingCollaborator.id, payload);
        message.success(`Cập nhật thông tin CTV ${values.studentId} thành công!`);
      } else {
        // Create
        await collaboratorService.createCollaborator(payload);
        message.success(`Thêm mới CTV ${values.studentId} thành công!`);
      }
      setIsFormModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || 'Thao tác không thành công.');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await collaboratorService.deleteCollaborator(id);
      message.success('Đã xóa hồ sơ CTV thành công.');
      loadData();
    } catch (err: any) {
      message.error('Không thể xóa CTV: ' + err.message);
    }
  };

  // Handle Excel File Upload & Parse
  const handleExcelUpload = async (file: File) => {
    try {
      setImporting(true);
      setImportFileName(file.name);
      const rows = await excelService.parseExcelFile(file);
      const existingMSSVs = collaborators.map((c) => c.studentId.toUpperCase());
      const { validRecords, errors, duplicateCount: dups } = excelService.validateRows(rows, departments, existingMSSVs);

      setPreviewRecords(validRecords);
      setImportErrors(errors);
      setDuplicateCount(dups);
      if (errors.length > 0) {
        message.warning(`Phát hiện ${errors.length} lỗi trong file Excel. Vui lòng kiểm tra chi tiết.`);
      } else if (dups > 0) {
        message.success(`Đã đọc ${validRecords.length} hồ sơ (${dups} bản ghi trùng đã được gắn tag). Sẵn sàng import!`);
      } else {
        message.success(`Đã đọc ${validRecords.length} hồ sơ hợp lệ. Sẵn sàng import!`);
      }
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi đọc file Excel.');
    } finally {
      setImporting(false);
    }
    return false; // Prevent automatic HTTP post
  };

  // Commit Batch Import
  const handleConfirmImport = async () => {
    if (previewRecords.length === 0) {
      message.warning('Không có bản ghi hợp lệ nào để import.');
      return;
    }
    try {
      setImporting(true);
      const res = await collaboratorService.batchCreateCollaborators(previewRecords);
      message.success(`Import thành công ${res.inserted + res.updated} CTV vào hệ thống!`);
      setIsImportModalOpen(false);
      setPreviewRecords([]);
      setImportErrors([]);
      loadData();
    } catch (err: any) {
      message.error('Lỗi khi import batch: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Export Excel Handlers
  const handleExport = (type: 'ALL' | 'FILTERED' | 'PASSED' | 'FAILED') => {
    let toExport = collaborators;
    let fileNameSuffix = 'Tat_ca';

    if (type === 'FILTERED') {
      toExport = filteredData;
      fileNameSuffix = 'Loc_hien_tai';
    } else if (type === 'PASSED') {
      toExport = collaborators.filter((c) => c.status === 'PASSED');
      fileNameSuffix = 'Trung_tuyen';
    } else if (type === 'FAILED') {
      toExport = collaborators.filter((c) => c.status === 'FAILED');
      fileNameSuffix = 'Khong_trung_tuyen';
    }

    if (toExport.length === 0) {
      message.warning('Không có dữ liệu phù hợp để xuất Excel.');
      return;
    }

    excelService.exportToExcel(toExport, departments, `Danh_sach_CTV_${fileNameSuffix}.xlsx`);
    message.success(`Đã xuất thành công ${toExport.length} hồ sơ CTV ra file Excel!`);
  };

  const exportMenuItems = [
    {
      key: 'export-filtered',
      label: `Xuất dữ liệu đang lọc (${filteredData.length} CTV)`,
      onClick: () => handleExport('FILTERED'),
    },
    {
      key: 'export-all',
      label: `Xuất toàn bộ danh sách (${collaborators.length} CTV)`,
      onClick: () => handleExport('ALL'),
    },
    {
      key: 'export-passed',
      label: 'Chỉ xuất CTV Trúng tuyển (PASSED)',
      onClick: () => handleExport('PASSED'),
    },
    {
      key: 'export-failed',
      label: 'Chỉ xuất CTV Không trúng tuyển (FAILED)',
      onClick: () => handleExport('FAILED'),
    },
  ];

  // Ant Design Table Columns
  const columns: ColumnsType<Collaborator> = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, idx) => idx + 1,
    },
    {
      title: 'Mã SV',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 140,
      sorter: (a, b) => a.studentId.localeCompare(b.studentId),
      render: (txt, record) => (
        <div>
          <span
            onClick={() => handleOpenDetail(record)}
            style={{ color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
          >
            {txt}
          </span>
          {record.isDuplicate && (
            <div style={{ marginTop: '2px' }}>
              <Tag color="volcano" style={{ fontSize: '0.7rem', fontWeight: 700, margin: 0, padding: '0 4px' }}>
                {record.duplicateTag || 'Trùng lặp'}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 180,
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      render: (txt, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{txt}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{record.className}</div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 200,
      render: (_, record) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>{record.email}</div>
          <div style={{ color: '#64748b' }}>{record.phone}</div>
        </div>
      ),
    },
    {
      title: 'Lớp',
      dataIndex: 'className',
      key: 'className',
      width: 140,
      render: (cls) => cls || '—',
    },
    {
      title: 'Facebook',
      dataIndex: 'facebookUrl',
      key: 'facebookUrl',
      width: 130,
      render: (url) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.84rem' }}
          >
            Xem Facebook
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'Trúng tuyển', value: 'PASSED' },
        { text: 'Đang chờ', value: 'PENDING' },
        { text: 'Không trúng tuyển', value: 'FAILED' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: CollaboratorStatus) => {
        if (status === 'PASSED') {
          return (
            <Tag color="success" style={{ fontWeight: 600 }}>
              Trúng tuyển
            </Tag>
          );
        }
        if (status === 'PENDING') {
          return (
            <Tag color="processing" style={{ fontWeight: 600 }}>
              Đang chờ
            </Tag>
          );
        }
        return (
          <Tag color="default" style={{ fontWeight: 600 }}>
            Không trúng tuyển
          </Tag>
        );
      },
    },
    {
      title: 'Ngày cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date) => (date ? dayjs(date as string).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Eye size={16} color="#0284c7" />}
            onClick={() => handleOpenDetail(record)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            icon={<Edit2 size={16} color="#d97706" />}
            onClick={() => handleOpenEdit(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Xóa hồ sơ CTV"
            description={`Bạn có chắc chắn muốn xóa hồ sơ ${record.fullName} (${record.studentId})?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              title="Xóa"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header & Main Actions */}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Quản lý danh sách Cộng tác viên (CTV)
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Tổng số: <strong>{collaborators.length}</strong> ứng viên (Đang hiển thị: {filteredData.length})
          </p>
        </div>

        <Space wrap>
          {/* Download Sample Template */}
          <Button
            icon={<Download size={16} />}
            onClick={() => excelService.downloadTemplate(departments)}
          >
            Tải mẫu Excel
          </Button>

          {/* Import Excel */}
          <Button
            icon={<UploadCloud size={16} />}
            onClick={() => {
              setPreviewRecords([]);
              setImportErrors([]);
              setIsImportModalOpen(true);
            }}
          >
            Import Excel
          </Button>

          {/* Export Excel Dropdown */}
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<FileSpreadsheet size={16} />}>
              Export Excel
            </Button>
          </Dropdown>

          {/* Add New Button */}
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            style={{ background: '#0284c7' }}
          >
            Thêm CTV mới
          </Button>
        </Space>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {/* Search */}
        <Input
          prefix={<Search size={16} color="#94a3b8" style={{ marginRight: '4px' }} />}
          placeholder="Tìm theo MSSV, Họ tên, Lớp, Email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: '280px' }}
        />

        {/* Filter Department */}
        <Select
          value={selectedDeptFilter}
          onChange={setSelectedDeptFilter}
          style={{ width: '220px' }}
        >
          <Select.Option value="ALL">Tất cả các Ban</Select.Option>
          {departments.map((d) => (
            <Select.Option key={d.id} value={d.id}>
              {d.name}
            </Select.Option>
          ))}
        </Select>

        {/* Filter Status */}
        <Select
          value={selectedStatusFilter}
          onChange={setSelectedStatusFilter}
          style={{ width: '180px' }}
        >
          <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
          <Select.Option value="PASSED">Trúng tuyển</Select.Option>
          <Select.Option value="PENDING">Đang chờ</Select.Option>
          <Select.Option value="FAILED">Không trúng tuyển</Select.Option>
        </Select>

        {/* Filter Duplicate */}
        <Select
          value={selectedDuplicateFilter}
          onChange={setSelectedDuplicateFilter}
          style={{ width: '200px' }}
        >
          <Select.Option value="ALL">Tất cả bản ghi</Select.Option>
          <Select.Option value="DUPLICATE">
            Chỉ bản ghi trùng ({collaborators.filter((c) => c.isDuplicate).length})
          </Select.Option>
          <Select.Option value="UNIQUE">Chỉ bản ghi không trùng</Select.Option>
        </Select>

        {(searchText ||
          selectedDeptFilter !== 'ALL' ||
          selectedStatusFilter !== 'ALL' ||
          selectedDuplicateFilter !== 'ALL') && (
          <Button
            type="link"
            onClick={() => {
              setSearchText('');
              setSelectedDeptFilter('ALL');
              setSelectedStatusFilter('ALL');
              setSelectedDuplicateFilter('ALL');
            }}
          >
            Đặt lại bộ lọc
          </Button>
        )}
      </div>

      {/* Main Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} trong tổng số ${total} CTV`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </div>

      {/* MODAL 1: ADD / EDIT CTV */}
      <Modal
        title={
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            {editingCollaborator ? `Chỉnh sửa hồ sơ: ${editingCollaborator.studentId}` : 'Thêm hồ sơ Cộng tác viên mới'}
          </div>
        }
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          style={{ marginTop: '16px' }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="studentId"
                label="Mã sinh viên (MSSV)"
                rules={[
                  { required: true, message: 'Vui lòng nhập MSSV!' },
                  { pattern: /^[A-Za-z0-9]+$/, message: 'MSSV chỉ gồm chữ và số!' },
                ]}
              >
                <Input
                  placeholder="Ví dụ: B23DCAT001"
                  disabled={Boolean(editingCollaborator)}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input placeholder="Ví dụ: Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input placeholder="email@gmail.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input placeholder="0981234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="className"
                label="Lớp sinh hoạt"
                rules={[{ required: true, message: 'Vui lòng nhập lớp!' }]}
              >
                <Input placeholder="Ví dụ: D23CQAT01-B" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="position" label="Vị trí ứng tuyển / Đảm nhiệm">
                <Input placeholder="Ví dụ: Cộng tác viên Kỹ thuật" />
              </Form.Item>
            </Col>
          </Row>



          <Form.Item
            name="status"
            label="Trạng thái hồ sơ"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              <Select.Option value="PENDING">Đang chờ kết quả (PENDING)</Select.Option>
              <Select.Option value="PASSED">Trúng tuyển chính thức (PASSED)</Select.Option>
              <Select.Option value="FAILED">Không trúng tuyển (FAILED)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publicNote"
            label="Ghi chú hiển thị cho ứng viên khi tra cứu (Public Note)"
          >
            <Input.TextArea
              rows={2}
              placeholder="Ví dụ: Chúc mừng bạn đã trúng tuyển! Hãy kiểm tra email để tham gia group Zalo..."
            />
          </Form.Item>

          <Form.Item
            name="adminNote"
            label="Ghi chú nội bộ Ban Giám khảo / Admin (Bảo mật, ứng viên không thấy)"
          >
            <Input.TextArea
              rows={2}
              placeholder="Đánh giá kỹ năng, nhận xét chuyên môn nội bộ..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button onClick={() => setIsFormModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7' }}>
              {editingCollaborator ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* DRAWER: VIEW DETAIL */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} color="#0284c7" />
            <span style={{ fontWeight: 700 }}>Hồ sơ chi tiết CTV: {selectedCollaborator?.studentId}</span>
          </div>
        }
        placement="right"
        width={500}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
      >
        {selectedCollaborator && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Status Highlight */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                background:
                  selectedCollaborator.status === 'PASSED'
                    ? '#f0fdf4'
                    : selectedCollaborator.status === 'PENDING'
                    ? '#e0f2fe'
                    : '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TRẠNG THÁI HIỆN TẠI</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                {selectedCollaborator.status === 'PASSED' && <span style={{ color: '#166534' }}>Trúng tuyển (PASSED)</span>}
                {selectedCollaborator.status === 'PENDING' && <span style={{ color: '#0284c7' }}>Đang chờ kết quả (PENDING)</span>}
                {selectedCollaborator.status === 'FAILED' && <span style={{ color: '#475569' }}>Không trúng tuyển (FAILED)</span>}
              </div>
            </div>

            {/* Duplicate Notice in Drawer */}
            {selectedCollaborator.isDuplicate && (
              <div
                style={{
                  padding: '12px 14px',
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <AlertTriangle size={20} color="#ea580c" />
                <div>
                  <div style={{ color: '#c2410c', fontWeight: 700, fontSize: '0.88rem' }}>
                    Hồ sơ trùng lặp: {selectedCollaborator.duplicateTag || 'Trùng lặp'}
                  </div>
                  <div style={{ color: '#9a3412', fontSize: '0.78rem', marginTop: '2px' }}>
                    Mã sinh viên này có nhiều hơn 1 lượt nộp đơn hoặc đã có sẵn trong hệ thống.
                  </div>
                </div>
              </div>
            )}

            {/* Candidate details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>HỌ VÀ TÊN</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{selectedCollaborator.fullName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>MÃ SINH VIÊN</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7' }}>{selectedCollaborator.studentId}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>LỚP SINH HOẠT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedCollaborator.className}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>EMAIL LIÊN HỆ</div>
                <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedCollaborator.email}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>SỐ ĐIỆN THOẠI</div>
                <div style={{ fontSize: '0.95rem', color: '#0f172a' }}>{selectedCollaborator.phone}</div>
              </div>

              {selectedCollaborator.facebookUrl && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>LINK FACEBOOK</div>
                  <div style={{ fontSize: '0.95rem' }}>
                    <a
                      href={selectedCollaborator.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0284c7', wordBreak: 'break-all', fontWeight: 600 }}
                    >
                      {selectedCollaborator.facebookUrl}
                    </a>
                  </div>
                </div>
              )}

              {selectedCollaborator.submittedAt && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>DẤU THỜI GIAN NỘP</div>
                  <div style={{ fontSize: '0.95rem', color: '#475569' }}>{selectedCollaborator.submittedAt}</div>
                </div>
              )}

              {selectedCollaborator.appliedDepartmentId && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>BAN ĐĂNG KÝ</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {deptMap.get(selectedCollaborator.appliedDepartmentId) || selectedCollaborator.appliedDepartmentId}
                  </div>
                </div>
              )}

              {selectedCollaborator.acceptedDepartmentId && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>BAN TRÚNG TUYỂN</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>
                    {deptMap.get(selectedCollaborator.acceptedDepartmentId) || selectedCollaborator.acceptedDepartmentId}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>VỊ TRÍ</div>
                <div style={{ fontSize: '0.95rem' }}>{selectedCollaborator.position}</div>
              </div>
            </div>

            {/* Google Form Responses */}
            {(selectedCollaborator.strengths ||
              selectedCollaborator.weaknesses ||
              selectedCollaborator.interests ||
              selectedCollaborator.itExperience ||
              selectedCollaborator.reasonsToJoin ||
              selectedCollaborator.expectations ||
              selectedCollaborator.referralSource) && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0369a1', marginBottom: '8px' }}>
                    Thông tin đơn ứng tuyển (Google Form)
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                    }}
                  >
                    {selectedCollaborator.strengths && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          💪 Điểm mạnh của bản thân:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.strengths}
                        </div>
                      </div>
                    )}

                    {selectedCollaborator.weaknesses && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          ⚠️ Hạn chế của bản thân:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.weaknesses}
                        </div>
                      </div>
                    )}

                    {selectedCollaborator.interests && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          🎯 Sở trường/ sở thích/ năng khiếu:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.interests}
                        </div>
                      </div>
                    )}

                    {selectedCollaborator.itExperience && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          💻 Kiến thức, kinh nghiệm về Lập trình, tin học:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.itExperience}
                        </div>
                      </div>
                    )}

                    {selectedCollaborator.reasonsToJoin && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          ❓ Tại sao bạn lại muốn tham gia LCĐ ATTT?
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.reasonsToJoin}
                        </div>
                      </div>
                    )}

                    {selectedCollaborator.expectations && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          🌟 Mong đợi học hỏi hay nhận được điều gì nhất từ LCĐ?
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.expectations}
                        </div>
                      </div>
                    )}

                    {selectedCollaborator.referralSource && (
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          📢 Bạn biết LCĐ ATTT qua đâu?
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#334155', marginTop: '2px' }}>
                          {selectedCollaborator.referralSource}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Divider style={{ margin: '8px 0' }} />

            {/* Public Note */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                Ghi chú cho ứng viên (Công khai khi tra cứu)
              </div>
              <div
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                }}
              >
                {selectedCollaborator.publicNote || '(Chưa có ghi chú)'}
              </div>
            </div>

            {/* Admin Note */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                Ghi chú nội bộ Admin (Bảo mật)
              </div>
              <div
                style={{
                  padding: '12px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  fontSize: '0.9rem',
                  color: '#991b1b',
                }}
              >
                {selectedCollaborator.adminNote || '(Chưa có ghi chú nội bộ)'}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <Button
                type="primary"
                block
                icon={<Edit2 size={16} />}
                onClick={() => {
                  setIsDetailDrawerOpen(false);
                  handleOpenEdit(selectedCollaborator);
                }}
                style={{ background: '#0284c7' }}
              >
                Chỉnh sửa hồ sơ này
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* MODAL 2: IMPORT EXCEL */}
      <Modal
        title={
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
            Import danh sách CTV từ file Excel (.xlsx)
          </div>
        }
        open={isImportModalOpen}
        onCancel={() => setIsImportModalOpen(false)}
        footer={null}
        width={850}
        destroyOnClose
      >
        <div style={{ marginTop: '16px' }}>
          {/* Instructions */}
          <Alert
            message="Hỗ trợ file xuất trực tiếp từ Google Form hoặc Excel"
            description={
              <div>
                Hệ thống tự động nhận diện 14 trường tiêu chuẩn từ Google Form:
                <br />
                <strong>1. Dấu thời gian</strong> • <strong>2. Họ và Tên</strong> • <strong>3. Mã sinh viên</strong> • <strong>4. Lớp</strong> • <strong>5. Số điện thoại</strong> • <strong>6. Link Facebook</strong> • <strong>7. Email</strong> • <strong>8. Điểm mạnh</strong> • <strong>9. Hạn chế</strong> • <strong>10. Sở trường</strong> • <strong>11. Kinh nghiệm lập trình</strong> • <strong>12. Biết qua đâu</strong> • <strong>13. Mong đợi</strong> • <strong>14. Lý do tham gia</strong>.
                <br />
                Hệ thống sẽ tự động kiểm tra định dạng email, mã sinh viên trùng lặp và lưu toàn bộ câu trả lời phỏng vấn vào hồ sơ ứng viên.
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />

          {/* Upload Drop Area */}
          <Upload.Dragger
            name="file"
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleExcelUpload}
            style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px' }}
          >
            <p className="ant-upload-drag-icon">
              <UploadCloud size={44} color="#0284c7" style={{ margin: '0 auto' }} />
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '8px 0 4px' }}>
              Nhấp hoặc kéo thả file Excel (.xlsx) vào đây
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hỗ trợ file bảng tính tải về từ Google Form hoặc file Excel (.xlsx) chuẩn
            </p>
          </Upload.Dragger>

          {/* Duplicate Notice */}
          {duplicateCount > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Alert
                message={
                  <div style={{ fontWeight: 700, color: '#c2410c' }}>
                    Phát hiện {duplicateCount} bản ghi trùng lặp:
                  </div>
                }
                description="Các bản ghi này đã được tự động gắn cờ 'Trùng lặp' và sẽ được import đầy đủ vào hệ thống mà không ghi đè dữ liệu."
                type="warning"
                showIcon
              />
            </div>
          )}

          {/* Error Notice */}
          {importErrors.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <Alert
                message={
                  <div style={{ fontWeight: 700, color: '#dc2626' }}>
                    Phát hiện {importErrors.length} lỗi không thể bỏ qua:
                  </div>
                }
                description={
                  <div style={{ maxHeight: '140px', overflowY: 'auto', marginTop: '6px' }}>
                    {importErrors.map((err, i) => (
                      <div key={i} style={{ color: '#b91c1c', fontSize: '0.85rem' }}>
                        • {err.message}
                      </div>
                    ))}
                  </div>
                }
                type="error"
                showIcon
              />
            </div>
          )}

          {/* Preview Table */}
          {previewRecords.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: 700, marginBottom: '8px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} />
                <span>Xem trước {previewRecords.length} hồ sơ hợp lệ sẵn sàng thêm vào hệ thống:</span>
              </div>
              <Table
                dataSource={previewRecords}
                rowKey={(record, idx) => `${record.studentId}_${idx}`}
                size="small"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 750 }}
                columns={[
                  {
                    title: 'MSSV',
                    dataIndex: 'studentId',
                    key: 'studentId',
                    width: 140,
                    render: (sid, rec) => (
                      <div>
                        <span style={{ fontWeight: 700 }}>{sid}</span>
                        {rec.isDuplicate && (
                          <div style={{ marginTop: '2px' }}>
                            <Tag color="volcano" style={{ fontSize: '0.68rem', fontWeight: 700, margin: 0, padding: '0 4px' }}>
                              {rec.duplicateTag || 'Trùng lặp'}
                            </Tag>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', width: 160 },
                  { title: 'Lớp', dataIndex: 'className', key: 'className', width: 110, render: (c) => c || '—' },
                  { title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 120, render: (p) => p || '—' },
                  { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
                  {
                    title: 'Phân loại',
                    key: 'duplicate',
                    width: 130,
                    render: (_, rec) =>
                      rec.isDuplicate ? (
                        <Tag color="volcano" style={{ fontWeight: 600 }}>
                          {rec.duplicateTag || 'Trùng lặp'}
                        </Tag>
                      ) : (
                        <Tag color="cyan">Mới</Tag>
                      ),
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    width: 110,
                    render: (status) => (
                      <Tag color={status === 'PASSED' ? 'green' : status === 'PENDING' ? 'blue' : 'default'}>
                        {status}
                      </Tag>
                    ),
                  },
                ]}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <Button onClick={() => setIsImportModalOpen(false)}>Hủy bỏ</Button>
                <Button
                  type="primary"
                  loading={importing}
                  onClick={handleConfirmImport}
                  style={{ background: '#10b981', fontWeight: 700 }}
                >
                  Xác nhận Import {previewRecords.length} CTV (Batch Write)
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
