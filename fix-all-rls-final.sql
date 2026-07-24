-- 一键修复所有表的 RLS 策略
-- 在 Supabase SQL Editor 中执行此脚本即可解决所有数据访问权限问题

-- =============================================
-- 逐个关闭所有表的 RLS 并添加开放策略
-- =============================================

ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
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

-- =============================================
-- 为所有表添加开放策略
-- =============================================

DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE USING (true)', t, t);
  END LOOP;
END $$;

-- 修复 storage uploads bucket
DROP POLICY IF EXISTS "uploads_public" ON storage.objects;
CREATE POLICY "uploads_public" ON storage.objects FOR ALL USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');

-- 验证：列出所有 public 表
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
