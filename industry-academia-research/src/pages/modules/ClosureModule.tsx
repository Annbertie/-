import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  message,
  Tag,
  Modal,
  Spin,
  Space,
} from 'antd';
import { LockOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import FileUpload from '../../components/FileUpload';
import type { ProjectClosure, ProjectProgress } from '../../types';

interface Props {
  projectId: string;
  progress: ProjectProgress | null;
  onRefresh: () => void;
}

export default function ClosureModule({ projectId, onRefresh }: Props) {
  const [closure, setClosure] = useState<ProjectClosure | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modReason, setModReason] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/project-closures', { params: { project_id: projectId } });
      const data = res.data.data?.list?.[0] || null;
      setClosure(data);
      if (data) {
        form.setFieldsValue({
          ...data,
          research_report: data.research_report_url || '',
          acceptance_report: data.acceptance_report_url || '',
          closure_time: data.closure_time ? dayjs(data.closure_time) : undefined,
        });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || '加载结题数据失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      // 文件字段映射：research_report -> research_report_url / research_report_name，acceptance_report -> acceptance_report_url / acceptance_report_name
      const { research_report, acceptance_report, ...rest } = values;
      const payload: Record<string, unknown> = {
        ...rest,
        project_id: projectId,
        closure_time: values.closure_time ? dayjs(values.closure_time as string).format('YYYY-MM-DD HH:mm') : undefined,
      };
      if (research_report) {
        payload.research_report_url = research_report;
        payload.research_report_name = String(research_report).split('/').pop() || '';
      }
      if (acceptance_report) {
        payload.acceptance_report_url = acceptance_report;
        payload.acceptance_report_name = String(acceptance_report).split('/').pop() || '';
      }
      if (closure?.id) {
        await api.put(`/project-closures/${closure.id}`, payload);
      } else {
        await api.post('/project-closures', payload);
      }
      message.success('保存成功');
      fetchData();
      onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '保存失败';
      message.error(msg);
    }
  };

  const handleSubmit = async () => {
    if (!closure?.id) {
      message.error('请先保存数据');
      return;
    }
    try {
      await api.post(`/project-closures/${closure.id}/submit`);
      message.success('结题提交成功，项目已标记为已完成');
      fetchData();
      onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '提交失败';
      message.error(msg);
    }
  };

  const handleModSubmit = async () => {
    if (!modReason.trim()) {
      message.error('请填写修改原因');
      return;
    }
    setModSubmitting(true);
    try {
      await api.post('/modification-requests', {
        project_id: projectId,
        target_module: 'project_closures',
        target_record_id: closure?.id,
        reason: modReason,
      });
      message.success('申请修改已提交');
      setModModalOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.error || '申请修改失败';
      message.error(msg);
    } finally {
      setModSubmitting(false);
    }
  };

  const isSubmitted = closure?.status === 'submitted';

  if (loading) return <Spin style={{ display: 'block', margin: '20px auto' }} />;

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        {isSubmitted && (
          <Space>
            <Tag icon={<LockOutlined />} color="red">已提交</Tag>
            <Button icon={<EditOutlined />} onClick={() => { setModReason(''); setModModalOpen(true); }}>
              申请修改
            </Button>
          </Space>
        )}
      </div>

      <Form form={form} onFinish={handleSave} layout="vertical" disabled={isSubmitted}>
        <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
          <Input placeholder="请输入责任人" />
        </Form.Item>
        <Form.Item label="结题时间" name="closure_time" rules={[{ required: true, message: '请选择结题时间' }]}>
          <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
        </Form.Item>
        <Form.Item label="研究报告" name="research_report">
          <FileUpload disabled={isSubmitted} />
        </Form.Item>
        <Form.Item label="验收报告" name="acceptance_report">
          <FileUpload disabled={isSubmitted} />
        </Form.Item>
        <Form.Item label="结题备注" name="closure_remark">
          <Input.TextArea rows={3} placeholder="请输入结题备注" />
        </Form.Item>
        {!isSubmitted && (
          <Space>
            <Button type="primary" onClick={() => form.submit()}>保存</Button>
            <Button type="primary" danger onClick={handleSubmit}>提交</Button>
          </Space>
        )}
      </Form>

      <Modal
        title="申请修改"
        open={modModalOpen}
        onOk={handleModSubmit}
        onCancel={() => setModModalOpen(false)}
        confirmLoading={modSubmitting}
      >
        <Form layout="vertical">
          <Form.Item label="修改原因" required>
            <Input.TextArea
              rows={4}
              value={modReason}
              onChange={(e) => setModReason(e.target.value)}
              placeholder="请详细说明需要修改的原因"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
