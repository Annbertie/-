import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined, MailOutlined } from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      const session = data.session;
      if (!session) throw new Error('登录失败：未获取到会话');

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
      const errMessage = error instanceof Error ? error.message : '登录失败，请检查邮箱和密码';
      message.error(errMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    if (values.password !== values.confirm_password) {
      message.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      // 检查是否已有用户，如果没有则设为第一个管理员
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const isFirstUser = (count || 0) === 0;

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.username,
            real_name: values.username,
            role: isFirstUser ? 'admin' : 'user',
          },
        },
      });

      if (error) throw error;

      if (!data.user) throw new Error('注册失败');

      // 手动创建/更新 profile（防止触发器未生效）
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: values.username,
        real_name: values.username,
        email: values.email,
        role: isFirstUser ? 'admin' : 'user',
        status: 'active',
      });

      message.success(isFirstUser ? '注册成功，您已成为系统管理员' : '注册成功，请登录');

      if (isFirstUser) {
        // 第一个用户自动登录
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (!signInError && signInData.session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', signInData.user!.id).single();
          login(signInData.session.access_token, profile as User);
          navigate('/');
        }
      } else {
        setIsRegister(false);
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : '注册失败';
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
          {isRegister ? '注册账号' : '用户登录'}
        </Title>

        {isRegister ? (
          <Form name="register" autoComplete="off" onFinish={handleRegister} size="large">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item name="confirm_password" rules={[{ required: true, message: '请确认密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                注册
              </Button>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
              <Button type="link" onClick={() => setIsRegister(false)}>
                已有账号？去登录
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form name="login" autoComplete="off" onFinish={handleLogin} size="large">
            <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
              <Button type="link" onClick={() => setIsRegister(true)}>
                没有账号？去注册
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
      <Text type="secondary" style={{ marginTop: 24 }}>
        产学研项目全流程管理系统 v1.0
      </Text>
    </div>
  );
};

export default Login;
