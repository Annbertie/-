import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Radio,
  message,
  Tag,
  Modal,
  Spin,
  Space,
  Tabs,
} from 'antd';
import { LockOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import FileUpload from '../../components/FileUpload';
import type { ContractReview, ContractConfirmation, ContractReceipt, ProjectProgress } from '../../types';

const { Option } = Select;

interface Props {
  projectId: string;
  progress: ProjectProgress | null;
  onRefresh: () => void;
}

export default function ContractModule({ projectId, onRefresh }: Props) {
  const [review, setReview] = useState<ContractReview | null>(null);
  const [confirmation, setConfirmation] = useState<ContractConfirmation | null>(null);
  const [receipt, setReceipt] = useState<ContractReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('review');

  const [reviewForm] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [receiptForm] = Form.useForm();

  const [modModalOpen, setModModalOpen] = useState(false);
  const [modReason, setModReason] = useState('');
  const [modTarget, setModTarget] = useState<'review' | 'confirmation' | 'receipt'>('review');
  const [modSubmitting, setModSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, cRes, rcRes] = await Promise.all([
        api.get('/contract-reviews', { params: { project_id: projectId } }),
        api.get('/contract-confirmations', { params: { project_id: projectId } }),
        api.get('/contract-receipts', { params: { project_id: projectId } }),
      ]);
      const r = rRes.data.data?.list?.[0] || null;
      const c = cRes.data.data?.list?.[0] || null;
      const rc = rcRes.data.data?.list?.[0] || null;
      setReview(r);
      setConfirmation(c);
      setReceipt(rc);
      if (r) reviewForm.setFieldsValue({
        ...r,
        contract_file: r.contract_file_url || undefined,
        review_time: r.review_time ? dayjs(r.review_time) : undefined,
      });
      if (c) confirmForm.setFieldsValue({
        ...c,
        final_contract: c.final_contract_url || undefined,
        confirmation_time: c.confirmation_time ? dayjs(c.confirmation_time) : undefined,
      });
      if (rc) receiptForm.setFieldsValue({
        ...rc,
        receipt_screenshot: rc.receipt_screenshot_url || undefined,
        receipt_time: rc.receipt_time ? dayjs(rc.receipt_time) : undefined,
      });
    } catch (error) {
      message.error('加载合同数据失败');
    } finally {
      setLoading(false);
    }
  }, [projectId, reviewForm, confirmForm, receiptForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 文件字段映射：前端短名 -> 后端 url/name
  const fileFieldMap: Record<string, string> = {
    contract_file: 'contract_file_url',
    final_contract: 'final_contract_url',
    receipt_screenshot: 'receipt_screenshot_url',
  };

  const buildPayload = (values: Record<string, unknown>) => {
    const payload: Record<string, unknown> = { ...values, project_id: projectId };
    // 处理时间字段
    if (values.review_time) payload.review_time = dayjs(values.review_time).format('YYYY-MM-DD HH:mm');
    if (values.confirmation_time) payload.confirmation_time = dayjs(values.confirmation_time).format('YYYY-MM-DD HH:mm');
    if (values.receipt_time) payload.receipt_time = dayjs(values.receipt_time).format('YYYY-MM-DD HH:mm');
    // 处理文件字段映射
    for (const [shortName, urlField] of Object.entries(fileFieldMap)) {
      if (values[shortName] !== undefined) {
        payload[urlField] = values[shortName];
        delete payload[shortName];
        // 从 URL 提取文件名
        const parts = String(values[shortName]).split('/');
        payload[urlField.replace('_url', '_name')] = parts[parts.length - 1] || null;
      }
    }
    return payload;
  };

  const handleSave = async (type: 'review' | 'confirmation' | 'receipt', values: Record<string, unknown>) => {
    try {
      const payload = buildPayload(values);
      if (type === 'review') {
        if (review?.id) {
          await api.put(`/contract-reviews/${review.id}`, payload);
        } else {
          await api.post('/contract-reviews', payload);
        }
      } else if (type === 'confirmation') {
        if (confirmation?.id) {
          await api.put(`/contract-confirmations/${confirmation.id}`, payload);
        } else {
          await api.post('/contract-confirmations', payload);
        }
      } else {
        if (receipt?.id) {
          await api.put(`/contract-receipts/${receipt.id}`, payload);
        } else {
          await api.post('/contract-receipts', payload);
        }
      }
      message.success('保存成功');
      fetchData();
      onRefresh();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleSubmit = async (type: 'review' | 'confirmation' | 'receipt') => {
    try {
      let id: number | undefined;
      if (type === 'review') id = review?.id;
      else if (type === 'confirmation') id = confirmation?.id;
      else id = receipt?.id;
      if (!id) {
        message.error('请先保存数据');
        return;
      }
      const path = type === 'review' ? `/contract-reviews/${id}/submit` :
        type === 'confirmation' ? `/contract-confirmations/${id}/submit` :
        `/contract-receipts/${id}/submit`;
      await api.post(path);
      message.success('提交成功');
      fetchData();
      onRefresh();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const openModModal = (target: 'review' | 'confirmation' | 'receipt') => {
    setModTarget(target);
    setModReason('');
    setModModalOpen(true);
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
        target_module: modTarget === 'review' ? 'contract_reviews' : modTarget === 'confirmation' ? 'contract_confirmations' : 'contract_receipts',
        target_record_id: modTarget === 'review' ? review?.id : modTarget === 'confirmation' ? confirmation?.id : receipt?.id,
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

  const renderLocked = (submitted: boolean) => {
    if (!submitted) return null;
    return (
      <Tag icon={<LockOutlined />} color="red" style={{ marginLeft: 8 }}>
        已提交
      </Tag>
    );
  };

  const reviewSubmitted = review?.status === 'submitted';
  const confirmationSubmitted = confirmation?.status === 'submitted';
  const receiptSubmitted = receipt?.status === 'submitted';

  if (loading) return <Spin style={{ display: 'block', margin: '20px auto' }} />;

  const contractTabItems = [
    {
      key: 'review',
      label: <span>合同审核{renderLocked(reviewSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {reviewSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('review')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={reviewForm} onFinish={(v) => handleSave('review', v)} layout="vertical" disabled={reviewSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="审核时间" name="review_time" rules={[{ required: true, message: '请选择审核时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="起草方" name="drafting_party" rules={[{ required: true, message: '请选择起草方' }]}>
              <Radio.Group>
                <Radio value="our_side">我方起草</Radio>
                <Radio value="their_side">对方起草</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="合同文件" name="contract_file">
              <FileUpload disabled={reviewSubmitted} />
            </Form.Item>
            <Form.Item label="审核备注" name="review_remark">
              <Input.TextArea rows={3} placeholder="请输入审核备注" />
            </Form.Item>
            {!reviewSubmitted && (
              <Space>
                <Button type="primary" onClick={() => reviewForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('review')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'confirmation',
      label: <span>合同确认{renderLocked(confirmationSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {confirmationSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('confirmation')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={confirmForm} onFinish={(v) => handleSave('confirmation', v)} layout="vertical" disabled={confirmationSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="确认时间" name="confirmation_time" rules={[{ required: true, message: '请选择确认时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="最终合同" name="final_contract">
              <FileUpload disabled={confirmationSubmitted} />
            </Form.Item>
            <Form.Item label="确认说明" name="confirmation_desc">
              <Input.TextArea rows={3} placeholder="请输入确认说明" />
            </Form.Item>
            {!confirmationSubmitted && (
              <Space>
                <Button type="primary" onClick={() => confirmForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('confirmation')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'receipt',
      label: <span>合同签收{renderLocked(receiptSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {receiptSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('receipt')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={receiptForm} onFinish={(v) => handleSave('receipt', v)} layout="vertical" disabled={receiptSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="签收时间" name="receipt_time" rules={[{ required: true, message: '请选择签收时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="快递单号" name="tracking_number" rules={[{ required: true, message: '请输入快递单号' }]}>
              <Input placeholder="请输入快递单号" />
            </Form.Item>
            <Form.Item label="签收截图" name="receipt_screenshot">
              <FileUpload disabled={receiptSubmitted} />
            </Form.Item>
            {!receiptSubmitted && (
              <Space>
                <Button type="primary" onClick={() => receiptForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('receipt')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={contractTabItems} />

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
    </div>
  );
}
