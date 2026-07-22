export interface User {
  id: string;
  username: string;
  real_name: string;
  role: 'user' | 'admin';
  phone: string;
  email: string;
  department: string;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_code: string;
  project_name: string;
  company_name: string;
  status: 'active' | 'completed';
  deadline: string | null;
  lead_user_id: string;
  lead_user_name: string;
  remark: string;
  created_by: string;
  created_by_name: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectProgress {
  overall: number;
  contract: boolean;
  stamp: boolean;
  shipment: boolean;
  payment: boolean;
  expense: boolean;
  closure: boolean;
}

export interface ContractReview {
  id: string;
  project_id: string;
  responsible_person: string;
  review_time: string;
  drafting_party: 'our_side' | 'their_side';
  contract_file_url: string;
  contract_file_name: string;
  review_remark: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContractConfirmation {
  id: string;
  project_id: string;
  responsible_person: string;
  confirmation_time: string;
  final_contract_url: string;
  final_contract_name: string;
  confirmation_desc: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContractReceipt {
  id: string;
  project_id: string;
  responsible_person: string;
  receipt_time: string;
  tracking_number: string;
  receipt_screenshot_url: string;
  receipt_screenshot_name: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContractStamp {
  id: string;
  project_id: string;
  responsible_person: string;
  stamp_time: string;
  contract_count: number;
  is_scanned: number;
  scan_file_url: string;
  scan_file_name: string;
  is_uploaded_to_system: number;
  system_upload_remark: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContractShipment {
  id: string;
  project_id: string;
  responsible_person: string;
  shipment_time: string;
  tracking_number: string;
  courier_company: string;
  customer_signed: number;
  sign_proof_url: string;
  sign_proof_name: string;
  confirmed_with_customer: number;
  chat_screenshot_url: string;
  chat_screenshot_name: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  responsible_person: string;
  amount: number;
  arrival_time: string;
  bank_proof_url: string;
  bank_proof_name: string;
  payment_remark: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface FundClaim {
  id: string;
  project_id: string;
  responsible_person: string;
  claim_time: string;
  claim_amount: number;
  claim_desc: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  invoice_type: string;
  preview_send_time: string;
  customer_confirm_time: string;
  official_issue_time: string;
  invoice_send_time: string;
  invoice_file_url: string;
  invoice_file_name: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReimbursementRecord {
  id: string;
  project_id: string;
  amount: number;
  reimbursement_date: string;
  responsible_person: string;
  receipt_url: string;
  receipt_name: string;
  remark: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectClosure {
  id: string;
  project_id: string;
  responsible_person: string;
  closure_time: string;
  research_report_url: string;
  research_report_name: string;
  acceptance_report_url: string;
  acceptance_report_name: string;
  closure_remark: string;
  status: 'draft' | 'submitted';
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ModificationRequest {
  id: string;
  project_id: string;
  project_name?: string;
  user_id: string;
  target_module: string;
  target_record_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string;
  review_comment: string;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  related_id: string;
  is_read: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  reply_content: string;
  replied_by: string;
  replied_at: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OperationLog {
  id: string;
  user_id: string;
  user_name: string;
  project_id: string;
  module: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string;
  updated_at: string;
}
