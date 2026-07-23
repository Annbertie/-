import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Card,
  Pagination,
  Tabs,
  Select,
  Space,
} from 'antd';
import { PlusOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Project } from '../../types';

interface ModificationRequest {
  id: number;
  project_name?: string;
  target_module?: string;
  reason?: string;
  status?: string;
  created_at?: string;
}

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterStage, setFilterStage] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<ModificationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      // Tab 状态筛选
      if (activeTab === 'active') params.status = 'active';
      else if (activeTab === 'completed') params.status = 'completed';
      // 搜索与筛选（在全部/进行中/已完成 tab 下生效）
      if (keyword.trim()) params.keyword = keyword.trim();
      if (filterStatus) params.status = filterStatus;
      if (filterStage) params.current_stage = filterStage;
      const res = await api.get('/projects', { params });
      setProjects(res.data.data?.list || []);
      setTotal(res.data.data?.total || 0);
    } catch (error) {
      message.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTab, keyword, filterStatus, filterStage]);

  const fetchPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/modification-requests', { params: { status: 'pending' } });
      const data = res.data.data;
      setPendingRequests(Array.isArray(data) ? data : data?.list || []);
    } catch (error) {
      message.error('加载待审批列表失败');
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingRequests();
    } else {
      fetchProjects();
    }
  }, [activeTab, fetchProjects, fetchPendingRequests]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    // 切换 tab 时重置筛选条件
    setKeyword('');
    setFilterStatus(undefined);
    setFilterStage(undefined);
  };

  const handleSearch = () => {
    setPage(1);
    fetchProjects();
  };

  const handleReset = () => {
    setKeyword('');
    setFilterStatus(undefined);
    setFilterStage(undefined);
    setPage(1);
  };

  // 搜索栏是否显示（待审批 tab 不显示）
  const showSearchBar = activeTab !== 'pending';

  const handleCreate = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        project_name: values.project_name,
        project_code: values.project_code,
        company_name: values.company_name,
        lead_user_name: values.lead_user_name || '',
        remark: values.remark || '',
      };
      if (values.deadline) {
        payload.deadline = dayjs(values.deadline as string).format('YYYY-MM-DD HH:mm');
      }
      await api.post('/projects', payload);
      message.success('创建项目成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchProjects();
    } catch (error: any) {
      console.error('创建项目错误:', error);
      const errMsg = error?.response?.data?.error || error?.message || '创建项目失败';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'blue' : 'green'}>{s === 'active' ? '进行中' : '已完成'}</Tag>
      ),
    },
    {
      title: '当前阶段',
      dataIndex: 'current_stage',
      key: 'current_stage',
      render: (stage: string) => <Tag>{stage}</Tag>,
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '项目负责人',
      dataIndex: 'lead_user_name',
      key: 'lead_user_name',
      render: (v: string) => v || '-',
    },
    {
      title: '创建人',
      dataIndex: 'created_by_name',
      key: 'created_by_name',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Project) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const requestColumns = [
    {
      title: '申请项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (v: string) => v || '-',
    },
    {
      title: '目标模块',
      dataIndex: 'target_module',
      key: 'target_module',
      render: (v: string) => v || '-',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (v: string) => v || '-',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'orange', text: '待审批' },
          approved: { color: 'green', text: '已通过' },
          rejected: { color: 'red', text: '已驳回' },
        };
        const config = map[s] || { color: 'default', text: s };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const stageOptions = [
    { value: '合同管理', label: '合同管理' },
    { value: '合同盖章', label: '合同盖章' },
    { value: '合同寄出', label: '合同寄出' },
    { value: '打款开票', label: '打款开票' },
    { value: '经费报销', label: '经费报销' },
    { value: '结题', label: '结题' },
  ];

  const renderProjectTable = () => (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={false}
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={(p, ps) => { setPage(p); setPageSize(ps || 10); }}
          showSizeChanger
        />
      </div>
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: '全部',
      children: renderProjectTable(),
    },
    {
      key: 'active',
      label: '进行中',
      children: renderProjectTable(),
    },
    {
      key: 'completed',
      label: '已完成',
      children: renderProjectTable(),
    },
    {
      key: 'pending',
      label: '待审批',
      children: (
        <Table
          rowKey="id"
          columns={requestColumns}
          dataSource={pendingRequests}
          loading={requestsLoading}
          pagination={false}
        />
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>项目总览</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建项目
        </Button>
      </div>

      {showSearchBar && (
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="搜索项目名称/编号/企业名称"
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 280 }}
          />
          <Select
            placeholder="项目状态"
            allowClear
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            style={{ width: 120 }}
            options={[
              { value: 'active', label: '进行中' },
              { value: 'completed', label: '已完成' },
            ]}
          />
          <Select
            placeholder="项目阶段"
            allowClear
            value={filterStage}
            onChange={(v) => { setFilterStage(v); setPage(1); }}
            style={{ width: 120 }}
            options={stageOptions}
          />
          <Button onClick={handleReset}>重置</Button>
        </Space>
      )}

      <Tabs activeKey={activeTab} items={tabItems} onChange={handleTabChange} />

      <Modal
        title="新建项目"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            label="项目名称"
            name="project_name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            label="项目编号"
            name="project_code"
            rules={[{ required: true, message: '请输入项目编号' }]}
          >
            <Input placeholder="请输入项目编号，全局唯一" />
          </Form.Item>
          <Form.Item
            label="企业名称"
            name="company_name"
            rules={[{ required: true, message: '请输入企业名称' }]}
          >
            <Input placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item label="截止日期" name="deadline">
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item label="项目负责人" name="lead_user_name">
            <Input placeholder="请输入项目负责人" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
