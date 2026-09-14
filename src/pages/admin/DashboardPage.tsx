import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Button } from 'antd';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  TrendingUp,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { departmentService } from '../../services/department.service';
import { Collaborator, Department } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

export const DashboardPage: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [collabs, depts] = await Promise.all([
          collaboratorService.getCollaborators(),
          departmentService.getDepartments(),
        ]);
        setCollaborators(collabs);
        setDepartments(depts);
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

  // Department counts
  const deptCounts = departments.map((dept) => {
    const count = collaborators.filter(
      (c) => c.appliedDepartmentId === dept.id || c.acceptedDepartmentId === dept.id
    ).length;
    const passedInDept = collaborators.filter(
      (c) => c.acceptedDepartmentId === dept.id && c.status === 'PASSED'
    ).length;
    return {
      dept,
      count,
      passedInDept,
    };
  });

  // Chart 1: Status Doughnut Chart
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

  // Chart 2: Departments Bar Chart
  const deptChartData = {
    labels: departments.map((d) => d.name.replace('Ban ', '')),
    datasets: [
      {
        label: 'Tổng ứng viên',
        data: deptCounts.map((d) => d.count),
        backgroundColor: '#0284c7',
        borderRadius: 6,
      },
      {
        label: 'Đã trúng tuyển',
        data: deptCounts.map((d) => d.passedInDept),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  const recentCollaborators = collaborators.slice(0, 5);

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
      <Row gutter={[20, 20]} style={{ marginBottom: '24px' }}>
        {/* Department Distribution Bar Chart */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#0284c7" />
                <span style={{ fontWeight: 700 }}>Phân bố ứng viên theo Ban Chuyên môn</span>
              </div>
            }
            bordered={false}
            style={{ borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
          >
            <div style={{ height: '280px' }}>
              <Bar
                data={deptChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' as const },
                  },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                  },
                }}
              />
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
            <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
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

      {/* Recent Collaborators Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Hồ sơ ứng viên mới nhất</span>
            <Link to="/admin/collaborators">
              <Button type="link" style={{ padding: 0, fontWeight: 600 }}>
                Quản lý toàn bộ danh sách <ArrowUpRight size={16} style={{ display: 'inline' }} />
              </Button>
            </Link>
          </div>
        }
        bordered={false}
        style={{ borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
      >
        <Table
          dataSource={recentCollaborators}
          rowKey="id"
          pagination={false}
          size="middle"
          columns={[
            {
              title: 'MSSV',
              dataIndex: 'studentId',
              key: 'studentId',
              render: (txt) => <strong>{txt}</strong>,
            },
            {
              title: 'Họ và tên',
              dataIndex: 'fullName',
              key: 'fullName',
            },
            {
              title: 'Lớp',
              dataIndex: 'className',
              key: 'className',
            },
            {
              title: 'Ban ứng tuyển',
              dataIndex: 'appliedDepartmentId',
              key: 'appliedDepartmentId',
              render: (deptId) => {
                const dept = departments.find((d) => d.id === deptId);
                return dept ? dept.name : deptId;
              },
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                if (status === 'PASSED') return <Tag color="success">Trúng tuyển</Tag>;
                if (status === 'PENDING') return <Tag color="processing">Đang chờ</Tag>;
                return <Tag color="default">Không trúng tuyển</Tag>;
              },
            },
          ]}
        />
      </Card>
    </div>
  );
};
