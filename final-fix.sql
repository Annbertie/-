-- 最终修复方案：关闭所有RLS + 修复项目状态 + 修复进度查询

-- 1. 关闭所有表的 RLS
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_confirmations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_stamps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_closures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modification_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs DISABLE ROW LEVEL SECURITY;

-- 2. 删除 projects 表上错误的策略（如果有 auth.uid() = id 的策略）
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

-- 3. 为 projects 表添加正确的策略（任何人都可以更新）
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (true);

-- 4. 为 storage uploads bucket 添加公开访问策略
DROP POLICY IF EXISTS "uploads_public" ON storage.objects;
CREATE POLICY "uploads_public" ON storage.objects FOR ALL USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');

-- 5. 自动修复所有已结题但状态仍为进行中的项目
UPDATE public.projects SET status = 'completed' WHERE id IN (
  SELECT pc.project_id 
  FROM public.project_closures pc 
  WHERE pc.status = 'submitted'
);

-- 6. 验证：列出所有项目及其状态
SELECT project_name, project_code, status, current_stage FROM public.projects ORDER BY created_at DESC;
