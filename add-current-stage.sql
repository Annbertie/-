-- 修复：给 projects 表添加 current_stage 字段
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS current_stage TEXT;

-- 更新所有已有项目的 current_stage（根据进度计算）
UPDATE public.projects SET current_stage = CASE
  WHEN status = 'completed' THEN '结题'
  WHEN NOT EXISTS (SELECT 1 FROM public.contract_reviews WHERE project_id = public.projects.id AND status = 'submitted') THEN '合同管理'
  WHEN NOT EXISTS (SELECT 1 FROM public.contract_stamps WHERE project_id = public.projects.id AND status = 'submitted') THEN '合同盖章'
  WHEN NOT EXISTS (SELECT 1 FROM public.contract_shipments WHERE project_id = public.projects.id AND status = 'submitted') THEN '合同寄出'
  WHEN NOT EXISTS (SELECT 1 FROM public.payments WHERE project_id = public.projects.id AND status = 'submitted') THEN '打款开票'
  WHEN NOT EXISTS (SELECT 1 FROM public.reimbursement_records WHERE project_id = public.projects.id AND status = 'submitted') THEN '经费报销'
  ELSE '结题'
END;
