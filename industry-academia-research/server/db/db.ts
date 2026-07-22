import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, 'database.sqlite');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}

export function query<T = any>(sql: string, params?: any[]): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return params ? stmt.all(...params) as T[] : stmt.all() as T[];
}

export function run(sql: string, params?: any[]): Database.RunResult {
  const db = getDb();
  const stmt = db.prepare(sql);
  return params ? stmt.run(...params) : stmt.run();
}

export function get<T = any>(sql: string, params?: any[]): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  return params ? stmt.get(...params) as T | undefined : stmt.get() as T | undefined;
}
