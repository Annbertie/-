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
  Table,
  InputNumber,
  Row,
  Col,
  Statistic,
} from 'antd';
import { PlusOutlined, LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import FileUpload from '../../components/FileUpload';
import type { ReimbursementRecord, ReimbursementProgress, ProjectProgress } from '../../types';

interface Props {
  projectId: string;
  progress: ProjectProgress | null;
  onRefresh: () => void;
}

export default function ExpenseModule({ projectId, onRefresh }: Props) {
  const [records, setRecords] = useState<ReimbursementRecord[]>([]);
  const [progressData, setProgressData] = useState<ReimbursementProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, progressRes] = await Promise.all([
        api.get('/reimbursement-records', { params: { project_id: projectId } }),
        api.get(`/reimbursement-records/progress/${projectId}`),
      ]);
      setRecords(recordsRes.data.data?.list || []);
      setProgressData({
        total_payment: progressRes.data.data?.total_arrival || 0,
        total_reimbursed: progressRes.data.data?.reimbursed || 0,
        pending_reimbursement: (progressRes.data.data?.total_arrival || 0) - (progressRes.data.data?.reimbursed || 0),
        remaining: progressRes.data.data?.remaining || 0,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.error || '加载报销数据失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      // 文件字段映射：receipt -> receipt_url / receipt_name
      const { receipt, ...rest } = values;
      const payload: Record<string, unknown> = {
        ...rest,
        project_id: projectId,
        reimbursement_date: values.reimbursement_date
          ? dayjs(values.reimbursement_date as string).format('YYYY-MM-DD HH:mm')
          : undefined,
      };
      if (receipt) {
        payload.receipt_url = receipt;
        payload.receipt_name = String(receipt).split('/').pop() || '';
      }
      await api.post('/reimbursement-records', payload);
      message.success('新增报销记录成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchData();
      onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '新增报销记录失败';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRecord = async (record: ReimbursementRecord) => {
    try {
      await api.post(`/reimbursement-records/${record.id}/submit`);
      message.success('提交成功');
      fetchData();
      onRefresh();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '提交失败';
      message.error(msg);
    }
  };

  const columns = [
    {
      title: '金额（元）',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => v?.toFixed(2),
    },
    {
      title: '报销日期',
      dataIndex: 'reimbursement_date',
      key: 'reimbursement_date',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '责任人',
      dataIndex: 'responsible_person',
      key: 'responsible_person',
    },
    {
      title: '凭证附件',
      dataIndex: 'receipt',
      key: 'receipt',
      render: (v: string) => v || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        s === 'submitted' ? <Tag icon={<LockOutlined />} color="red">已提交</Tag> : <Tag color="orange">草稿</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ReimbursementRecord) => (
        record.status !== 'submitted' ? (
          <Button type="primary" danger size="small" onClick={() => handleSubmitRecord(record)}>
            提交
          </Button>
        ) : (
          <Tag>已锁定</Tag>
        )
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总到账金额（元）"
              value={progressData?.total_payment || 0}
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="累计已报销金额（元）"
              value={progressData?.total_reimbursed || 0}
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待报销金额（元）"
              value={progressData?.pending_reimbursement || 0}
              precision={2}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="剩余可报销金额（元）"
              value={progressData?.remaining || 0}
              precision={2}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title="报销记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新增报销记录
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title="新增报销记录"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        confirmLoading={submitting}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item label="报销金额" name="amount" rules={[{ required: true, message: '请输入报销金额' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入报销金额" />
          </Form.Item>
          <Form.Item label="报销日期" name="reimbursement_date" rules={[{ required: true, message: '请选择报销日期' }]}>
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item label="责任人" name="responsible_person" rules={[{ required: true, message: '请输入责任人' }]}>
            <Input placeholder="请输入责任人" />
          </Form.Item>
          <Form.Item label="凭证附件" name="receipt">
            <FileUpload />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
