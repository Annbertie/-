import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Button,
  Typography,
  Switch,
  theme,
} from 'antd';
import {
  HomeOutlined,
  ProjectOutlined,
  SettingOutlined,
  AuditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const FrontLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目总览',
    },
    {
      key: '/approvals',
      icon: <AuditOutlined />,
      label: '审批中心',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
  ];

  const selectedKeys = [location.pathname === '/' ? '/' : location.pathname];

  const dropdownItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            color: '#1677ff',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? '产学研' : '产学研系统'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
            <Text strong style={{ fontSize: 16 }}>
              产学研项目全流程管理系统
            </Text>
          </Space>
          <Space>
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
            {user?.role === 'admin' && (
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={() => navigate('/admin')}
              >
                进入后台
              </Button>
            )}
            <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <Text>
                  {user?.real_name || '用户'} ({user?.role === 'admin' ? '管理员' : '普通用户'})
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default FrontLayout;
