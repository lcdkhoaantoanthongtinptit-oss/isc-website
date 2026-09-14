import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tag, Button, Spin, Row, Col } from 'antd';
import { ArrowLeft, Clock, MapPin, Share2, Calendar, ShieldCheck } from 'lucide-react';
import { activityService } from '../../services/activity.service';
import { Activity } from '../../types';
import dayjs from 'dayjs';

export const ActivityDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await activityService.getActivityBySlug(slug);
        setActivity(data);
      } catch (err) {
        console.error('Error loading activity detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slug]);

  function formatDetailDate(dateVal: any): string {
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

  if (loading) {
    return (
      <div style={{ padding: '120px 0', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container-custom" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Không tìm thấy hoạt động</h2>
        <p style={{ color: '#64748b' }}>Hoạt động bạn tìm kiếm không tồn tại hoặc đã bị gỡ xuống.</p>
        <Link to="/hoat-dong">
          <Button type="primary">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cyber-bg-pattern" style={{ minHeight: '85vh', padding: '40px 0 90px' }}>
      <div className="container-custom">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/hoat-dong"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.92rem',
            }}
          >
            <ArrowLeft size={16} /> Tất cả Hoạt động
          </Link>
        </div>

        <div style={{ maxWidth: '880px', margin: '0 auto' }}>
          {/* Category & Badge */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <Tag color="blue" style={{ fontWeight: 600, fontSize: '0.9rem', padding: '4px 12px' }}>
              {activity.category}
            </Tag>
            {activity.isFeatured && (
              <Tag color="orange" style={{ fontWeight: 600, fontSize: '0.9rem', padding: '4px 12px' }}>
                Nổi bật
              </Tag>
            )}
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 2.8rem)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.25,
              marginBottom: '18px',
            }}
          >
            {activity.title}
          </h1>

          {/* Meta Information Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              color: '#64748b',
              fontSize: '0.92rem',
              paddingBottom: '24px',
              marginBottom: '28px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#0284c7" />
              <span>{formatDetailDate(activity.eventDate)}</span>
            </span>
            {activity.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} color="#0284c7" />
                <span>{activity.location}</span>
              </span>
            )}
          </div>

          {/* Featured Image */}
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '36px',
              boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.12)',
              backgroundColor: '#0f172a',
            }}
          >
            <img
              src={
                activity.thumbnailUrl ||
                'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
              }
              alt={activity.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop';
              }}
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Main Content Card */}
          <div
            className="glass-card"
            style={{
              padding: '36px 32px',
              backgroundColor: '#ffffff',
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: '#334155',
            }}
          >
            <p style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.15rem', marginBottom: '24px' }}>
              {activity.shortDescription}
            </p>
            <div style={{ whiteSpace: 'pre-line' }}>{activity.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
