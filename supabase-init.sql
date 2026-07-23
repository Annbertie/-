-- =============================================
-- 产学研项目全流程管理系统 - Supabase 数据库初始化
-- =============================================

-- 1. 用户配置表（扩展 Supabase Auth 的 auth.users）
-- Supabase Auth 自带 auth.users 表管理邮箱密码登录
-- 这里创建 profiles 表存储额外的用户信息
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  real_name TEXT,
  phone TEXT,
  email TEXT,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, real_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'real_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. 项目表
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed')),
  deadline DATE,
  lead_user_id UUID REFERENCES public.profiles(id),
  lead_user_name TEXT,
  remark TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 项目成员表
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. 合同审核表
CREATE TABLE IF NOT EXISTS public.contract_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  review_time TIMESTAMPTZ,
  drafting_party TEXT CHECK(drafting_party IN ('our_side', 'their_side')),
  contract_file_url TEXT,
  contract_file_name TEXT,
  review_remark TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 合同确认表
CREATE TABLE IF NOT EXISTS public.contract_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  confirmation_time TIMESTAMPTZ,
  final_contract_url TEXT,
  final_contract_name TEXT,
  confirmation_desc TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 合同签收表
CREATE TABLE IF NOT EXISTS public.contract_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  receipt_time TIMESTAMPTZ,
  tracking_number TEXT,
  receipt_screenshot_url TEXT,
  receipt_screenshot_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. 合同盖章表
CREATE TABLE IF NOT EXISTS public.contract_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  stamp_time TIMESTAMPTZ,
  contract_count INTEGER,
  is_scanned BOOLEAN DEFAULT FALSE,
  scan_file_url TEXT,
  scan_file_name TEXT,
  is_uploaded_to_system BOOLEAN DEFAULT FALSE,
  system_upload_remark TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. 合同寄出表
CREATE TABLE IF NOT EXISTS public.contract_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  shipment_time TIMESTAMPTZ,
  tracking_number TEXT,
  courier_company TEXT,
  customer_signed BOOLEAN DEFAULT FALSE,
  sign_proof_url TEXT,
  sign_proof_name TEXT,
  confirmed_with_customer BOOLEAN DEFAULT FALSE,
  chat_screenshot_url TEXT,
  chat_screenshot_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. 客户打款表
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  amount NUMERIC(12,2),
  arrival_time TIMESTAMPTZ,
  bank_proof_url TEXT,
  bank_proof_name TEXT,
  payment_remark TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. 经费认领表
CREATE TABLE IF NOT EXISTS public.fund_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  claim_time TIMESTAMPTZ,
  claim_amount NUMERIC(12,2),
  claim_desc TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. 开票表
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_type TEXT CHECK(invoice_type IN ('vat_special', 'vat_normal', 'vat_electronic', 'receipt')),
  preview_send_time TIMESTAMPTZ,
  customer_confirm_time TIMESTAMPTZ,
  official_issue_time TIMESTAMPTZ,
  invoice_send_time TIMESTAMPTZ,
  invoice_file_url TEXT,
  invoice_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. 经费报销表
CREATE TABLE IF NOT EXISTS public.reimbursement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC(12,2),
  reimbursement_date TIMESTAMPTZ,
  responsible_person TEXT,
  receipt_url TEXT,
  receipt_name TEXT,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. 结题表
CREATE TABLE IF NOT EXISTS public.project_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responsible_person TEXT,
  closure_time TIMESTAMPTZ,
  research_report_url TEXT,
  research_report_name TEXT,
  acceptance_report_url TEXT,
  acceptance_report_name TEXT,
  closure_remark TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted')),
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. 修改申请表
CREATE TABLE IF NOT EXISTS public.modification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  user_name TEXT,
  project_name TEXT,
  target_module TEXT NOT NULL,
  target_record_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  review_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. 操作日志表
CREATE TABLE IF NOT EXISTS public.operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  project_id UUID,
  module TEXT,
  action TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. 消息通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('system', 'approval', 'feedback')),
  title TEXT NOT NULL,
  content TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. 反馈表
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved')),
  reply_content TEXT,
  replied_by UUID REFERENCES public.profiles(id),
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. 公告表
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. 系统配置表
CREATE TABLE IF NOT EXISTS public.system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 行级安全策略 (RLS) - 控制数据访问权限
-- =============================================

-- 开启所有表的 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- profiles: 所有登录用户可以查看所有 profile，但只能修改自己的
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- projects: 所有登录用户可以查看和创建项目
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (true);

-- project_members
CREATE POLICY "project_members_select" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "project_members_insert" ON public.project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "project_members_delete" ON public.project_members FOR DELETE USING (true);

-- 所有业务模块表：登录用户都可以增删改查（通过应用层控制权限）
CREATE POLICY "contract_reviews_all" ON public.contract_reviews FOR ALL USING (true);
CREATE POLICY "contract_confirmations_all" ON public.contract_confirmations FOR ALL USING (true);
CREATE POLICY "contract_receipts_all" ON public.contract_receipts FOR ALL USING (true);
CREATE POLICY "contract_stamps_all" ON public.contract_stamps FOR ALL USING (true);
CREATE POLICY "contract_shipments_all" ON public.contract_shipments FOR ALL USING (true);
CREATE POLICY "payments_all" ON public.payments FOR ALL USING (true);
CREATE POLICY "fund_claims_all" ON public.fund_claims FOR ALL USING (true);
CREATE POLICY "invoices_all" ON public.invoices FOR ALL USING (true);
CREATE POLICY "reimbursement_records_all" ON public.reimbursement_records FOR ALL USING (true);
CREATE POLICY "project_closures_all" ON public.project_closures FOR ALL USING (true);
CREATE POLICY "modification_requests_all" ON public.modification_requests FOR ALL USING (true);
CREATE POLICY "operation_logs_all" ON public.operation_logs FOR ALL USING (true);
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true);
CREATE POLICY "feedbacks_all" ON public.feedbacks FOR ALL USING (true);
CREATE POLICY "announcements_all" ON public.announcements FOR ALL USING (true);
CREATE POLICY "system_configs_all" ON public.system_configs FOR ALL USING (true);

-- =============================================
-- 创建索引提高查询性能
-- =============================================
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(project_code);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_reviews_project ON public.contract_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_confirmations_project ON public.contract_confirmations(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_receipts_project ON public.contract_receipts(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_stamps_project ON public.contract_stamps(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_shipments_project ON public.contract_shipments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_fund_claims_project ON public.fund_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_reimbursement_project ON public.reimbursement_records(project_id);
CREATE INDEX IF NOT EXISTS idx_closures_project ON public.project_closures(project_id);
CREATE INDEX IF NOT EXISTS idx_mod_requests_project ON public.modification_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_mod_requests_status ON public.modification_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_project ON public.operation_logs(project_id);
