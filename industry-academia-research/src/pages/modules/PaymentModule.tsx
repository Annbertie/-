import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  message,
  Tag,
  Modal,
  Spin,
  Space,
  Tabs,
  InputNumber,
} from 'antd';
import { LockOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import FileUpload from '../../components/FileUpload';
import type { Payment, FundClaim, Invoice, ProjectProgress } from '../../types';


interface Props {
  projectId: string;
  progress: ProjectProgress | null;
  onRefresh: () => void;
}

const INVOICE_TYPE_OPTIONS = [
  { value: 'vat_special', label: '增值税专用发票' },
  { value: 'vat_normal', label: '增值税普通发票' },
  { value: 'vat_electronic', label: '电子发票' },
  { value: 'receipt', label: '收据' },
];

export default function PaymentModule({ projectId, onRefresh }: Props) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [fundClaim, setFundClaim] = useState<FundClaim | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');

  const [paymentForm] = Form.useForm();
  const [claimForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();

  const [modModalOpen, setModModalOpen] = useState(false);
  const [modReason, setModReason] = useState('');
  const [modTarget, setModTarget] = useState<'payment' | 'fundClaim' | 'invoice'>('payment');
  const [modSubmitting, setModSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, fRes, iRes] = await Promise.all([
        api.get('/payments', { params: { project_id: projectId } }),
        api.get('/fund-claims', { params: { project_id: projectId } }),
        api.get('/invoices', { params: { project_id: projectId } }),
      ]);
      const p = pRes.data.data?.list?.[0] || null;
      const f = fRes.data.data?.list?.[0] || null;
      const i = iRes.data.data?.list?.[0] || null;
      setPayment(p);
      setFundClaim(f);
      setInvoice(i);
      if (p) paymentForm.setFieldsValue({
        ...p,
        bank_proof: p.bank_proof_url || '',
        arrival_time: p.arrival_time ? dayjs(p.arrival_time) : undefined,
      });
      if (f) claimForm.setFieldsValue({
        ...f,
        claim_time: f.claim_time ? dayjs(f.claim_time) : undefined,
      });
      if (i) invoiceForm.setFieldsValue({
        ...i,
        invoice_file: i.invoice_file_url || '',
        preview_send_time: i.preview_send_time ? dayjs(i.preview_send_time) : undefined,
        customer_confirm_time: i.customer_confirm_time ? dayjs(i.customer_confirm_time) : undefined,
        official_issue_time: i.official_issue_time ? dayjs(i.official_issue_time) : undefined,
        invoice_send_time: i.invoice_send_time ? dayjs(i.invoice_send_time) : undefined,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error || '加载打款开票数据失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, paymentForm, claimForm, invoiceForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (type: 'payment' | 'fundClaim' | 'invoice', values: Record<string, unknown>) => {
    try {
      // 文件字段映射
      const { bank_proof, invoice_file, ...rest } = values;
      const payload: Record<string, unknown> = {
        ...rest,
        project_id: projectId,
      };
      if (bank_proof) {
        payload.bank_proof_url = bank_proof;
        payload.bank_proof_name = String(bank_proof).split('/').pop() || '';
      }
      if (invoice_file) {
        payload.invoice_file_url = invoice_file;
        payload.invoice_file_name = String(invoice_file).split('/').pop() || '';
      }
      if (values.arrival_time) payload.arrival_time = dayjs(values.arrival_time as string).format('YYYY-MM-DD HH:mm');
      if (values.claim_time) payload.claim_time = dayjs(values.claim_time as string).format('YYYY-MM-DD HH:mm');
      if (values.preview_send_time) payload.preview_send_time = dayjs(values.preview_send_time as string).format('YYYY-MM-DD HH:mm');
      if (values.customer_confirm_time) payload.customer_confirm_time = dayjs(values.customer_confirm_time as string).format('YYYY-MM-DD HH:mm');
      if (values.official_issue_time) payload.official_issue_time = dayjs(values.official_issue_time as string).format('YYYY-MM-DD HH:mm');
      if (values.invoice_send_time) payload.invoice_send_time = dayjs(values.invoice_send_time as string).format('YYYY-MM-DD HH:mm');

      if (type === 'payment') {
        if (payment?.id) {
          await api.put(`/payments/${payment.id}`, payload);
        } else {
          await api.post('/payments', payload);
        }
      } else if (type === 'fundClaim') {
        if (fundClaim?.id) {
          await api.put(`/fund-claims/${fundClaim.id}`, payload);
        } else {
          await api.post('/fund-claims', payload);
        }
      } else {
        if (invoice?.id) {
          await api.put(`/invoices/${invoice.id}`, payload);
        } else {
          await api.post('/invoices', payload);
        }
      }
      message.success('保存成功');
      fetchData();
      onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '保存失败';
      message.error(msg);
    }
  };

  const handleSubmit = async (type: 'payment' | 'fundClaim' | 'invoice') => {
    let id: number | undefined;
    if (type === 'payment') id = payment?.id;
    else if (type === 'fundClaim') id = fundClaim?.id;
    else id = invoice?.id;
    if (!id) {
      message.error('请先保存数据');
      return;
    }
    try {
      const path = type === 'payment' ? `/payments/${id}/submit` :
        type === 'fundClaim' ? `/fund-claims/${id}/submit` :
        `/invoices/${id}/submit`;
      await api.post(path);
      message.success('提交成功');
      fetchData();
      onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '提交失败';
      message.error(msg);
    }
  };

  const openModModal = (target: 'payment' | 'fundClaim' | 'invoice') => {
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
        target_module: modTarget === 'payment' ? 'payments' : modTarget === 'invoice' ? 'invoices' : 'fund_claims',
        target_record_id: modTarget === 'payment' ? payment?.id : modTarget === 'invoice' ? invoice?.id : fundClaim?.id,
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
    return <Tag icon={<LockOutlined />} color="red" style={{ marginLeft: 8 }}>已提交</Tag>;
  };

  const paymentSubmitted = payment?.status === 'submitted';
  const fundClaimSubmitted = fundClaim?.status === 'submitted';
  const invoiceSubmitted = invoice?.status === 'submitted';

  if (loading) return <Spin style={{ display: 'block', margin: '20px auto' }} />;

  const paymentTabItems = [
    {
      key: 'payment',
      label: <span>客户打款{renderLocked(paymentSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {paymentSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('payment')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={paymentForm} onFinish={(v) => handleSave('payment', v)} layout="vertical" disabled={paymentSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="到账金额" name="amount" rules={[{ required: true, message: '请输入到账金额' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入到账金额" />
            </Form.Item>
            <Form.Item label="到账时间" name="arrival_time" rules={[{ required: true, message: '请选择到账时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="银行回单" name="bank_proof">
              <FileUpload disabled={paymentSubmitted} />
            </Form.Item>
            <Form.Item label="打款备注" name="payment_remark">
              <Input.TextArea rows={3} placeholder="请输入打款备注" />
            </Form.Item>
            {!paymentSubmitted && (
              <Space>
                <Button type="primary" onClick={() => paymentForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('payment')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'fundClaim',
      label: <span>经费认领{renderLocked(fundClaimSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {fundClaimSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('fundClaim')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={claimForm} onFinish={(v) => handleSave('fundClaim', v)} layout="vertical" disabled={fundClaimSubmitted}>
            <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
              <Input placeholder="请输入责任人" />
            </Form.Item>
            <Form.Item label="认领时间" name="claim_time" rules={[{ required: true, message: '请选择认领时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="认领金额" name="claim_amount" rules={[{ required: true, message: '请输入认领金额' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="默认同步打款金额" />
            </Form.Item>
            <Form.Item label="认领说明" name="claim_desc">
              <Input.TextArea rows={3} placeholder="请输入认领说明" />
            </Form.Item>
            {!fundClaimSubmitted && (
              <Space>
                <Button type="primary" onClick={() => claimForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('fundClaim')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
    {
      key: 'invoice',
      label: <span>开票{renderLocked(invoiceSubmitted)}</span>,
      children: (
        <Card>
          <Space style={{ marginBottom: 16 }}>
            {invoiceSubmitted && (
              <Button icon={<EditOutlined />} onClick={() => openModModal('invoice')}>
                申请修改
              </Button>
            )}
          </Space>
          <Form form={invoiceForm} onFinish={(v) => handleSave('invoice', v)} layout="vertical" disabled={invoiceSubmitted}>
            <Form.Item label="发票类型" name="invoice_type" rules={[{ required: true, message: '请选择发票类型' }]}>
              <Select placeholder="请选择发票类型">
                {INVOICE_TYPE_OPTIONS.map((t) => (
                  <Select.Option key={t.value} value={t.value}>{t.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="预览发送时间" name="preview_send_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="客户确认时间" name="customer_confirm_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="正式开具时间" name="official_issue_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="发票寄出时间" name="invoice_send_time">
              <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="发票文件" name="invoice_file">
              <FileUpload disabled={invoiceSubmitted} />
            </Form.Item>
            {!invoiceSubmitted && (
              <Space>
                <Button type="primary" onClick={() => invoiceForm.submit()}>保存</Button>
                <Button type="primary" danger onClick={() => handleSubmit('invoice')}>提交</Button>
              </Space>
            )}
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={paymentTabItems} />

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
