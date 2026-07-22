import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { get, run } from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' });
      return;
    }

    const user = get<any>('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, error: '账号已禁用' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' });
      return;
    }

    const token = user.id;
    const userInfo = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      phone: user.phone,
      email: user.email,
      department: user.department,
      role: user.role
    };

    res.json({ success: true, data: { token, user: userInfo } });
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user = get<any>('SELECT id, username, real_name, phone, email, department, role, status FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { real_name, phone, email, username } = req.body;
    const now = new Date().toISOString();

    if (username) {
      const existing = get<any>('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.userId]);
      if (existing) {
        res.status(400).json({ success: false, error: '该用户名已被占用' });
        return;
      }
      run(
        'UPDATE users SET username = ?, real_name = ?, phone = ?, email = ?, updated_at = ? WHERE id = ?',
        [username, real_name || null, phone || null, email || null, now, req.userId]
      );
    } else {
      run(
        'UPDATE users SET real_name = ?, phone = ?, email = ?, updated_at = ? WHERE id = ?',
        [real_name || null, phone || null, email || null, now, req.userId]
      );
    }

    res.json({ success: true, data: { username, real_name, phone, email } });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新个人信息失败' });
  }
});

// PUT /api/auth/password
router.put('/password', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      res.status(400).json({ success: false, error: '原密码和新密码不能为空' });
      return;
    }

    const user = get<any>('SELECT password_hash FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    const valid = bcrypt.compareSync(old_password, user.password_hash);
    if (!valid) {
      res.status(400).json({ success: false, error: '原密码错误' });
      return;
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    const now = new Date().toISOString();
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, req.userId]);
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '修改密码失败' });
  }
});

export default router;
