-- 修复所有表的 RLS 策略

-- 1. 确保所有表都启用了 RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contract_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fund_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reimbursement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_configs ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有旧策略（避免重复）
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete" ON public.project_members;
DROP POLICY IF EXISTS "contract_reviews_all" ON public.contract_reviews;
DROP POLICY IF EXISTS "contract_confirmations_all" ON public.contract_confirmations;
DROP POLICY IF EXISTS "contract_receipts_all" ON public.contract_receipts;
DROP POLICY IF EXISTS "contract_stamps_all" ON public.contract_stamps;
DROP POLICY IF EXISTS "contract_shipments_all" ON public.contract_shipments;
DROP POLICY IF EXISTS "payments_all" ON public.payments;
DROP POLICY IF EXISTS "fund_claims_all" ON public.fund_claims;
DROP POLICY IF EXISTS "invoices_all" ON public.invoices;
DROP POLICY IF EXISTS "reimbursement_records_all" ON public.reimbursement_records;
DROP POLICY IF EXISTS "project_closures_all" ON public.project_closures;
DROP POLICY IF EXISTS "modification_requests_all" ON public.modification_requests;
DROP POLICY IF EXISTS "operation_logs_all" ON public.operation_logs;
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "feedbacks_all" ON public.feedbacks;
DROP POLICY IF EXISTS "announcements_all" ON public.announcements;
DROP POLICY IF EXISTS "system_configs_all" ON public.system_configs;

-- 3. 重新创建所有策略
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (true);

CREATE POLICY "project_members_select" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "project_members_insert" ON public.project_members FOR INSERT WITH CHECK (true);
CREATE POLICY "project_members_delete" ON public.project_members FOR DELETE USING (true);

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

-- 4. 确保 storage 的 RLS 也正确（允许匿名用户上传）
-- 为 uploads bucket 创建公开访问策略
DROP POLICY IF EXISTS "uploads_public" ON storage.objects;
CREATE POLICY "uploads_public" ON storage.objects FOR ALL USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');
