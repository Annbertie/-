import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined } from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // Supabase Auth 使用邮箱登录，将输入视为邮箱
      const email = values.username.includes('@')
        ? values.username
        : `${values.username}@placeholder.local`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) throw error;

      const session = data.session;
      if (!session) throw new Error('登录失败：未获取到会话');

      // 登录成功后从 profiles 表获取用户额外信息（role, username, department 等）
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      const userData: User = profile as User;
      login(session.access_token, userData);
      message.success('登录成功');
      navigate('/');
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : '登录失败，请检查邮箱和密码';
      message.error(errMessage);
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
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
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
