-- 批量确认所有未确认的 auth 用户，解决新增成员无法登录的问题
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 查看还有多少用户未确认（执行后应返回 0）
SELECT COUNT(*) AS unconfirmed_users
FROM auth.users
WHERE email_confirmed_at IS NULL;
