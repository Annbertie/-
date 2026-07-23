import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  message,
  Modal,
  Form,
  Tabs,
} from 'antd';
import { EditOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/supabaseApi';
import type { Config, Log } from '../../types';


export default function AdminConfig() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<Config | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await api.get('/admin/configs');
      setConfigs(res.data.data || []);
    } catch (error) {
      message.error('加载配置失败');
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data.data?.list || []);
    } catch (error) {
      message.error('加载日志失败');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConfigs(), fetchLogs()]);
    setLoading(false);
  }, [fetchConfigs, fetchLogs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openEdit = (config: Config) => {
    setEditTarget(config);
    editForm.setFieldsValue({ value: config.value });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editTarget) return;
    setEditing(true);
    try {
      await api.put(`/admin/configs/${editTarget.key}`, { value: values.value });
      message.success('更新配置成功');
      setIsEditModalOpen(false);
      fetchConfigs();
    } catch (error) {
      message.error('更新配置失败');
    } finally {
      setEditing(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/export/projects', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projects-export-${dayjs().format('YYYYMMDD-HHmmss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const configColumns = [
    { title: '配置键', dataIndex: 'key', key: 'key' },
    { title: '配置值', dataIndex: 'value', key: 'value' },
    { title: '说明', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Config) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const logColumns = [
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    { title: '模块', dataIndex: 'module', key: 'module' },
    { title: '动作', dataIndex: 'action', key: 'action' },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>系统配置</h2>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出项目数据
        </Button>
      </div>

      <Tabs
        defaultActiveKey="configs"
        items={[
          {
            key: 'configs',
            label: '配置项',
            children: (
              <Table
                rowKey="key"
                columns={configColumns}
                dataSource={configs}
                loading={loading}
              />
            ),
          },
          {
            key: 'logs',
            label: '操作日志',
            children: (
              <Table
                rowKey="id"
                columns={logColumns}
                dataSource={logs}
                loading={loading}
              />
            ),
          },
        ]}
      />

      <Modal
        title={`编辑配置 - ${editTarget?.key || ''}`}
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => { setIsEditModalOpen(false); editForm.resetFields(); }}
        confirmLoading={editing}
      >
        <Form form={editForm} onFinish={handleEdit} layout="vertical">
          <Form.Item label="配置值" name="value" rules={[{ required: true, message: '请输入配置值' }]}>
            <Input placeholder="请输入配置值" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
