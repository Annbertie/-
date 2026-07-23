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
  Select,
} from 'antd';
import { LockOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/supabaseApi';
import FileUpload from '../../components/FileUpload';
import type { ContractShipment, ProjectProgress } from '../../types';

interface Props {
  projectId: string;
  progress: ProjectProgress | null;
  onRefresh: () => void;
}

const COURIER_OPTIONS = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', 'EMS', '京东物流', '德邦快递'];

export default function ShipmentModule({ projectId, onRefresh }: Props) {
  const [shipment, setShipment] = useState<ContractShipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modReason, setModReason] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/contract-shipments', { params: { project_id: projectId } });
      const data = res.data.data?.list?.[0] || null;
      setShipment(data);
      if (data) {
        form.setFieldsValue({
          ...data,
          customer_signed: !!data.customer_signed,
          confirmed_with_customer: !!data.confirmed_with_customer,
          sign_proof: data.sign_proof_url || '',
          chat_screenshot: data.chat_screenshot_url || '',
          shipment_time: data.shipment_time ? dayjs(data.shipment_time) : undefined,
        });
      }
    } catch (error: any) {
      const msg = error?.response?.data?.error || '加载寄出数据失败';
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
      // 文件字段映射：sign_proof -> sign_proof_url / sign_proof_name，chat_screenshot -> chat_screenshot_url / chat_screenshot_name
      const { sign_proof, chat_screenshot, ...rest } = values;
      const payload: Record<string, unknown> = {
        ...rest,
        project_id: projectId,
        shipment_time: values.shipment_time ? dayjs(values.shipment_time as string).format('YYYY-MM-DD HH:mm') : undefined,
      };
      if (sign_proof) {
        payload.sign_proof_url = sign_proof;
        payload.sign_proof_name = String(sign_proof).split('/').pop() || '';
      }
      if (chat_screenshot) {
        payload.chat_screenshot_url = chat_screenshot;
        payload.chat_screenshot_name = String(chat_screenshot).split('/').pop() || '';
      }
      if (shipment?.id) {
        await api.put(`/contract-shipments/${shipment.id}`, payload);
      } else {
        await api.post('/contract-shipments', payload);
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
    if (!shipment?.id) {
      message.error('请先保存数据');
      return;
    }
    try {
      await api.post(`/contract-shipments/${shipment.id}/submit`);
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
        target_module: 'contract_shipments',
        target_record_id: shipment?.id,
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

  const isSubmitted = shipment?.status === 'submitted';

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
        <Form.Item label="寄出时间" name="shipment_time" rules={[{ required: true, message: '请选择寄出时间' }]}>
          <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
        </Form.Item>
        <Form.Item label="快递单号" name="tracking_number" rules={[{ required: true, message: '请输入快递单号' }]}>
          <Input placeholder="请输入快递单号" />
        </Form.Item>
        <Form.Item label="快递公司" name="courier_company" rules={[{ required: true, message: '请输入快递公司' }]}>
          <Select placeholder="请选择或输入快递公司" allowClear showSearch mode="tags">
            {COURIER_OPTIONS.map((c) => (
              <Select.Option key={c} value={c}>{c}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="客户是否签收" name="customer_signed" rules={[{ required: true, message: '请选择客户是否签收' }]}>
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="签收证明" name="sign_proof">
          <FileUpload disabled={isSubmitted} />
        </Form.Item>
        <Form.Item label="是否与客户确认" name="confirmed_with_customer" rules={[{ required: true, message: '请选择是否与客户确认' }]}>
          <Radio.Group>
            <Radio value={true}>是</Radio>
            <Radio value={false}>否</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="聊天记录截图" name="chat_screenshot">
          <FileUpload disabled={isSubmitted} />
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
