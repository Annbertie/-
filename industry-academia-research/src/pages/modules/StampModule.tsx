import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Radio,
  message,
  Tag,
  Modal,
  Spin,
  Space,
  InputNumber,
} from 'antd';
import { LockOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import FileUpload from '../../components/FileUpload';
import type { ContractStamp, ProjectProgress } from '../../types';

interface Props {
  projectId: string;
  progress: ProjectProgress | null;
  onRefresh: () => void;
}

export default function StampModule({ projectId, onRefresh }: Props) {
  const [stamp, setStamp] = useState<ContractStamp | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modReason, setModReason] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/contract-stamps', { params: { project_id: projectId } });
      const data = res.data.data?.list?.[0] || null;
      setStamp(data);
      if (data) {
        form.setFieldsValue({
          ...data,
          is_scanned: !!data.is_scanned,
          is_uploaded_to_system: !!data.is_uploaded_to_system,
          scan_file: data.scan_file_url || '',
          stamp_time: data.stamp_time ? dayjs(data.stamp_time) : undefined,
        });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || '加载盖章数据失败';
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
      // 文件字段映射：scan_file -> scan_file_url / scan_file_name
      const { scan_file, ...rest } = values;
      const payload: Record<string, unknown> = {
        ...rest,
        project_id: projectId,
        stamp_time: values.stamp_time ? dayjs(values.stamp_time as string).format('YYYY-MM-DD HH:mm') : undefined,
      };
      if (scan_file) {
        payload.scan_file_url = scan_file;
        const urlStr = String(scan_file);
        const fileName = urlStr.split('/').pop() || '';
        payload.scan_file_name = fileName;
      }
      if (stamp?.id) {
        await api.put(`/contract-stamps/${stamp.id}`, payload);
      } else {
        await api.post('/contract-stamps', payload);
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
    if (!stamp?.id) {
      message.error('请先保存数据');
      return;
    }
    try {
      await api.post(`/contract-stamps/${stamp.id}/submit`);
      message.success('提交成功');
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
        target_module: 'contract_stamps',
        target_record_id: stamp?.id,
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

  const isSubmitted = stamp?.status === 'submitted';

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
        <Form.Item label="盖章时间" name="stamp_time" rules={[{ required: true, message: '请选择盖章时间' }]}>
          <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
        </Form.Item>
        <Form.Item label="合同份数" name="contract_count" rules={[{ required: true, message: '请输入合同份数' }]}>
          <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入合同份数" />
        </Form.Item>
        <Form.Item label="是否扫描归档" name="is_scanned" rules={[{ required: true, message: '请选择是否扫描归档' }]}>
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="扫描文件" name="scan_file">
          <FileUpload disabled={isSubmitted} />
        </Form.Item>
        <Form.Item label="是否上传系统" name="is_uploaded_to_system" rules={[{ required: true, message: '请选择是否上传系统' }]}>
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="系统上传备注" name="system_upload_remark">
          <Input.TextArea rows={2} placeholder="请输入系统上传备注" />
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
