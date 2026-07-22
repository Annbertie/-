import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase } from './db/init';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// 初始化数据库
initDatabase();

// 确保 uploads 目录存在
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('已创建 uploads 目录');
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制 50MB
  },
});

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（提供 uploads 目录的静态访问）
app.use('/uploads', express.static(uploadsDir));

// 文件上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择要上传的文件' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    data: {
      url: fileUrl,
      name: req.file.originalname,
    },
  });
});

// API路由
app.use('/api', routes);

async function startServer() {
  if (isDev) {
    // 开发环境：集成Vite dev server
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: path.resolve(__dirname, '../')
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server not available, skipping...');
    }
  } else {
    // 生产环境：提供静态文件
    app.use(express.static(path.resolve(__dirname, '../dist')));
  }

  // SPA回退（生产环境）
  if (!isDev) {
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.resolve(__dirname, '../dist/index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${isDev ? 'development' : 'production'}`);
    console.log(`Access: http://localhost:${PORT} or http://<your-ip>:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
