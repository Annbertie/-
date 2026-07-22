import { Router } from 'express';
import { query, get, run } from '../db/db';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth';
import { logOperation } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Public: GET /api/announcements (no admin required)
router.get('/announcements', authMiddleware, (req: AuthRequest, res) => {
  try {
    const list = query<any>(
      'SELECT a.*, u.real_name as created_by_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.is_active = 1 ORDER BY a.created_at DESC',
      []
    );
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公告列表失败' });
  }
});

// Admin routes below
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/members
router.get('/members', (req: AuthRequest, res) => {
  try {
    const { keyword, status, role, page = '1', pageSize = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }
    if (keyword) {
      where += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ? OR email LIKE ? OR department LIKE ?)';
      const k = `%${keyword}%`;
      params.push(k, k, k, k, k);
    }

    const countResult = get<any>(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const total = countResult ? countResult.total : 0;

    const list = query<any>(
      `SELECT id, username, real_name, phone, email, department, role, status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const deptStats = query<any>("SELECT department, COUNT(*) as count FROM users WHERE department IS NOT NULL AND department != '' GROUP BY department");

    res.json({
      success: true,
      data: {
        list,
        pagination: { page: pageNum, pageSize: size, total },
        dept_stats: deptStats
      }
    });
  } catch (error: any) {
    console.error('GET /members error:', error?.message || error);
    res.status(500).json({ success: false, error: '获取成员列表失败' });
  }
});

// POST /api/admin/members
router.post('/members', (req: AuthRequest, res) => {
  try {
    const { username, password, real_name, phone, email, department, role } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      return;
    }

    const existing = get<any>('SELECT 1 FROM users WHERE username = ?', [username]);
    if (existing) {
      res.status(400).json({ success: false, error: '用户名已存在' });
      return;
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    run(
      'INSERT INTO users (id, username, password_hash, real_name, phone, email, department, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, username, passwordHash, real_name || null, phone || null, email || null, department || null, role || 'user', 'active', now, now]
    );

    logOperation({ userId: req.userId, userName: req.userName, module: 'admin', action: 'create_member', detail: `新增成员: ${username}` });
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '新增成员失败' });
  }
});

// PUT /api/admin/members/:id
router.put('/members/:id', (req: AuthRequest, res) => {
  try {
    const { real_name, phone, email, department, role, status, username } = req.body;
    const now = new Date().toISOString();

    console.log('UPDATE member:', { username, real_name, id: req.params.id });

    if (username) {
      const existing = get<any>('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.params.id]);
      if (existing) {
        res.status(400).json({ success: false, error: '该用户名已被占用' });
        return;
      }
    }

    if (username) {
      run(
        'UPDATE users SET username = ?, real_name = ?, phone = ?, email = ?, department = ?, role = ?, status = ?, updated_at = ? WHERE id = ?',
        [username, real_name || null, phone || null, email || null, department || null, role || 'user', status || 'active', now, req.params.id]
      );
    } else {
      run(
        'UPDATE users SET real_name = ?, phone = ?, email = ?, department = ?, role = ?, status = ?, updated_at = ? WHERE id = ?',
        [real_name || null, phone || null, email || null, department || null, role || 'user', status || 'active', now, req.params.id]
      );
    }

    logOperation({ userId: req.userId, userName: req.userName, module: 'admin', action: 'update_member', detail: `更新成员: ${req.params.id}` });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新成员失败' });
  }
});

// POST /api/admin/members/:id/reset-password
router.post('/members/:id/reset-password', (req: AuthRequest, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password) {
      res.status(400).json({ success: false, error: '新密码不能为空' });
      return;
    }

    const passwordHash = bcrypt.hashSync(new_password, 10);
    const now = new Date().toISOString();
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, now, req.params.id]);

    logOperation({ userId: req.userId, userName: req.userName, module: 'admin', action: 'reset_password', detail: `重置密码: ${req.params.id}` });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '重置密码失败' });
  }
});

// DELETE /api/admin/members/:id
router.delete('/members/:id', (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.userId) {
      res.status(400).json({ success: false, error: '不能删除自己' });
      return;
    }

    run('DELETE FROM users WHERE id = ?', [req.params.id]);
    logOperation({ userId: req.userId, userName: req.userName, module: 'admin', action: 'delete_member', detail: `删除成员: ${req.params.id}` });
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除成员失败' });
  }
});

// GET /api/admin/configs
router.get('/configs', (req: AuthRequest, res) => {
  try {
    const list = query<any>('SELECT * FROM system_configs ORDER BY config_key');
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取配置失败' });
  }
});

// PUT /api/admin/configs/:key
router.put('/configs/:key', (req: AuthRequest, res) => {
  try {
    const { config_value, description } = req.body;
    const now = new Date().toISOString();
    run(
      'INSERT INTO system_configs (id, config_key, config_value, description, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, description = COALESCE(excluded.description, description), updated_at = excluded.updated_at',
      [uuidv4(), req.params.key, config_value || null, description || null, now]
    );
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新配置失败' });
  }
});

// GET /api/admin/feedbacks
router.get('/feedbacks', (req: AuthRequest, res) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    const countResult = get<any>('SELECT COUNT(*) as total FROM feedbacks', []);
    const total = countResult ? countResult.total : 0;

    const list = query<any>(`
      SELECT f.*, u.real_name as user_name
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [size, offset]);

    res.json({
      success: true,
      data: { list, pagination: { page: pageNum, pageSize: size, total } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取反馈列表失败' });
  }
});

// PUT /api/admin/feedbacks/:id/reply
router.put('/feedbacks/:id/reply', (req: AuthRequest, res) => {
  try {
    const { reply_content } = req.body;
    if (!reply_content) {
      res.status(400).json({ success: false, error: '回复内容不能为空' });
      return;
    }

    const now = new Date().toISOString();
    run(
      'UPDATE feedbacks SET reply_content = ?, replied_by = ?, replied_at = ?, status = ?, updated_at = ? WHERE id = ?',
      [reply_content, req.userId, now, 'resolved', now, req.params.id]
    );

    const feedback = get<any>('SELECT user_id FROM feedbacks WHERE id = ?', [req.params.id]);
    if (feedback && feedback.user_id) {
      const nid = uuidv4();
      run(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nid, feedback.user_id, 'feedback', '反馈已回复', `您的问题反馈已得到回复`, req.params.id, now]
      );
    }

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '回复反馈失败' });
  }
});

// GET /api/admin/announcements
router.get('/announcements', (req: AuthRequest, res) => {
  try {
    const list = query<any>(`
      SELECT a.*, u.real_name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
    `, []);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公告列表失败' });
  }
});

// POST /api/admin/announcements
router.post('/announcements', (req: AuthRequest, res) => {
  try {
    const { title, content, is_active } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: '标题不能为空' });
      return;
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    run(
      'INSERT INTO announcements (id, title, content, is_active, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, content || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.userId, now, now]
    );

    // 通知所有用户
    const users = query<any>('SELECT id FROM users WHERE status = ?', ['active']);
    users.forEach((u: any) => {
      const nid = uuidv4();
      run(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nid, u.id, 'system', '新公告', title, id, now]
      );
    });

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '发布公告失败' });
  }
});

// PUT /api/admin/announcements/:id
router.put('/announcements/:id', (req: AuthRequest, res) => {
  try {
    const { title, content, is_active } = req.body;
    const now = new Date().toISOString();
    run(
      'UPDATE announcements SET title = ?, content = ?, is_active = ?, updated_at = ? WHERE id = ?',
      [title || null, content || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, now, req.params.id]
    );
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新公告失败' });
  }
});

// GET /api/admin/logs
router.get('/logs', (req: AuthRequest, res) => {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    const countResult = get<any>('SELECT COUNT(*) as total FROM operation_logs', []);
    const total = countResult ? countResult.total : 0;

    const list = query<any>(
      'SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [size, offset]
    );

    res.json({
      success: true,
      data: { list, pagination: { page: pageNum, pageSize: size, total } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取日志失败' });
  }
});

// GET /api/admin/export/projects
router.get('/export/projects', (req: AuthRequest, res) => {
  try {
    const projects = query<any>(`
      SELECT p.*,
        lead_user.real_name as lead_user_name,
        creator.real_name as created_by_name
      FROM projects p
      LEFT JOIN users lead_user ON p.lead_user_id = lead_user.id
      LEFT JOIN users creator ON p.created_by = creator.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: '导出项目数据失败' });
  }
});

export default router;
