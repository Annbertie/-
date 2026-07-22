import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await api.post<{ data: LoginResponse }>('/auth/login', {
        username: values.username,
        password: values.password,
      });
      const { token, user } = response.data.data;
      login(token, user);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <ExperimentOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
        <Title level={3} style={{ margin: 0, color: '#1677ff' }}>
          产学研项目全流程管理系统
        </Title>
        <Text type="secondary">高效协同 · 流程透明 · 全程可追溯</Text>
      </div>
      <Card style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          用户登录
        </Title>
        <Form
          name="login"
          autoComplete="off"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Text type="secondary" style={{ marginTop: 24 }}>
        产学研项目全流程管理系统 v1.0
      </Text>
    </div>
  );
};

export default Login;
