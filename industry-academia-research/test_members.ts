import { get, query } from './server/db/db';

try {
  const countResult = get<any>("SELECT COUNT(*) as total FROM users WHERE 1=1", []);
  console.log('count:', countResult);

  const list = query<any>("SELECT id, username, real_name FROM users WHERE 1=1 ORDER BY created_at DESC LIMIT 10 OFFSET 0", []);
  console.log('list:', list);
} catch (e: any) {
  console.error('ERROR:', e.message);
}
