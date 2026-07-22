import { run } from '../db/db';
import { v4 as uuidv4 } from 'uuid';

interface LogOperationParams {
  userId?: string;
  userName?: string;
  projectId?: string;
  module?: string;
  action: string;
  detail?: string;
}

export function logOperation({ userId, userName, projectId, module, action, detail }: LogOperationParams) {
  try {
    const now = new Date().toISOString();
    const id = uuidv4();
    run(
      'INSERT INTO operation_logs (id, user_id, user_name, project_id, module, action, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId || null, userName || null, projectId || null, module || null, action, detail || null, now]
    );
  } catch (err) {
    console.error('Log operation failed:', err);
  }
}
