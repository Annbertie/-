import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Table, Tag, message, Spin, Typography } from 'antd';
import { SaveOutlined, LockOutlined, FormOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ModificationRequest } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

interface ProfileFormValues {
  username: string;
  real_name: string;
  phone: string;
  email: string;
}

interface PasswordFormValues {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [modificationRequests, setModificationRequests] = useState<ModificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        real_name: user.real_name,
        phone: user.phone,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get('/modification-requests');
        const rawData = response.data.data;
        setModificationRequests(Array.isArray(rawData) ? rawData : rawData?.list || []);
      } catch {
        // silently handle error
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    setProfileLoading(true);
    try {
      await api.put('/auth/profile', values);
      message.success('基础信息修改成功');
      await refreshUser();
    } catch {
      message.error('修改失败，请重试');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
    } catch {
      message.error('密码修改失败，请检查原密码是否正确');
    } finally {
      setPasswordLoading(false);
    }
  };

  const requestColumns = [
    {
      title: '申请项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string) => text || '-',
    },
    {
      title: '模块',
      dataIndex: 'target_module',
      key: 'target_module',
      render: (v: string) => {
        const map: Record<string, string> = {
          contract_reviews: '合同审核', contract_confirmations: '合同确认',
          contract_receipts: '合同回执', contract_stamps: '合同盖章',
          contract_shipments: '合同寄出', payments: '打款', invoices: '开票',
          fund_claims: '经费认领', reimbursement_records: '经费报销', project_closures: '结题',
        };
        return map[v] || v || '-';
      },
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'warning', text: '待审批' },
          approved: { color: 'success', text: '已通过' },
          rejected: { color: 'error', text: '已驳回' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '审批意见',
      dataIndex: 'approval_opinion',
      key: 'approval_opinion',
      render: (text: string) => text || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <div>
      <Title level={4}>个人设置</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="基础信息修改" extra={<FormOutlined />}>
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSubmit}
              autoComplete="off"
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, message: '用户名至少2个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                label="姓名"
                name="real_name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Form.Item
                label="联系电话"
                name="phone"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={profileLoading}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="登录密码修改" extra={<LockOutlined />}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
              autoComplete="off"
            >
              <Form.Item
                label="原密码"
                name="old_password"
                rules={[{ required: true, message: '请输入原密码' }]}
              >
                <Input.Password placeholder="请输入原密码" />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="new_password"
                rules={[{ required: true, message: '请输入新密码' }]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>
              <Form.Item
                label="确认新密码"
                name="confirm_password"
                rules={[{ required: true, message: '请确认新密码' }]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LockOutlined />}
                  loading={passwordLoading}
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="我的申请" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin description="加载中..." />
          </div>
        ) : (
          <Table
            dataSource={modificationRequests}
            columns={requestColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>
    </div>
  );
};

export default Settings;
