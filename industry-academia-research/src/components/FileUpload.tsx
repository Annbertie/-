import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import { supabase } from '../services/supabaseClient';
import type { UploadFile } from 'antd';

interface FileUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
}

export default function FileUpload({ value, onChange, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const getFileName = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1] || '已上传文件';
  };

  const handleUpload = async (file: File) => {
    if (disabled) {
      message.warning('当前状态不允许上传文件');
      return false;
    }

    setUploading(true);
    try {
      // 对文件名进行编码，去掉空格和特殊字符
      const safeName = file.name.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '');
      const fileName = `${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage.from('uploads').getPublicUrl(data!.path);
      onChange?.(publicUrl.publicUrl);
      message.success('文件上传成功');
    } catch (err: any) {
      console.error('文件上传错误:', err);
      message.error(err.message || '文件上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleRemove = () => {
    onChange?.('');
    message.info('已清除文件');
  };

  if (value) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileOutlined />
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getFileName(value)}
        </a>
        {!disabled && (
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={handleRemove}>
            删除
          </Button>
        )}
      </div>
    );
  }

  const fileList: UploadFile[] = [];

  return (
    <Upload fileList={fileList} beforeUpload={handleUpload} showUploadList={false} disabled={disabled || uploading}>
      <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
        {uploading ? '上传中...' : '选择文件上传'}
      </Button>
    </Upload>
  );
}
