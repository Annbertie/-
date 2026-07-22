import { Router } from 'express';
import { query, get, run } from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    const countResult = get<any>('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?', [req.userId]);
    const total = countResult ? countResult.total : 0;

    const list = query<any>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.userId, size, offset]
    );

    res.json({
      success: true,
      data: { list, pagination: { page: pageNum, pageSize: size, total } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取通知列表失败' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, (req: AuthRequest, res) => {
  try {
    run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '标记已读失败' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, (req: AuthRequest, res) => {
  try {
    const result = get<any>('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [req.userId]);
    res.json({ success: true, data: { count: result ? result.count : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取未读数量失败' });
  }
});

export default router;
