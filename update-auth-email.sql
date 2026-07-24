-- 直接修改 auth.users 表中的邮箱（绕过确认流程）
-- 用于解决个人设置中修改邮箱后仍无法用新邮箱登录的问题
-- 使用方法：将 '新邮箱@example.com' 替换为实际邮箱，将 '用户ID' 替换为实际 auth.uid

-- 1. 先查看当前 auth.users 中的所有用户及邮箱
SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC;

-- 2. 修改指定用户的邮箱（将下面两处替换为实际值后执行）
-- UPDATE auth.users
-- SET email = '新邮箱@example.com', email_confirmed_at = NOW()
-- WHERE id = '用户ID';

-- 3. 同时更新 profiles 表中的邮箱（保持同步）
-- UPDATE public.profiles
-- SET email = '新邮箱@example.com'
-- WHERE id = '用户ID';