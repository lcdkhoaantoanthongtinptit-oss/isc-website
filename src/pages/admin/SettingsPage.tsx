import React, { useEffect, useState } from 'react';
import { Button, message, Spin, Switch, Alert, Card } from 'antd';
import { Save, Eye, Lock, Globe } from 'lucide-react';
import { settingsService } from '../../services/settings.service';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isResultPublic, setIsResultPublic] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Auto-purge any imagekit keys that may have leaked into the public Firestore doc
        settingsService.purgeLeakedKeysFromPublicDoc().catch(() => { });
        const data = await settingsService.getSettings();
        setIsResultPublic(Boolean(data.isResultPublic));
      } catch {
        message.error('Lỗi khi tải cài đặt.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.updateSettings({ isResultPublic });
      message.success(
        isResultPublic
          ? '✅ Đã mở cổng tra cứu kết quả. Ứng viên CTV có thể tra cứu ngay.'
          : '🔒 Đã đóng cổng tra cứu kết quả.'
      );
    } catch (err: any) {
      message.error('Lỗi khi lưu cài đặt: ' + err.message);
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

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Globe size={22} color="#0284c7" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Cài đặt hệ thống
          </h1>
        </div>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.92rem' }}>
          Quản lý trạng thái công khai kết quả xét tuyển CTV.
        </p>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: '20px', boxShadow: '0 4px 24px rgba(15,23,42,0.07)', overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Toggle section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 28px 24px',
            gap: '20px',
            borderBottom: '1px solid #f1f5f9',
            background: isResultPublic
              ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
              : '#ffffff',
            transition: 'background 0.4s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: isResultPublic
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #94a3b8, #64748b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.35s ease',
                boxShadow: isResultPublic ? '0 6px 16px rgba(16,185,129,0.35)' : '0 4px 12px rgba(100,116,139,0.2)',
              }}
            >
              {isResultPublic ? <Eye size={24} color="#ffffff" /> : <Lock size={24} color="#ffffff" />}
            </div>

            {/* Label */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '3px' }}>
                Công khai kết quả xét tuyển CTV
              </div>
              <div style={{ fontSize: '0.865rem', color: isResultPublic ? '#059669' : '#64748b', fontWeight: 500 }}>
                {isResultPublic
                  ? 'Ứng viên CTV đang có thể tra cứu kết quả tại /tra-cuu-ctv'
                  : 'Cổng tra cứu đang đóng — ứng viên chưa xem được kết quả'}
              </div>
            </div>
          </div>

          {/* Switch */}
          <Switch
            checked={isResultPublic}
            onChange={setIsResultPublic}
            style={{ backgroundColor: isResultPublic ? '#10b981' : undefined, minWidth: '52px', flexShrink: 0 }}
          />
        </div>

        {/* Status alert */}
        <div style={{ padding: '20px 28px 0', marginBottom: '20px' }}>
          {isResultPublic ? (
            <Alert
              type="success"
              showIcon
              message="Cổng tra cứu đang MỞ"
              description="Ứng viên CTV có thể truy cập /tra-cuu-ctv và nhập MSSV để xem kết quả. Bấm Lưu để áp dụng thay đổi."
              style={{ borderRadius: '12px' }}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="Cổng tra cứu đang ĐÓNG"
              description='Ứng viên CTV sẽ thấy thông báo "Kết quả chưa được công bố" khi truy cập /tra-cuu-ctv. Bật toggle và bấm Lưu để mở cổng.'
              style={{ borderRadius: '12px' }}
            />
          )}
        </div>


      </Card>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', marginBottom: '50px' }}>
        <Button
          type="primary"
          size="large"
          loading={saving}
          icon={<Save size={18} />}
          onClick={handleSave}
          style={{
            height: '48px',
            padding: '0 36px',
            fontSize: '1rem',
            fontWeight: 700,
            background: '#0284c7',
            boxShadow: '0 4px 12px rgba(2,132,199,0.3)',
          }}
        >
          Lưu thay đổi
        </Button>
      </div>
    </div>
  );
};
