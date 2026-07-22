import { getDb, run } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export function initDatabase() {
  const db = getDb();

  // users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      phone TEXT,
      email TEXT,
      department TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // projects
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_code TEXT NOT NULL UNIQUE,
      project_name TEXT NOT NULL,
      company_name TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
      deadline TEXT,
      lead_user_id TEXT,
      lead_user_name TEXT,
      remark TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // project_members
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(project_id, user_id)
    )
  `);

  // contract_reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_reviews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      review_time TEXT,
      drafting_party TEXT CHECK(drafting_party IN ('our_side', 'their_side')),
      contract_file_url TEXT,
      contract_file_name TEXT,
      review_remark TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // contract_confirmations
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_confirmations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      confirmation_time TEXT,
      final_contract_url TEXT,
      final_contract_name TEXT,
      confirmation_desc TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // contract_receipts
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_receipts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      receipt_time TEXT,
      tracking_number TEXT,
      receipt_screenshot_url TEXT,
      receipt_screenshot_name TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // contract_stamps
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_stamps (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      stamp_time TEXT,
      contract_count INTEGER,
      is_scanned INTEGER DEFAULT 0,
      scan_file_url TEXT,
      scan_file_name TEXT,
      is_uploaded_to_system INTEGER DEFAULT 0,
      system_upload_remark TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // contract_shipments
  db.exec(`
    CREATE TABLE IF NOT EXISTS contract_shipments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      shipment_time TEXT,
      tracking_number TEXT,
      courier_company TEXT,
      customer_signed INTEGER DEFAULT 0,
      sign_proof_url TEXT,
      sign_proof_name TEXT,
      confirmed_with_customer INTEGER DEFAULT 0,
      chat_screenshot_url TEXT,
      chat_screenshot_name TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // payments
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      amount REAL,
      arrival_time TEXT,
      bank_proof_url TEXT,
      bank_proof_name TEXT,
      payment_remark TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // fund_claims
  db.exec(`
    CREATE TABLE IF NOT EXISTS fund_claims (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      claim_time TEXT,
      claim_amount REAL,
      claim_desc TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // invoices
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      invoice_type TEXT CHECK(invoice_type IN ('vat_special', 'vat_normal', 'vat_electronic', 'receipt')),
      preview_send_time TEXT,
      customer_confirm_time TEXT,
      official_issue_time TEXT,
      invoice_send_time TEXT,
      invoice_file_url TEXT,
      invoice_file_name TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // reimbursement_records
  db.exec(`
    CREATE TABLE IF NOT EXISTS reimbursement_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      amount REAL,
      reimbursement_date TEXT,
      responsible_person TEXT,
      receipt_url TEXT,
      receipt_name TEXT,
      remark TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // project_closures
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_closures (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      responsible_person TEXT,
      closure_time TEXT,
      research_report_url TEXT,
      research_report_name TEXT,
      acceptance_report_url TEXT,
      acceptance_report_name TEXT,
      closure_remark TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
      submitted_by TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // modification_requests
  db.exec(`
    CREATE TABLE IF NOT EXISTS modification_requests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      target_module TEXT NOT NULL,
      target_record_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_by TEXT,
      review_comment TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // operation_logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      project_id TEXT,
      module TEXT,
      action TEXT,
      detail TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('system', 'approval', 'feedback')),
      title TEXT NOT NULL,
      content TEXT,
      related_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // feedbacks
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved')),
      reply_content TEXT,
      replied_by TEXT,
      replied_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // announcements
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // system_configs
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_configs (
      id TEXT PRIMARY KEY,
      config_key TEXT NOT NULL UNIQUE,
      config_value TEXT,
      description TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  // 插入默认管理员
  const adminExists = db.prepare('SELECT 1 FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const now = new Date().toISOString();
    const adminId = uuidv4();
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, username, password_hash, real_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, 'admin', passwordHash, '管理员', 'admin', 'active', now, now);
  }

  console.log('Database initialized successfully');
}
