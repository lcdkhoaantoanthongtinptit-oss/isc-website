import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Spin } from 'antd';
import {
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { collaboratorService } from '../../services/collaborator.service';
import { Collaborator } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

export const DashboardPage: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const collabs = await collaboratorService.getCollaborators();
        setCollaborators(collabs);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Calculate statistics
  const total = collaborators.length;
  const passed = collaborators.filter((c) => c.status === 'PASSED').length;
  const pending = collaborators.filter((c) => c.status === 'PENDING').length;
  const failed = collaborators.filter((c) => c.status === 'FAILED').length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Score statistics & distribution buckets
  const scoredCollaborators = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null
  );
  const avgScore =
    scoredCollaborators.length > 0
      ? (
          scoredCollaborators.reduce((sum, c) => sum + (c.interviewScore || 0), 0) /
          scoredCollaborators.length
        ).toFixed(1)
      : '0.0';

  const countBelow5 = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null && c.interviewScore < 5
  ).length;
  const count5to6 = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null && c.interviewScore >= 5 && c.interviewScore < 6
  ).length;
  const count6to7 = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null && c.interviewScore >= 6 && c.interviewScore < 7
  ).length;
  const count7to8 = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null && c.interviewScore >= 7 && c.interviewScore < 8
  ).length;
  const count8to9 = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null && c.interviewScore >= 8 && c.interviewScore < 9
  ).length;
  const count9to10 = collaborators.filter(
    (c) => c.interviewScore !== undefined && c.interviewScore !== null && c.interviewScore >= 9 && c.interviewScore <= 10
  ).length;
  const countNoScore = collaborators.filter(
    (c) => c.interviewScore === undefined || c.interviewScore === null
  ).length;

  // Chart 1: Interview Score Distribution Bar Chart
  const scoreChartData = {
    labels: ['< 5.0 điểm', '5.0 - 5.9', '6.0 - 6.9', '7.0 - 7.9', '8.0 - 8.9', '9.0 - 10.0', 'Chưa có điểm'],
    datasets: [
      {
        label: 'Số lượng ứng viên',
        data: [countBelow5, count5to6, count6to7, count7to8, count8to9, count9to10, countNoScore],
        backgroundColor: [
          '#ef4444', // < 5: Đỏ
          '#f97316', // 5-5.9: Cam
          '#eab308', // 6-6.9: Vàng
          '#0284c7', // 7-7.9: Xanh dương
          '#10b981', // 8-8.9: Xanh lá
          '#8b5cf6', // 9-10: Tím
          '#94a3b8', // Chưa có điểm: Xám
        ],
        borderRadius: 8,
      },
    ],
  };

  const scoreChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.parsed.y} ứng viên`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  // Chart 2: Status Doughnut Chart
  const statusChartData = {
    labels: ['Trúng tuyển (PASSED)', 'Đang chờ (PENDING)', 'Không trúng tuyển (FAILED)'],
    datasets: [
      {
        data: [passed, pending, failed],
        backgroundColor: ['#10b981', '#0284c7', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
          Tổng quan Quản trị (Dashboard)
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
          Theo dõi số liệu thống kê ứng tuyển Cộng tác viên và hoạt động của Liên chi đoàn Khoa ATTT.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: '14px',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TỔNG ỨNG VIÊN</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {total}
                </div>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                }}
              >
                <Users size={24} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: '14px',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>ĐÃ TRÚNG TUYỂN</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                  {passed}
                </div>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: '14px',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>ĐANG CHỜ DUYỆT</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                  {pending}
                </div>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Clock size={24} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: '14px',
              border: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>TỶ LỆ TRÚNG TUYỂN</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {passRate}%
                </div>
              </div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <TrendingUp size={24} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[20, 20]}>
        {/* Score Distribution Bar Chart */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#0284c7" />
                  <span style={{ fontWeight: 700 }}>Phân bố ứng viên theo mức điểm chấm</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag color="blue" style={{ fontWeight: 600, borderRadius: '6px' }}>
                    Đã chấm: {scoredCollaborators.length}/{total}
                  </Tag>
                  <Tag color="green" style={{ fontWeight: 700, borderRadius: '6px' }}>
                    Điểm TB: {avgScore}/10
                  </Tag>
                </div>
              </div>
            }
            bordered={false}
            style={{ borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
          >
            <div style={{ height: '320px' }}>
              <Bar data={scoreChartData} options={scoreChartOptions} />
            </div>
          </Card>
        </Col>

        {/* Status Doughnut Chart */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#0284c7" />
                <span style={{ fontWeight: 700 }}>Tỷ lệ Trạng thái Hồ sơ</span>
              </div>
            }
            bordered={false}
            style={{ borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
          >
            <div style={{ height: '320px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={statusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' as const },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
