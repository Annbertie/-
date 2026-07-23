import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  LockOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Member } from '../../types';

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetTarget, setResetTarget] = useState<Member | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (keyword) params.keyword = keyword;
      const res = await api.get('/admin/members', { params });
      setMembers(res.data.data?.list || []);
    } catch (error) {
      message.error('加载成员列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreate = async (values: Record<string, unknown>) => {
    setCreating(true);
    try {
      await api.post('/admin/members', values);
      message.success('创建成员成功');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      fetchMembers();
    } catch (error: any) {
      message.error(error?.response?.data?.error || '创建成员失败');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!currentMember) return;
    setEditing(true);
    try {
      await api.put(`/admin/members/${currentMember.id}`, values);
      message.success('更新成员成功');
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (error: any) {
      message.error(error?.response?.data?.error || '更新成员失败');
    } finally {
      setEditing(false);
    }
  };

  const openEdit = (member: Member) => {
    setCurrentMember(member);
    editForm.setFieldsValue(member);
    setIsEditModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (!resetPassword.trim()) {
      message.error('请输入新密码');
      return;
    }
    setResetting(true);
    try {
      await api.post(`/admin/members/${resetTarget.id}/reset-password`, { new_password: resetPassword });
      message.success('重置密码成功');
      setIsResetModalOpen(false);
      setResetPassword('');
    } catch (error) {
      message.error('重置密码失败');
    } finally {
      setResetting(false);
    }
  };

  const openReset = (member: Member) => {
    setResetTarget(member);
    setResetPassword('');
    setIsResetModalOpen(true);
  };

  const toggleStatus = async (member: Member) => {
    try {
      const newStatus = member.status === 'active' ? 'disabled' : 'active';
      await api.put(`/admin/members/${member.id}`, { status: newStatus });
      message.success(member.status === 'active' ? '已禁用' : '已启用');
      fetchMembers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (member: Member) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除成员 "${member.real_name}" 吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/admin/members/${member.id}`);
          message.success('删除成功');
          fetchMembers();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    { title: '账号', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (v: string) => v === 'admin' ? '管理员' : '普通成员' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '账号状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'red'}>
          {s === 'active' ? '正常' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Member) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<LockOutlined />} onClick={() => openReset(record)}>
            重置密码
          </Button>
          <Button
            type="link"
            icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => toggleStatus(record)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>成员管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
          新增成员
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总成员数" value={members.length} />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索账号/姓名"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={fetchMembers}
          style={{ width: 260 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" onClick={fetchMembers}>查询</Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={members} loading={loading} />

      <Modal
        title="新增成员"
        open={isCreateModalOpen}
        onOk={() => createForm.submit()}
        onCancel={() => { setIsCreateModalOpen(false); createForm.resetFields(); }}
        confirmLoading={creating}
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item label="真实姓名" name="real_name" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色" options={[{ value: 'user', label: '普通成员' }, { value: 'admin', label: '管理员' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑成员"
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => { setIsEditModalOpen(false); editForm.resetFields(); }}
        confirmLoading={editing}
      >
        <Form form={editForm} onFinish={handleEdit} layout="vertical">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }, { min: 2, message: '用户名至少2个字符' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="真实姓名" name="real_name" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色" options={[{ value: 'user', label: '普通成员' }, { value: 'admin', label: '管理员' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`重置密码 - ${resetTarget?.real_name || ''}`}
        open={isResetModalOpen}
        onOk={handleResetPassword}
        onCancel={() => setIsResetModalOpen(false)}
        confirmLoading={resetting}
      >
        <Form layout="vertical">
          <Form.Item label="新密码" required>
            <Input.Password
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="请输入新密码"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
