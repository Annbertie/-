import { Router } from 'express';
import { query, get, run } from '../db/db';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/modification-requests
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.userRole !== 'admin') {
      where += ' AND mr.user_id = ?';
      params.push(req.userId);
    }

    const countSql = `
      SELECT COUNT(*) as total FROM modification_requests mr ${where}
    `;
    const countResult = get<any>(countSql, params);
    const total = countResult ? countResult.total : 0;

    const sql = `
      SELECT mr.*,
        u.real_name as user_name,
        p.project_name
      FROM modification_requests mr
      LEFT JOIN users u ON mr.user_id = u.id
      LEFT JOIN projects p ON mr.project_id = p.id
      ${where}
      ORDER BY mr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const list = query<any>(sql, [...params, size, offset]);

    res.json({
      success: true,
      data: { list, pagination: { page: pageNum, pageSize: size, total } }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取修改申请列表失败' });
  }
});

// POST /api/modification-requests
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { project_id, target_module, target_record_id, reason } = req.body;
    if (!target_module || !target_record_id || !reason) {
      res.status(400).json({ success: false, error: '目标模块、记录ID和原因不能为空' });
      return;
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    run(
      'INSERT INTO modification_requests (id, project_id, user_id, target_module, target_record_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, project_id || null, req.userId, target_module, target_record_id, reason, 'pending', now, now]
    );

    // 通知所有admin
    const admins = query<any>('SELECT id FROM users WHERE role = ? AND status = ?', ['admin', 'active']);
    admins.forEach((admin: any) => {
      const nid = uuidv4();
      run(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nid, admin.id, 'approval', '新的修改申请', `用户 ${req.userName} 提交了修改申请`, id, now]
      );
    });

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建修改申请失败' });
  }
});

// POST /api/modification-requests/:id/approve
router.post('/:id/approve', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const now = new Date().toISOString();

    // 获取修改申请信息
    const mr = get<any>('SELECT user_id, target_module, target_record_id FROM modification_requests WHERE id = ?', [req.params.id]);

    // 更新修改申请状态
    run(
      'UPDATE modification_requests SET status = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?',
      ['approved', req.userId, now, now, req.params.id]
    );

    // 同时解锁原记录：将状态从 submitted 改回 draft
    const allowedTables = ['contract_reviews', 'contract_confirmations', 'contract_receipts', 'contract_stamps', 'contract_shipments', 'payments', 'invoices', 'fund_claims', 'reimbursement_records', 'project_closures'];
    if (mr && mr.target_module && mr.target_record_id && allowedTables.includes(mr.target_module)) {
      run(`UPDATE ${mr.target_module} SET status = ?, updated_at = ? WHERE id = ?`, ['draft', now, mr.target_record_id]);
    }

    if (mr && mr.user_id) {
      const nid = uuidv4();
      run(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nid, mr.user_id, 'approval', '修改申请已通过', '您的修改申请已被管理员批准', req.params.id, now]
      );
    }

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '审批失败' });
  }
});

// POST /api/modification-requests/:id/reject
router.post('/:id/reject', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { review_comment } = req.body;
    if (!review_comment) {
      res.status(400).json({ success: false, error: '驳回原因不能为空' });
      return;
    }

    const now = new Date().toISOString();
    run(
      'UPDATE modification_requests SET status = ?, reviewed_by = ?, review_comment = ?, reviewed_at = ?, updated_at = ? WHERE id = ?',
      ['rejected', req.userId, review_comment, now, now, req.params.id]
    );

    const mr = get<any>('SELECT user_id FROM modification_requests WHERE id = ?', [req.params.id]);
    if (mr && mr.user_id) {
      const nid = uuidv4();
      run(
        'INSERT INTO notifications (id, user_id, type, title, content, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nid, mr.user_id, 'approval', '修改申请被驳回', `您的修改申请被驳回，原因：${review_comment}`, req.params.id, now]
      );
    }

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '驳回失败' });
  }
});

export default router;
