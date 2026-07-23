import { supabase } from './supabaseClient';

// 模拟 axios response 结构
function wrap(data: unknown, error?: string) {
  if (error) {
    const err = new Error(error) as any;
    err.response = { data: { success: false, error } };
    return Promise.reject(err);
  }
  return Promise.resolve({ data: { success: true, data } });
}

function wrapList(list: unknown[], total?: number) {
  return Promise.resolve({
    data: { success: true, data: { list, total: total ?? (list as any[]).length } },
  });
}

// 获取当前用户
async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

// 获取当前用户信息
async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();
  return profile;
}

// 模块表名映射
const moduleTableMap: Record<string, string> = {
  'contract-reviews': 'contract_reviews',
  'contract-confirmations': 'contract_confirmations',
  'contract-receipts': 'contract_receipts',
  'contract-stamps': 'contract_stamps',
  'contract-shipments': 'contract_shipments',
  'payments': 'payments',
  'fund-claims': 'fund_claims',
  'invoices': 'invoices',
  'reimbursement-records': 'reimbursement_records',
  'project-closures': 'project_closures',
};

// 判断是否是模块表路径
function resolveTable(path: string): string | null {
  for (const [prefix, table] of Object.entries(moduleTableMap)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return table;
    }
  }
  return null;
}

async function logOperation(userId: string, userName: string, module: string, action: string, detail: string, projectId?: string) {
  await supabase.from('operation_logs').insert({
    user_id: userId,
    user_name: userName,
    module,
    action,
    detail,
    project_id: projectId,
  });
}

// 计算项目进度
async function calcProjectProgress(projectId: string) {
  const stages = [
    { key: 'contract', tables: ['contract_reviews', 'contract_confirmations', 'contract_receipts'] },
    { key: 'stamp', tables: ['contract_stamps'] },
    { key: 'shipment', tables: ['contract_shipments'] },
    { key: 'payment', tables: ['payments', 'fund_claims', 'invoices'] },
    { key: 'expense', tables: ['reimbursement_records'] },
    { key: 'closure', tables: ['project_closures'] },
  ];

  const result: Record<string, boolean> = {};
  let completedCount = 0;

  for (const stage of stages) {
    const allDone = (await Promise.all(
      stage.tables.map(async (table) => {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('status', 'submitted');
        return (count || 0) > 0;
      })
    )).every(Boolean);
    result[stage.key] = allDone;
    if (allDone) completedCount++;
  }

  const overall = Math.round((completedCount / stages.length) * 100);
  return { overall, ...result };
}

// ===================== 核心 API 兼容层 =====================

const supabaseApi = {
  async get(url: string, config?: any) {
    const params = config?.params || {};
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id;

    // ---- 认证相关 ----
    if (url === '/auth/me') {
      if (!currentUser) return wrap(null, '未登录');
      return wrap(currentUser);
    }

    // ---- 项目列表 ----
    if (url === '/projects') {
      let query = supabase.from('projects').select('*', { count: 'exact' });
      if (params.status) query = query.eq('status', params.status);
      if (params.keyword) {
        query = query.or(`project_name.ilike.%${params.keyword}%,project_code.ilike.%${params.keyword}%,company_name.ilike.%${params.keyword}%`);
      }
      if (params.current_stage) query = query.eq('current_stage', params.current_stage);
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      query = query.range((page - 1) * pageSize, page * pageSize - 1).order('created_at', { ascending: false });
      const { data, count, error } = await query;
      if (error) return wrap(null, error.message);
      return wrapList(data || [], count || 0);
    }

    // ---- 单个项目 ----
    const projectMatch = url.match(/^\/projects\/([^/]+)$/);
    if (projectMatch) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectMatch[1])
        .single();
      if (error) return wrap(null, error.message);
      return wrap(data);
    }

    // ---- 项目进度 ----
    const progressMatch = url.match(/^\/projects\/([^/]+)\/progress$/);
    if (progressMatch) {
      const progress = await calcProjectProgress(progressMatch[1]);
      return wrap(progress);
    }

    // ---- 成员管理 ----
    if (url === '/admin/members') {
      let query = supabase.from('profiles').select('*');
      if (params.keyword) {
        query = query.or(`username.ilike.%${params.keyword}%,real_name.ilike.%${params.keyword}%`);
      }
      const { data, error } = await query;
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    // ---- 审批列表 ----
    if (url === '/modification-requests') {
      let query = supabase.from('modification_requests').select('*').order('created_at', { ascending: false });
      if (params.status) query = query.eq('status', params.status);
      const { data, error } = await query;
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    // ---- 通知列表 ----
    if (url === '/notifications') {
      if (!userId) return wrap(null, '未登录');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    // ---- 公告 ----
    if (url === '/announcements') {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    // ---- 系统配置 ----
    if (url === '/admin/configs') {
      const { data, error } = await supabase.from('system_configs').select('*');
      if (error) return wrap(null, error.message);
      return wrap(data || []);
    }

    // ---- 操作日志 ----
    if (url === '/admin/logs') {
      const { data, error } = await supabase
        .from('operation_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    // ---- 反馈 ----
    if (url === '/admin/feedbacks') {
      const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    // ---- 报销进度 ----
    const reimburseProgressMatch = url.match(/^\/reimbursement-records\/progress\/(.+)$/);
    if (reimburseProgressMatch) {
      const pid = reimburseProgressMatch[1];
      const [{ data: payments }, { data: reimbursements }] = await Promise.all([
        supabase.from('payments').select('amount').eq('project_id', pid).eq('status', 'submitted'),
        supabase.from('reimbursement_records').select('amount').eq('project_id', pid).eq('status', 'submitted'),
      ]);
      const totalArrival = (payments || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const reimbursed = (reimbursements || []).reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      return wrap({ total_arrival: totalArrival, reimbursed, remaining: totalArrival - reimbursed });
    }

    // ---- 导出 ----
    if (url === '/admin/export/projects') {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) return wrap(null, error.message);
      return wrap(data || []);
    }

    // ---- 模块表查询 ----
    const table = resolveTable(url.replace(/^\//, ''));
    if (table) {
      let query = supabase.from(table).select('*').order('created_at', { ascending: false });
      if (params.project_id) query = query.eq('project_id', params.project_id);
      const { data, error } = await query;
      if (error) return wrap(null, error.message);
      return wrapList(data || []);
    }

    return wrap(null, `未实现的 GET 路由: ${url}`);
  },

  async post(url: string, data?: any, config?: any) {
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id;
    const userName = currentUser?.real_name || currentUser?.username || 'unknown';

    // ---- 登录 ----
    if (url === '/auth/login') {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data?.username || data?.email,
        password: data?.password,
      });
      if (error) return wrap(null, error.message);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user!.id)
        .single();
      return wrap({ token: authData.session?.access_token, user: profile });
    }

    // ---- 创建成员 ----
    if (url === '/admin/members') {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data?.email || `${data?.username}@local.dev`,
        password: data?.password,
        options: { data: { username: data?.username, real_name: data?.real_name, role: data?.role || 'user' } },
      });
      if (authError) return wrap(null, authError.message);
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: data?.username,
          real_name: data?.real_name,
          phone: data?.phone,
          email: data?.email,
          department: data?.department,
          role: data?.role || 'user',
          status: 'active',
        });
      }
      return wrap(null);
    }

    // ---- 发布公告 ----
    if (url === '/admin/announcements') {
      const { error } = await supabase.from('announcements').insert({ ...data, created_by: userId });
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 创建项目 ----
    if (url === '/projects') {
      const insertData: Record<string, unknown> = {
        project_code: data.project_code,
        project_name: data.project_name,
        company_name: data.company_name,
        status: 'active',
        remark: data.remark || '',
        lead_user_name: data.lead_user_name || '',
      };
      if (data.deadline) insertData.deadline = data.deadline.replace(' ', 'T') + ':00';
      if (userId) insertData.created_by = userId;
      const { data: inserted, error } = await supabase.from('projects').insert(insertData).select().single();
      if (error) return wrap(null, error.message);
      await logOperation(userId!, userName, 'projects', 'create', `创建项目 ${data.project_name}`, inserted?.id);
      return wrap(inserted);
    }

    // ---- 创建修改申请 ----
    if (url === '/modification-requests') {
      const { error } = await supabase.from('modification_requests').insert({ ...data, user_id: userId });
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 同意审批 ----
    const approveMatch = url.match(/^\/modification-requests\/([^/]+)\/approve$/);
    if (approveMatch) {
      const reqId = approveMatch[1];
      const { data: req } = await supabase.from('modification_requests').select('*').eq('id', reqId).single();
      if (!req) return wrap(null, '申请不存在');
      await supabase.from('modification_requests').update({
        status: 'approved', reviewed_by: userId, reviewed_at: new Date().toISOString(),
      }).eq('id', reqId);
      // 解锁原始记录
      const tableName = moduleTableMap[req.target_module.replace(/_/g, '-')] || req.target_module;
      await supabase.from(tableName).update({ status: 'draft' }).eq('id', req.target_record_id);
      return wrap(null);
    }

    // ---- 驳回审批 ----
    const rejectMatch = url.match(/^\/modification-requests\/([^/]+)\/reject$/);
    if (rejectMatch) {
      await supabase.from('modification_requests').update({
        status: 'rejected', reviewed_by: userId, review_comment: data?.review_comment, reviewed_at: new Date().toISOString(),
      }).eq('id', rejectMatch[1]);
      return wrap(null);
    }

    // ---- 提交反馈 ----
    if (url === '/feedbacks') {
      const { error } = await supabase.from('feedbacks').insert({ ...data, user_id: userId });
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 重置密码（发送重置邮件）----
    const resetMatch = url.match(/^\/admin\/members\/([^/]+)\/reset-password$/);
    if (resetMatch) {
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', resetMatch[1]).single();
      if (!profile?.email) return wrap(null, '用户邮箱不存在');
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 模块表提交 ----
    const submitMatch = url.match(/^\/(.+)\/([^/]+)\/submit$/);
    if (submitMatch) {
      const tablePrefix = submitMatch[1];
      const recordId = submitMatch[2];
      const tableName = moduleTableMap[tablePrefix] || tablePrefix;
      const { data: record } = await supabase.from(tableName).select('project_id').eq('id', recordId).single();

      await supabase.from(tableName).update({
        status: 'submitted', submitted_by: userId, submitted_at: new Date().toISOString(),
      }).eq('id', recordId);

      await logOperation(userId!, userName, tablePrefix, 'submit', `提交 ${tablePrefix}`, record?.project_id);

      // 如果是结题，更新项目状态
      if (tablePrefix === 'project-closures' && record?.project_id) {
        const progress = await calcProjectProgress(record.project_id);
        await supabase.from('projects').update({
          status: progress.overall === 100 ? 'completed' : 'active', updated_at: new Date().toISOString(),
        }).eq('id', record.project_id);
      }

      return wrap(null);
    }

    // ---- 模块表创建 ----
    const table = resolveTable(url.replace(/^\//, ''));
    if (table) {
      const { data: inserted, error } = await supabase.from(table).insert({ ...data }).select().single();
      if (error) return wrap(null, error.message);
      return wrap(inserted);
    }

    // ---- 文件上传 ----
    if (url === '/upload') {
      const file = data instanceof FormData ? data.get('file') as File : null;
      if (!file) return wrap(null, '没有文件');
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error } = await supabase.storage.from('uploads').upload(fileName, file, {
        cacheControl: '3600', upsert: false,
      });
      if (error) return wrap(null, error.message);
      const { data: publicUrl } = supabase.storage.from('uploads').getPublicUrl(uploadData!.path);
      return wrap({ url: publicUrl.publicUrl });
    }

    return wrap(null, `未实现的 POST 路由: ${url}`);
  },

  async put(url: string, data?: any) {
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id;

    // ---- 更新 profile ----
    if (url === '/auth/profile') {
      const { error } = await supabase.from('profiles').update(data).eq('id', userId);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 修改密码 ----
    if (url === '/auth/password') {
      const { error } = await supabase.auth.updateUser({ password: data?.new_password });
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 更新项目 ----
    const projectMatch = url.match(/^\/projects\/([^/]+)$/);
    if (projectMatch) {
      const { error } = await supabase.from('projects').update(data).eq('id', projectMatch[1]);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 更新成员 ----
    const memberMatch = url.match(/^\/admin\/members\/([^/]+)$/);
    if (memberMatch) {
      const { error } = await supabase.from('profiles').update(data).eq('id', memberMatch[1]);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 更新系统配置 ----
    const configMatch = url.match(/^\/admin\/configs\/(.+)$/);
    if (configMatch) {
      const { error } = await supabase.from('system_configs').update({
        config_value: data?.value, updated_at: new Date().toISOString(),
      }).eq('config_key', configMatch[1]);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 回复反馈 ----
    const feedbackMatch = url.match(/^\/admin\/feedbacks\/([^/]+)\/reply$/);
    if (feedbackMatch) {
      const { error } = await supabase.from('feedbacks').update({
        reply_content: data?.reply, replied_by: userId, replied_at: new Date().toISOString(),
        status: data?.status || 'resolved',
      }).eq('id', feedbackMatch[1]);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 模块表更新 ----
    const moduleMatch = url.match(/^\/(.+)\/([^/]+)$/);
    if (moduleMatch) {
      const tablePrefix = moduleMatch[1];
      const recordId = moduleMatch[2];
      const tableName = moduleTableMap[tablePrefix] || tablePrefix;
      const { error } = await supabase.from(tableName).update(data).eq('id', recordId);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    return wrap(null, `未实现的 PUT 路由: ${url}`);
  },

  async delete(url: string) {
    // ---- 删除成员（禁用用户）----
    const memberMatch = url.match(/^\/admin\/members\/([^/]+)$/);
    if (memberMatch) {
      const { error } = await supabase.from('profiles').update({ status: 'disabled' }).eq('id', memberMatch[1]);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    // ---- 模块表删除 ----
    const moduleMatch = url.match(/^\/(.+)\/([^/]+)$/);
    if (moduleMatch) {
      const tablePrefix = moduleMatch[1];
      const recordId = moduleMatch[2];
      const tableName = moduleTableMap[tablePrefix] || tablePrefix;
      const { error } = await supabase.from(tableName).delete().eq('id', recordId);
      if (error) return wrap(null, error.message);
      return wrap(null);
    }

    return wrap(null, `未实现的 DELETE 路由: ${url}`);
  },
};

export default supabaseApi;
