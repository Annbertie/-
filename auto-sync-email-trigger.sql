-- 创建触发器：当 profiles 表的 email 被修改时，自动同步更新 auth.users 的登录邮箱
-- 这样以后在系统界面修改邮箱后，直接退出登录用新邮箱登录即可

-- 1. 创建同步函数
CREATE OR REPLACE FUNCTION public.sync_auth_email()
RETURNS TRIGGER AS $$
BEGIN
  -- 仅当 email 字段发生变化时执行
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL AND NEW.email != '' THEN
    UPDATE auth.users
    SET email = NEW.email,
        email_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 绑定触发器到 profiles 表
DROP TRIGGER IF EXISTS trigger_sync_auth_email ON public.profiles;
CREATE TRIGGER trigger_sync_auth_email
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_email();

-- 3. 验证：查看触发器是否创建成功
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_auth_email';
