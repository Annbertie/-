import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Descriptions,
  Steps,
  Tabs,
  Progress,
  message,
  Spin,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { Project, ProjectProgress } from '../../types';

import ContractModule from '../modules/ContractModule';
import StampModule from '../modules/StampModule';
import ShipmentModule from '../modules/ShipmentModule';
import PaymentModule from '../modules/PaymentModule';
import ExpenseModule from '../modules/ExpenseModule';
import ClosureModule from '../modules/ClosureModule';


export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contract');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projectRes, progressRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/progress`),
      ]);
      setProject(projectRes.data.data);
      setProgress(progressRes.data.data);
    } catch (error) {
      message.error('加载项目详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 轻量级刷新：仅更新进度和项目状态，不触发全局 loading，避免子模块被卸载
  const refreshData = useCallback(async () => {
    if (!id) return;
    try {
      const [projectRes, progressRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/progress`),
      ]);
      setProject(projectRes.data.data);
      setProgress(progressRes.data.data);
    } catch {
      // 静默失败，避免干扰用户当前操作
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stepItems = [
    { title: '合同管理', key: 'contract' },
    { title: '合同盖章', key: 'stamp' },
    { title: '合同寄出', key: 'shipment' },
    { title: '打款开票', key: 'payment' },
    { title: '经费报销', key: 'expense' },
    { title: '结题', key: 'closure' },
  ];

  const currentStep = progress
    ? stepItems.findIndex((s) => !progress[s.key as keyof ProjectProgress]) - 1
    : -1;

  if (loading || !project) {
    return (
      <Card>
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      </Card>
    );
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card title="项目信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="项目名称">{project.project_name}</Descriptions.Item>
          <Descriptions.Item label="项目编号">{project.project_code}</Descriptions.Item>
          <Descriptions.Item label="企业名称">{project.company_name}</Descriptions.Item>
          <Descriptions.Item label="项目负责人">{project.lead_user_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="截止日期">
            {project.deadline ? dayjs(project.deadline).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">{project.status}</Descriptions.Item>
          <Descriptions.Item label="当前阶段">{project.current_stage}</Descriptions.Item>
          <Descriptions.Item label="创建人">{project.created_by_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="整体进度" span={2}>
            <Progress percent={progress?.overall || 0} status="active" />
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Steps current={currentStep}>
            {stepItems.map((item) => (
              <Steps.Step
                key={item.key}
                title={item.title}
                status={
                  progress && progress[item.key as keyof ProjectProgress]
                    ? 'finish'
                    : 'wait'
                }
              />
            ))}
          </Steps>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'contract', label: '合同管理', children: <ContractModule projectId={id} progress={progress} onRefresh={refreshData} /> },
            { key: 'stamp', label: '合同盖章', children: <StampModule projectId={id} progress={progress} onRefresh={refreshData} /> },
            { key: 'shipment', label: '合同寄出', children: <ShipmentModule projectId={id} progress={progress} onRefresh={refreshData} /> },
            { key: 'payment', label: '打款开票', children: <PaymentModule projectId={id} progress={progress} onRefresh={refreshData} /> },
            { key: 'expense', label: '经费报销', children: <ExpenseModule projectId={id} progress={progress} onRefresh={refreshData} /> },
            { key: 'closure', label: '结题', children: <ClosureModule projectId={id} progress={progress} onRefresh={refreshData} /> },
          ]}
        />
      </Card>
    </div>
  );
}
