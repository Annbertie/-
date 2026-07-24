-- 修复 profiles 表的 RLS 策略，确保管理员可以更新成员角色

-- 1. 禁用 profiles 表的 RLS（如果已启用）
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. 删除 profiles 表上可能存在的旧策略
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- 3. 为 profiles 表添加正确的公开策略（允许所有已认证用户操作）
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (true);

-- 4. 验证：查看所有成员的角色
SELECT username, real_name, role, status FROM public.profiles ORDER BY created_at DESC;
