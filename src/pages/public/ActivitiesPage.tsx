import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Input, Tag, Button, Skeleton, Empty } from 'antd';
import { Search, Calendar, Clock, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { activityService } from '../../services/activity.service';
import { Activity } from '../../types';
import dayjs from 'dayjs';

const CATEGORIES = ['Tất cả', 'Công nghệ', 'Học thuật', 'Tình nguyện', 'Văn nghệ', 'Thể thao', 'Đoàn Hội'];

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await activityService.getActivities(true);
        setActivities(data);
      } catch (err) {
        console.error('Error loading activities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function formatEventDate(dateVal: any): string {
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

  const filtered = activities.filter((act) => {
    const matchCategory = selectedCategory === 'Tất cả' || act.category === selectedCategory;
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="cyber-bg-pattern" style={{ minHeight: '85vh', padding: '50px 0 90px' }}>
      <div className="container-custom">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#64748b',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            <ArrowLeft size={16} /> Quay lại Trang chủ
          </Link>
        </div>

        {/* Header */}
        <div style={{ maxWidth: '700px', marginBottom: '40px' }}>
          <div className="cyber-badge" style={{ marginBottom: '12px' }}>
            <Calendar size={15} />
            <span>PHONG TRÀO THANH NIÊN KHOA ATTT</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.7rem)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              marginBottom: '12px',
            }}
          >
            Hoạt động & Sự kiện
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Tổng hợp các giải đấu CTF, Hội thảo công nghệ, Chiến dịch tình nguyện và các phong trào gắn kết sinh viên Khoa An toàn thông tin.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            marginBottom: '36px',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Categories Pill Group */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type={selectedCategory === cat ? 'primary' : 'default'}
                shape="round"
                style={{
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  borderColor: selectedCategory === cat ? '#0284c7' : '#cbd5e1',
                  background: selectedCategory === cat ? '#0284c7' : 'transparent',
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ width: '100%', maxWidth: '280px' }}>
            <Input
              prefix={<Search size={16} color="#94a3b8" style={{ marginRight: '4px' }} />}
              placeholder="Tìm kiếm sự kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <Row gutter={[24, 24]}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </Col>
            ))}
          </Row>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Empty description="Không tìm thấy hoạt động nào phù hợp với bộ lọc." />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {filtered.map((act) => (
              <Col xs={24} sm={12} lg={8} key={act.id}>
                <div
                  className="glass-card"
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ position: 'relative', height: '210px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                    <img
                      src={
                        act.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
                      }
                      alt={act.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop';
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      <Tag color="blue" style={{ fontWeight: 600, borderRadius: '4px' }}>
                        {act.category}
                      </Tag>
                      {act.isFeatured && (
                        <Tag color="orange" style={{ fontWeight: 600, borderRadius: '4px' }}>
                          Nổi bật
                        </Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        marginBottom: '10px',
                      }}
                    >
                      <Clock size={14} />
                      <span>{formatEventDate(act.eventDate)}</span>
                      {act.location && (
                        <>
                          <span style={{ margin: '0 4px' }}>•</span>
                          <MapPin size={14} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {act.location}
                          </span>
                        </>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: '1.18rem',
                        fontWeight: 700,
                        lineHeight: 1.4,
                        marginBottom: '12px',
                        color: '#0f172a',
                      }}
                    >
                      {act.title}
                    </h3>
                    <p
                      style={{
                        color: '#64748b',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        marginBottom: '20px',
                        flex: 1,
                      }}
                    >
                      {act.shortDescription}
                    </p>
                    <Link to={`/hoat-dong/${act.slug || act.id}`}>
                      <Button
                        type="default"
                        block
                        style={{
                          fontWeight: 600,
                          color: '#0284c7',
                          borderColor: '#bae6fd',
                          backgroundColor: '#f0f9ff',
                        }}
                      >
                        Xem chi tiết <ChevronRight size={15} style={{ display: 'inline' }} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};
