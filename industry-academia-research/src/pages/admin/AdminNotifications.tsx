import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  message,
  Tabs,
} from 'antd';
import { PlusOutlined, CheckOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Feedback, Announcement } from '../../types';


export default function AdminNotifications() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announceForm] = Form.useForm();
  const [announcing, setAnnouncing] = useState(false);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Feedback | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await api.get('/admin/feedbacks');
      setFeedbacks(res.data.data?.list || []);
    } catch (error) {
      message.error('加载反馈列表失败');
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data.data || []);
    } catch (error) {
      message.error('加载公告列表失败');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFeedbacks(), fetchAnnouncements()]);
    setLoading(false);
  }, [fetchFeedbacks, fetchAnnouncements]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateAnnouncement = async (values: Record<string, unknown>) => {
    setAnnouncing(true);
    try {
      await api.post('/admin/announcements', values);
      message.success('发布公告成功');
      setIsAnnounceModalOpen(false);
      announceForm.resetFields();
      fetchAnnouncements();
    } catch (error) {
      message.error('发布公告失败');
    } finally {
      setAnnouncing(false);
    }
  };

  const openReply = (feedback: Feedback) => {
    setReplyTarget(feedback);
    setReplyContent(feedback.reply || '');
    setIsReplyModalOpen(true);
  };

  const handleReply = async () => {
    if (!replyTarget) return;
    setReplying(true);
    try {
      await api.put(`/admin/feedbacks/${replyTarget.id}/reply`, { reply: replyContent });
      message.success('回复成功');
      setIsReplyModalOpen(false);
      fetchFeedbacks();
    } catch (error) {
      message.error('回复失败');
    } finally {
      setReplying(false);
    }
  };

  const markResolved = async (feedback: Feedback) => {
    try {
      await api.put(`/admin/feedbacks/${feedback.id}/reply`, { reply: feedback.reply || '', status: 'resolved' });
      message.success('已标记为已处理');
      fetchFeedbacks();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const feedbackColumns = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
    },
    {
      title: '反馈内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'resolved' ? 'green' : 'orange'}>
          {s === 'resolved' ? '已处理' : '待处理'}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Feedback) => (
        <Space>
          <Button type="link" icon={<MessageOutlined />} onClick={() => openReply(record)}>
            回复
          </Button>
          {record.status !== 'resolved' && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => markResolved(record)}>
              标记已处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const announcementColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '发布人',
      dataIndex: 'created_by',
      key: 'created_by',
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => (d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  return (
    <Card>
      <Tabs
        defaultActiveKey="feedbacks"
        items={[
          {
            key: 'feedbacks',
            label: '问题反馈',
            children: (
              <Table
                rowKey="id"
                columns={feedbackColumns}
                dataSource={feedbacks}
                loading={loading}
              />
            ),
          },
          {
            key: 'announcements',
            label: '公告管理',
            children: (
              <Table
                rowKey="id"
                columns={announcementColumns}
                dataSource={announcements}
                loading={loading}
              />
            ),
          },
        ]}
        tabBarExtraContent={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAnnounceModalOpen(true)}>
            发布公告
          </Button>
        }
      />

      <Modal
        title="发布公告"
        open={isAnnounceModalOpen}
        onOk={() => announceForm.submit()}
        onCancel={() => { setIsAnnounceModalOpen(false); announceForm.resetFields(); }}
        confirmLoading={announcing}
      >
        <Form form={announceForm} onFinish={handleCreateAnnouncement} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入公告标题" />
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={5} placeholder="请输入公告内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`回复反馈 - 用户 #${replyTarget?.user_id || ''}`}
        open={isReplyModalOpen}
        onOk={handleReply}
        onCancel={() => setIsReplyModalOpen(false)}
        confirmLoading={replying}
      >
        <Form layout="vertical">
          <Form.Item label="反馈内容">
            <Input.TextArea rows={3} value={replyTarget?.content || ''} disabled />
          </Form.Item>
          <Form.Item label="回复内容">
            <Input.TextArea
              rows={4}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="请输入回复内容"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
