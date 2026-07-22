import { Request, Response, NextFunction } from 'express';
import { get } from '../db/db';

export interface AuthRequest extends Request {
  userId?: string;
  userName?: string;
  userRole?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: '未提供认证token' });
      return;
    }

    const token = authHeader.substring(7);
    if (!token) {
      res.status(401).json({ success: false, error: 'token无效' });
      return;
    }

    const user = get<any>('SELECT id, username, real_name, role, status FROM users WHERE id = ?', [token]);
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, error: '账号已禁用' });
      return;
    }

    req.userId = user.id;
    req.userName = user.real_name || user.username;
    req.userRole = user.role;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: '认证失败' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    res.status(403).json({ success: false, error: '需要管理员权限' });
    return;
  }
  next();
}
