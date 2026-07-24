-- 修复消息通知相关表的 RLS 策略
-- 修复 announcements 和 feedbacks 表的访问权限

-- 1. 修复 announcements 表
ALTER TABLE public.announcements DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "announcements_insert" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "announcements_update" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "announcements_delete" ON public.announcements FOR DELETE USING (true);

-- 2. 修复 feedbacks 表
ALTER TABLE public.feedbacks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedbacks_select" ON public.feedbacks;
DROP POLICY IF EXISTS "feedbacks_insert" ON public.feedbacks;
DROP POLICY IF EXISTS "feedbacks_update" ON public.feedbacks;
DROP POLICY IF EXISTS "feedbacks_delete" ON public.feedbacks;
CREATE POLICY "feedbacks_select" ON public.feedbacks FOR SELECT USING (true);
CREATE POLICY "feedbacks_insert" ON public.feedbacks FOR INSERT WITH CHECK (true);
CREATE POLICY "feedbacks_update" ON public.feedbacks FOR UPDATE USING (true);
CREATE POLICY "feedbacks_delete" ON public.feedbacks FOR DELETE USING (true);

-- 3. 同时修复 notifications 表（用户通知）
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (true);

-- 4. 修复 profiles 表（如果之前没执行过 fix-profiles-rls.sql）
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (true);

-- 5. 验证
SELECT 'announcements' AS table_name, COUNT(*) AS row_count FROM public.announcements
UNION ALL
SELECT 'feedbacks', COUNT(*) FROM public.feedbacks
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles;
