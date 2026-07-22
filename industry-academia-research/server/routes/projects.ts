import { Router } from 'express';
import { query, get, run } from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/projects
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { keyword, status, current_stage, page = '1', pageSize = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
    const offset = (pageNum - 1) * size;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    if (keyword) {
      where += ' AND (p.project_name LIKE ? OR p.project_code LIKE ? OR p.company_name LIKE ?)';
      const k = `%${keyword}%`;
      params.push(k, k, k);
    }

    if (current_stage) {
      where += ' AND p.current_stage = ?';
      params.push(current_stage);
    }

    const countSql = `SELECT COUNT(*) as total FROM projects p ${where}`;
    const countResult = get<any>(countSql, params);
    const total = countResult ? countResult.total : 0;

    const sql = `
      SELECT p.*,
        lead_user.real_name as lead_user_name,
        creator.real_name as created_by_name
      FROM projects p
      LEFT JOIN users lead_user ON p.lead_user_id = lead_user.id
      LEFT JOIN users creator ON p.created_by = creator.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const list = query<any>(sql, [...params, size, offset]);

    res.json({
      success: true,
      data: {
        list,
        pagination: { page: pageNum, pageSize: size, total }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目列表失败' });
  }
});

// GET /api/projects/:id
router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const sql = `
      SELECT p.*,
        lead_user.real_name as lead_user_name,
        creator.real_name as created_by_name
      FROM projects p
      LEFT JOIN users lead_user ON p.lead_user_id = lead_user.id
      LEFT JOIN users creator ON p.created_by = creator.id
      WHERE p.id = ?
    `;
    const project = get<any>(sql, [req.params.id]);
    if (!project) {
      res.status(404).json({ success: false, error: '项目不存在' });
      return;
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目详情失败' });
  }
});

// POST /api/projects
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { project_code, project_name, company_name, deadline, remark } = req.body;
    if (!project_code || !project_name) {
      res.status(400).json({ success: false, error: '项目编号和项目名称不能为空' });
      return;
    }

    const existing = get<any>('SELECT 1 FROM projects WHERE project_code = ?', [project_code]);
    if (existing) {
      res.status(400).json({ success: false, error: '项目编号已存在' });
      return;
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const user = get<any>('SELECT real_name FROM users WHERE id = ?', [req.userId]);

    run(
      `INSERT INTO projects (id, project_code, project_name, company_name, status, deadline, lead_user_id, lead_user_name, remark, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, project_code, project_name, company_name || null, 'active', deadline || null, req.userId, user?.real_name || req.userName, remark || null, req.userId, now, now]
    );

    logOperation({
      userId: req.userId,
      userName: req.userName,
      projectId: id,
      module: 'projects',
      action: 'create',
      detail: `创建项目: ${project_name}`
    });

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建项目失败' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { project_name, company_name, status, deadline, remark } = req.body;
    const now = new Date().toISOString();

    run(
      'UPDATE projects SET project_name = ?, company_name = ?, status = ?, deadline = ?, remark = ?, updated_at = ? WHERE id = ?',
      [project_name || null, company_name || null, status || 'active', deadline || null, remark || null, now, req.params.id]
    );

    logOperation({
      userId: req.userId,
      userName: req.userName,
      projectId: req.params.id,
      module: 'projects',
      action: 'update',
      detail: `更新项目: ${project_name}`
    });

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新项目失败' });
  }
});

// GET /api/projects/:id/members
router.get('/:id/members', authMiddleware, (req: AuthRequest, res) => {
  try {
    const members = query<any>(`
      SELECT pm.*, u.username, u.real_name, u.department
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [req.params.id]);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目成员失败' });
  }
});

// GET /api/projects/:id/logs
router.get('/:id/logs', authMiddleware, (req: AuthRequest, res) => {
  try {
    const logs = query<any>(
      'SELECT * FROM operation_logs WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取操作日志失败' });
  }
});

// GET /api/projects/:id/progress
router.get('/:id/progress', authMiddleware, (req: AuthRequest, res) => {
  try {
    const projectId = req.params.id;

    // Each stage group contains multiple sub-module tables; ALL must be submitted to mark stage complete
    const stages = [
      { key: 'contract', tables: ['contract_reviews', 'contract_confirmations', 'contract_receipts'] },
      { key: 'stamp', tables: ['contract_stamps'] },
      { key: 'shipment', tables: ['contract_shipments'] },
      { key: 'payment', tables: ['payments', 'fund_claims', 'invoices'] },
      { key: 'expense', tables: ['reimbursement_records'] },
      { key: 'closure', tables: ['project_closures'] },
    ];

    const result: Record<string, boolean> = {};
    let completedCount = 0;

    stages.forEach(stage => {
      // All sub-tables must have at least one submitted record
      const allDone = stage.tables.every(table => {
        const row = get<any>(`SELECT COUNT(*) as cnt FROM ${table} WHERE project_id = ? AND status = 'submitted'`, [projectId]);
        return (row?.cnt || 0) > 0;
      });
      result[stage.key] = allDone;
      if (allDone) completedCount++;
    });

    const overall = Math.round((completedCount / stages.length) * 100);

    res.json({ success: true, data: { overall, ...result } });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取项目进度失败' });
  }
});

export default router;
