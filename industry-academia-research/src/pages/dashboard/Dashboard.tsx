import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, List, Typography, Tag, Spin, Space, Tabs, Input, Button } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  NotificationOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import api from '../../services/supabaseApi';
import type { Project, Announcement } from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DashboardStats {
  ongoingProjects: number;
  completedProjects: number;
  myTodos: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    ongoingProjects: 0,
    completedProjects: 0,
    myTodos: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [dashKeyword, setDashKeyword] = useState('');
  const [dashStatus, setDashStatus] = useState<string | undefined>(undefined);
  const [dashStage, setDashStage] = useState<string | undefined>(undefined);
  const [dashTotal, setDashTotal] = useState(0);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        // 加载所有项目用于准确统计（不分页）
        const res = await api.get('/projects', { params: { page: 1, pageSize: 1000 } });
        if (!mounted) return;
        const list: Project[] = Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.list || [];
        setProjects(list);
        const ongoing = list.filter((p) => p.status === 'active').length;
        const completed = list.filter((p) => p.status === 'completed').length;
        setStats((prev) => ({ ...prev, ongoingProjects: ongoing, completedProjects: completed }));
      } catch {
        // 静默处理
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const loadAnnouncements = async () => {
      try {
        const res = await api.get('/announcements', { timeout: 3000 });
        if (!mounted) return;
        setAnnouncements(Array.isArray(res.data.data)
          ? res.data.data
          : res.data.data?.list || []);
      } catch {
        // 静默处理，公告加载失败不影响主体
      }
    };

    setLoading(true);
    loadProjects();
    loadAnnouncements();

    return () => { mounted = false; };
  }, []);

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      ellipsis: true,
    },
    {
      title: '项目编号',
      dataIndex: 'project_code',
      key: 'project_code',
    },
    {
      title: '企业名称',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: '负责人',
      dataIndex: 'lead_user_name',
      key: 'lead_user_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          pending: { color: 'warning', text: '待启动' },
          suspended: { color: 'default', text: '已暂停' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
  ];

  const filteredProjects = activeTab
    ? projects.filter((p) => p.status === activeTab)
    : projects;

  const handleStatClick = (statusKey: string | null) => {
    setActiveTab((prev) => (prev === statusKey ? null : statusKey));
  };

  const handleDashSearch = async () => {
    if (!dashKeyword.trim() && !dashStatus && !dashStage) {
      // 无筛选条件时重新加载初始数据
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 20 };
      if (dashKeyword.trim()) params.keyword = dashKeyword.trim();
      if (dashStatus) params.status = dashStatus;
      if (dashStage) params.current_stage = dashStage;
      const res = await api.get('/projects', { params });
      const list: Project[] = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.data?.list || [];
      setProjects(list);
      setDashTotal(res.data.data?.total || list.length);
    } catch {
      // 静默
    } finally {
      setSearching(false);
    }
  };

  const handleDashReset = () => {
    setDashKeyword('');
    setDashStatus(undefined);
    setDashStage(undefined);
    setSearching(false);
    // 重新加载初始数据（所有项目）
    api.get('/projects', { params: { page: 1, pageSize: 1000 } }).then((res) => {
      const list: Project[] = Array.isArray(res.data.data)
        ? res.data.data
        : res.data.data?.list || [];
      setProjects(list);
      setDashTotal(0);
    }).catch(() => {});
  };

  const isSearching = dashKeyword.trim() || dashStatus || dashStage;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" description="加载中..." />
      </div>
    );
  }

  const projectTabItems = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '进行中' },
    { key: 'completed', label: '已完成' },
  ];

  return (
    <div>
      <Title level={4}>仪表盘</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatClick('active')}
          >
            <Statistic
              title="进行中的项目"
              value={stats.ongoingProjects}
              prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
              styles={{ content: { color: '#1677ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            hoverable
            style={{ cursor: 'pointer' }}
            onClick={() => handleStatClick('completed')}
          >
            <Statistic
              title="已完成的项目"
              value={stats.completedProjects}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="我的待办"
              value={stats.myTodos}
              prefix={<ProjectOutlined style={{ color: '#faad14' }} />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="项目列表"
            extra={<Text type="secondary">{isSearching ? `共 ${dashTotal || projects.length} 条结果` : `共 ${projects.length} 个项目`}</Text>}
            styles={{ body: { padding: 0 } }}
          >
            <Space style={{ margin: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }} size="small">
              <Input.Search
                placeholder="搜索项目名称/编号/企业"
                allowClear
                size="small"
                value={dashKeyword}
                onChange={(e) => setDashKeyword(e.target.value)}
                onSearch={handleDashSearch}
                style={{ width: 240 }}
              />
              {isSearching && <Button size="small" onClick={handleDashReset}>重置</Button>}
            </Space>
            <Tabs
              activeKey={activeTab || 'all'}
              items={projectTabItems}
              onChange={(key) => handleStatClick(key === 'all' ? null : key)}
              size="small"
              style={{ marginBottom: 0, paddingLeft: 16, paddingTop: 0 }}
            />
            <Table
              dataSource={filteredProjects}
              columns={projectColumns}
              rowKey="id"
              pagination={false}
              size="small"
              loading={searching}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="系统公告"
            extra={<NotificationOutlined />}
          >
            <List
              dataSource={announcements}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<Text strong>{item.title}</Text>}
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.created_at || item.publish_date).format('YYYY-MM-DD')}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
