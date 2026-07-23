import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/supabaseApi';
import type { ModificationRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const { Option } = Select;

const moduleLabelMap: Record<string, string> = {
  contract_reviews: '合同审核',
  contract_confirmations: '合同确认',
  contract_receipts: '合同回执',
  contract_stamps: '合同盖章',
  contract_shipments: '合同寄出',
  payments: '打款',
  invoices: '开票',
  fund_claims: '经费认领',
  reimbursement_records: '经费报销',
  project_closures: '结题',
};

export default function AdminApprovals() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState<ModificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveRemark, setApproveRemark] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveTarget, setApproveTarget] = useState<ModificationRequest | null>(null);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ModificationRequest | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/modification-requests', { params });
      const rawData = res.data.data;
      setRequests(Array.isArray(rawData) ? rawData : rawData?.list || []);
    } catch (error) {
      message.error('加载审批列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openApprove = (record: ModificationRequest) => {
    setApproveTarget(record);
    setApproveRemark('');
    setIsApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      await api.post(`/modification-requests/${approveTarget.id}/approve`, { remark: approveRemark });
      message.success('已同意');
      setIsApproveModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setApproving(false);
    }
  };

  const openReject = (record: ModificationRequest) => {
    setRejectTarget(record);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      message.error('请填写驳回原因');
      return;
    }
    setRejecting(true);
    try {
      await api.post(`/modification-requests/${rejectTarget.id}/reject`, { review_comment: rejectReason });
      message.success('已驳回');
      setIsRejectModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setRejecting(false);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待审批' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已驳回' },
  };

  const columns = [
    { title: '申请用户', dataIndex: 'user_name', key: 'user_name', render: (v: string) => v || '-' },
    {
      title: '所属项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (v: string) => v || '-',
    },
    {
      title: '申请模块',
      dataIndex: 'target_module',
      key: 'target_module',
      render: (v: string) => moduleLabelMap[v] || v || '-',
    },
    { title: '申请原因', dataIndex: 'reason', key: 'reason' },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const info = statusMap[s] || { color: 'default', text: s };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ModificationRequest) =>
        isAdmin && record.status === 'pending' ? (
          <Space>
            <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => openApprove(record)}>
              同意
            </Button>
            <Button danger icon={<CloseOutlined />} size="small" onClick={() => openReject(record)}>
              驳回
            </Button>
          </Space>
        ) : (
          <span>-</span>
        ),
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>审批中心</h2>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v)}
          style={{ width: 140 }}
          allowClear
        >
          <Option value="pending">待审批</Option>
          <Option value="approved">已通过</Option>
          <Option value="rejected">已驳回</Option>
        </Select>
        <Button type="primary" onClick={fetchData}>查询</Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={requests} loading={loading} />

      <Modal
        title="同意申请"
        open={isApproveModalOpen}
        onOk={handleApprove}
        onCancel={() => setIsApproveModalOpen(false)}
        confirmLoading={approving}
      >
        <Form layout="vertical">
          <Form.Item label="备注（可选）">
            <Input.TextArea
              rows={3}
              value={approveRemark}
              onChange={(e) => setApproveRemark(e.target.value)}
              placeholder="可填写审批备注"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回申请"
        open={isRejectModalOpen}
        onOk={handleReject}
        onCancel={() => setIsRejectModalOpen(false)}
        confirmLoading={rejecting}
      >
        <Form layout="vertical">
          <Form.Item label="驳回原因" required>
            <Input.TextArea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="必须填写驳回原因"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
