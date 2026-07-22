import { Router, Request, Response } from 'express';
import { query, get, run } from '../db/db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logOperation } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface ModuleConfig {
  table: string;
  route: string;
  fields: string[];
}

const modules: ModuleConfig[] = [
  {
    table: 'contract_reviews',
    route: 'contract-reviews',
    fields: ['project_id', 'responsible_person', 'review_time', 'drafting_party', 'contract_file_url', 'contract_file_name', 'review_remark']
  },
  {
    table: 'contract_confirmations',
    route: 'contract-confirmations',
    fields: ['project_id', 'responsible_person', 'confirmation_time', 'final_contract_url', 'final_contract_name', 'confirmation_desc']
  },
  {
    table: 'contract_receipts',
    route: 'contract-receipts',
    fields: ['project_id', 'responsible_person', 'receipt_time', 'tracking_number', 'receipt_screenshot_url', 'receipt_screenshot_name']
  },
  {
    table: 'contract_stamps',
    route: 'contract-stamps',
    fields: ['project_id', 'responsible_person', 'stamp_time', 'contract_count', 'is_scanned', 'scan_file_url', 'scan_file_name', 'is_uploaded_to_system', 'system_upload_remark']
  },
  {
    table: 'contract_shipments',
    route: 'contract-shipments',
    fields: ['project_id', 'responsible_person', 'shipment_time', 'tracking_number', 'courier_company', 'customer_signed', 'sign_proof_url', 'sign_proof_name', 'confirmed_with_customer', 'chat_screenshot_url', 'chat_screenshot_name']
  },
  {
    table: 'payments',
    route: 'payments',
    fields: ['project_id', 'responsible_person', 'amount', 'arrival_time', 'bank_proof_url', 'bank_proof_name', 'payment_remark']
  },
  {
    table: 'fund_claims',
    route: 'fund-claims',
    fields: ['project_id', 'responsible_person', 'claim_time', 'claim_amount', 'claim_desc']
  },
  {
    table: 'invoices',
    route: 'invoices',
    fields: ['project_id', 'invoice_type', 'preview_send_time', 'customer_confirm_time', 'official_issue_time', 'invoice_send_time', 'invoice_file_url', 'invoice_file_name']
  },
  {
    table: 'reimbursement_records',
    route: 'reimbursement-records',
    fields: ['project_id', 'amount', 'reimbursement_date', 'responsible_person', 'receipt_url', 'receipt_name', 'remark']
  },
  {
    table: 'project_closures',
    route: 'project-closures',
    fields: ['project_id', 'responsible_person', 'closure_time', 'research_report_url', 'research_report_name', 'acceptance_report_url', 'acceptance_report_name', 'closure_remark']
  }
];

function buildUpdateSql(table: string, fields: string[], body: any, id: string): { sql: string; params: any[] } {
  const sets: string[] = [];
  const params: any[] = [];
  fields.forEach(f => {
    if (body[f] !== undefined) {
      sets.push(`${f} = ?`);
      const val = body[f];
      params.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
    }
  });
  const now = new Date().toISOString();
  sets.push('updated_at = ?');
  params.push(now);
  params.push(id);
  const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`;
  return { sql, params };
}

function buildInsertSql(table: string, fields: string[], body: any): { sql: string; params: any[] } {
  const cols: string[] = ['id', 'status', 'created_at', 'updated_at'];
  const placeholders: string[] = ['?', '?', '?', '?'];
  const params: any[] = [uuidv4(), 'draft', new Date().toISOString(), new Date().toISOString()];

  fields.forEach(f => {
    if (body[f] !== undefined) {
      cols.push(f);
      placeholders.push('?');
      const val = body[f];
      // SQLite cannot bind boolean, convert to integer
      params.push(typeof val === 'boolean' ? (val ? 1 : 0) : val);
    }
  });

  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, params };
}

function checkLocked(table: string, id: string, userId?: string): { locked: boolean; message?: string } {
  const record = get<any>(`SELECT status FROM ${table} WHERE id = ?`, [id]);
  if (!record) return { locked: false };
  if (record.status !== 'submitted') return { locked: false };

  const approved = get<any>(
    'SELECT 1 FROM modification_requests WHERE target_module = ? AND target_record_id = ? AND status = ?',
    [table, id, 'approved']
  );

  if (!approved) {
    return { locked: true, message: '该记录已锁定，请先提交修改申请' };
  }
  return { locked: false };
}

// Special route: GET /api/reimbursement-records/progress/:projectId (must be before generic :id routes)
router.get('/reimbursement-records/progress/:projectId', authMiddleware, (req: AuthRequest, res) => {
  try {
    const projectId = req.params.projectId;
    const paymentResult = get<any>(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE project_id = ? AND status = 'submitted'`, [projectId]);
    const reimbursementResult = get<any>(`SELECT COALESCE(SUM(amount), 0) as total FROM reimbursement_records WHERE project_id = ? AND status = 'submitted'`, [projectId]);

    const totalArrival = paymentResult?.total || 0;
    const reimbursed = reimbursementResult?.total || 0;
    const remaining = totalArrival - reimbursed;

    res.json({
      success: true,
      data: { total_arrival: totalArrival, reimbursed, remaining }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报销进度失败' });
  }
});

// Special handling for project-closures submit: also update project status (must be before generic :id/submit)
router.post('/project-closures/:id/submit', authMiddleware, (req: AuthRequest, res) => {
  try {
    const now = new Date().toISOString();
    const record = get<any>('SELECT project_id FROM project_closures WHERE id = ?', [req.params.id]);

    run(
      'UPDATE project_closures SET status = ?, submitted_by = ?, submitted_at = ?, updated_at = ? WHERE id = ?',
      ['submitted', req.userId, now, now, req.params.id]
    );

    if (record && record.project_id) {
      // 检查所有模块是否都已完成，只有全部完成才标记项目为"已完成"
      const stages = [
        { tables: ['contract_reviews', 'contract_confirmations', 'contract_receipts'] },
        { tables: ['contract_stamps'] },
        { tables: ['contract_shipments'] },
        { tables: ['payments', 'fund_claims', 'invoices'] },
        { tables: ['reimbursement_records'] },
        { tables: ['project_closures'] },
      ];

      let allComplete = true;
      for (const stage of stages) {
        const stageDone = stage.tables.every(table => {
          const row = get<any>(
            `SELECT COUNT(*) as cnt FROM ${table} WHERE project_id = ? AND status = 'submitted'`,
            [record.project_id]
          );
          return (row?.cnt || 0) > 0;
        });
        if (!stageDone) {
          allComplete = false;
          break;
        }
      }

      const newStatus = allComplete ? 'completed' : 'active';
      run('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, record.project_id]);
    }

    logOperation({
      userId: req.userId,
      userName: req.userName,
      projectId: record?.project_id,
      module: 'project_closures',
      action: 'submit',
      detail: '提交项目结题并标记项目完成'
    });

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交项目结题失败' });
  }
});

modules.forEach(m => {
  // GET list
  router.get(`/${m.route}`, authMiddleware, (req: AuthRequest, res) => {
    try {
      const { project_id, page = '1', pageSize = '10' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const size = Math.max(1, Math.min(100, parseInt(pageSize as string, 10)));
      const offset = (pageNum - 1) * size;

      let where = 'WHERE 1=1';
      const params: any[] = [];

      if (project_id) {
        where += ' AND project_id = ?';
        params.push(project_id);
      }

      const countResult = get<any>(`SELECT COUNT(*) as total FROM ${m.table} ${where}`, params);
      const total = countResult ? countResult.total : 0;

      const list = query<any>(`SELECT * FROM ${m.table} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, size, offset]);

      res.json({
        success: true,
        data: { list, pagination: { page: pageNum, pageSize: size, total } }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: `获取${m.route}列表失败` });
    }
  });

  // GET detail
  router.get(`/${m.route}/:id`, authMiddleware, (req: AuthRequest, res) => {
    try {
      const record = get<any>(`SELECT * FROM ${m.table} WHERE id = ?`, [req.params.id]);
      if (!record) {
        res.status(404).json({ success: false, error: '记录不存在' });
        return;
      }
      res.json({ success: true, data: record });
    } catch (error) {
      res.status(500).json({ success: false, error: '获取详情失败' });
    }
  });

  // POST create
  router.post(`/${m.route}`, authMiddleware, (req: AuthRequest, res) => {
    try {
      const { sql, params } = buildInsertSql(m.table, m.fields, req.body);
      run(sql, params);
      const id = params[0];

      logOperation({
        userId: req.userId,
        userName: req.userName,
        projectId: req.body.project_id,
        module: m.table,
        action: 'create',
        detail: `创建${m.route}记录`
      });

      res.json({ success: true, data: { id } });
    } catch (error: any) {
      console.error(`POST /${m.route} error:`, error?.message || error);
      res.status(500).json({ success: false, error: `创建${m.route}失败` });
    }
  });

  // PUT update
  router.put(`/${m.route}/:id`, authMiddleware, (req: AuthRequest, res) => {
    try {
      const lockCheck = checkLocked(m.table, req.params.id, req.userId);
      if (lockCheck.locked) {
        res.status(400).json({ success: false, error: lockCheck.message });
        return;
      }

      const { sql, params } = buildUpdateSql(m.table, m.fields, req.body, req.params.id);
      run(sql, params);

      logOperation({
        userId: req.userId,
        userName: req.userName,
        projectId: req.body.project_id,
        module: m.table,
        action: 'update',
        detail: `更新${m.route}记录`
      });

      res.json({ success: true, data: null });
    } catch (error) {
      res.status(500).json({ success: false, error: `更新${m.route}失败` });
    }
  });

  // POST submit
  router.post(`/${m.route}/:id/submit`, authMiddleware, (req: AuthRequest, res) => {
    try {
      const now = new Date().toISOString();
      run(
        `UPDATE ${m.table} SET status = 'submitted', submitted_by = ?, submitted_at = ?, updated_at = ? WHERE id = ?`,
        [req.userId, now, now, req.params.id]
      );

      logOperation({
        userId: req.userId,
        userName: req.userName,
        module: m.table,
        action: 'submit',
        detail: `提交${m.route}记录`
      });

      res.json({ success: true, data: null });
    } catch (error) {
      res.status(500).json({ success: false, error: `提交${m.route}失败` });
    }
  });
});

export default router;
