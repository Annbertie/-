import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { UploadFile } from 'antd';

interface FileUploadProps {
  /** 已上传的文件URL */
  value?: string;
  /** 文件URL变化回调 */
  onChange?: (url: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

export default function FileUpload({ value, onChange, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  // 从URL中提取文件名用于显示
  const getFileName = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1] || '已上传文件';
  };

  // 自定义上传：先调 POST /api/upload 上传到服务器
  const handleUpload = async (file: File) => {
    if (disabled) {
      message.warning('当前状态不允许上传文件');
      return false;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success && res.data?.data?.url) {
        onChange?.(res.data.data.url);
        message.success('文件上传成功');
      } else {
        message.error('文件上传失败');
      }
    } catch (err) {
      console.error('文件上传错误:', err);
      message.error('文件上传失败，请重试');
    } finally {
      setUploading(false);
    }
    return false; // 阻止 antd Upload 的默认上传行为
  };

  // 删除已上传的文件
  const handleRemove = () => {
    onChange?.('');
    message.info('已清除文件');
  };

  // 如果已有文件URL，显示文件信息和删除按钮
  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileOutlined />
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getFileName(value)}
        </a>
        {!disabled && (
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={handleRemove}
          >
            删除
          </Button>
        )}
      </div>
    );
  }

  // 没有文件时显示上传按钮
  const fileList: UploadFile[] = [];

  return (
    <Upload
      fileList={fileList}
      beforeUpload={handleUpload}
      showUploadList={false}
      disabled={disabled || uploading}
    >
      <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
        {uploading ? '上传中...' : '选择文件上传'}
      </Button>
    </Upload>
  );
}
