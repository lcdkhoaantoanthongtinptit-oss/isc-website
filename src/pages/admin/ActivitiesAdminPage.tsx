import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Upload,
  message,
  Popconfirm,
  Tag,
  Image,
} from 'antd';
import { Plus, Edit2, Trash2, UploadCloud, Calendar, Clock } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { activityService } from '../../services/activity.service';
import { storageService } from '../../services/storage.service';
import { Activity } from '../../types';
import dayjs from 'dayjs';

const CATEGORIES = [
  'Học thuật',
  'Công nghệ',
  'Sự kiện',
  'Phong trào',
  'Kỹ năng',
  'Tình nguyện',
  'Văn nghệ',
  'Thể thao',
  'Đoàn Hội',
];

export const ActivitiesAdminPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getActivities(false);
      setActivities(data);
    } catch (err) {
      message.error('Lỗi khi tải danh sách hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setThumbnailUrl('');
    form.resetFields();
    form.setFieldsValue({
      category: 'Công nghệ',
      isFeatured: false,
      isPublished: true,
      eventDate: dayjs(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setThumbnailUrl(act.thumbnailUrl);
    form.resetFields();
    form.setFieldsValue({
      ...act,
      eventDate: dayjs(act.eventDate as string),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await activityService.deleteActivity(id);
      message.success('Đã xóa hoạt động thành công.');
      loadActivities();
    } catch (err: any) {
      message.error('Không thể xóa hoạt động: ' + err.message);
    }
  };

  const handleUploadImage = async (file: File) => {
    try {
      setUploading(true);
      const url = await storageService.uploadImage(`activities/${Date.now()}_${file.name}`, file);
      setThumbnailUrl(url);
      message.success('Tải ảnh đại diện thành công!');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tải ảnh.');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleFormSubmit = async (values: any) => {
    if (!thumbnailUrl) {
      message.warning('Vui lòng tải lên ảnh đại diện hoặc nhập URL ảnh cho hoạt động.');
      return;
    }

    try {
      const slug =
        values.slug ||
        values.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      const payload = {
        title: values.title,
        slug,
        shortDescription: values.shortDescription,
        description: values.description,
        thumbnailUrl,
        category: values.category,
        location: values.location || '',
        eventDate: values.eventDate.toISOString(),
        isFeatured: Boolean(values.isFeatured),
        isPublished: Boolean(values.isPublished),
      };

      if (editingActivity) {
        await activityService.updateActivity(editingActivity.id, payload);
        message.success('Cập nhật hoạt động thành công!');
      } else {
        await activityService.createActivity(payload);
        message.success('Thêm hoạt động mới thành công!');
      }
      setIsModalOpen(false);
      loadActivities();
    } catch (err: any) {
      message.error(err.message || 'Thao tác không thành công.');
    }
  };

  const columns: ColumnsType<Activity> = [
    {
      title: 'Ảnh',
      dataIndex: 'thumbnailUrl',
      key: 'thumbnailUrl',
      width: 90,
      render: (url) => (
        <Image
          src={url}
          alt="thumb"
          width={70}
          height={46}
          style={{ objectFit: 'cover', borderRadius: '6px' }}
        />
      ),
    },
    {
      title: 'Tên hoạt động',
      dataIndex: 'title',
      key: 'title',
      render: (txt, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{txt}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>/{r.slug}</div>
        </div>
      ),
    },
    {
      title: 'Chuyên mục',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: 'Ngày tổ chức',
      dataIndex: 'eventDate',
      key: 'eventDate',
      width: 130,
      render: (d) => dayjs(d as string).format('DD/MM/YYYY'),
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      width: 100,
      render: (feat, r) => (
        <Switch
          checked={feat}
          size="small"
          onChange={async (val) => {
            await activityService.updateActivity(r.id, { isFeatured: val });
            loadActivities();
          }}
        />
      ),
    },
    {
      title: 'Hiển thị',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 100,
      render: (pub, r) => (
        <Switch
          checked={pub}
          size="small"
          onChange={async (val) => {
            await activityService.updateActivity(r.id, { isPublished: val });
            loadActivities();
          }}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 110,
      render: (_, r) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit2 size={16} color="#0284c7" />}
            onClick={() => handleOpenEdit(r)}
          />
          <Popconfirm
            title="Xóa hoạt động này?"
            description="Dữ liệu sau khi xóa sẽ không thể phục hồi."
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
            Quản lý Hoạt động & Sự kiện
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Tổng số: {activities.length} sự kiện
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          style={{ background: '#0284c7' }}
        >
          Thêm hoạt động mới
        </Button>
      </div>

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
          dataSource={activities}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 900 }}
        />
      </div>

      {/* Modal Add / Edit */}
      <Modal
        title={
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {editingActivity ? 'Chỉnh sửa hoạt động' : 'Thêm hoạt động mới'}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={750}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '16px' }}>
          <Form.Item
            name="title"
            label="Tên hoạt động / sự kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tên hoạt động!' }]}
          >
            <Input placeholder="Ví dụ: Giải đấu Cyber Security CTF Challenge 2026" />
          </Form.Item>

          <Form.Item name="slug" label="Đường dẫn tĩnh (Slug - Để trống sẽ tự sinh theo tiêu đề)">
            <Input placeholder="giai-dau-cyber-security-ctf-2026" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Form.Item
              name="category"
              label="Chuyên mục"
              rules={[{ required: true, message: 'Vui lòng chọn chuyên mục!' }]}
            >
              <Select>
                {CATEGORIES.map((c) => (
                  <Select.Option key={c} value={c}>
                    {c}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="eventDate"
              label="Ngày diễn ra"
              rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
            >
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item name="location" label="Địa điểm tổ chức">
              <Input placeholder="Ví dụ: Hội trường A2" />
            </Form.Item>
          </div>

          <Form.Item label="Ảnh đại diện (Thumbnail)">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUploadImage}
              >
                <Button icon={<UploadCloud size={16} />} loading={uploading}>
                  Tải ảnh lên Storage
                </Button>
              </Upload>
              <Input
                placeholder="Hoặc dán URL ảnh trực tiếp"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            {thumbnailUrl && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={thumbnailUrl}
                  alt="preview"
                  style={{ width: '180px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item
            name="shortDescription"
            label="Mô tả ngắn"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn!' }]}
          >
            <Input.TextArea rows={2} placeholder="Tóm tắt ngắn gọn nội dung sự kiện..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Nội dung chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập chi tiết sự kiện!' }]}
          >
            <Input.TextArea rows={5} placeholder="Thông tin chi tiết về thể lệ, diễn giả, lịch trình..." />
          </Form.Item>

          <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
            <Form.Item name="isFeatured" label="Ghim nổi bật trên trang chủ" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isPublished" label="Xuất bản công khai" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#0284c7' }}>
              {editingActivity ? 'Lưu cập nhật' : 'Thêm hoạt động'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
