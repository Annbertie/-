import { Router } from 'express';
import { query, get, run } from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/feedbacks
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    const countResult = get<any>('SELECT COUNT(*) as total FROM feedbacks WHERE user_id = ?', [req.userId]);
    const total = countResult ? countResult.total : 0;

    const list = query<any>(
      'SELECT * FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.userId, size, offset]
    );

    res.json({
      success: true,
      data: { list, pagination: { page: pageNum, pageSize: size, total } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取反馈列表失败' });
  }
});

// POST /api/feedbacks
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: '标题不能为空' });
      return;
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    run(
      'INSERT INTO feedbacks (id, user_id, title, content, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, title, content || null, category || null, 'pending', now, now]
    );

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交反馈失败' });
  }
});

export default router;
