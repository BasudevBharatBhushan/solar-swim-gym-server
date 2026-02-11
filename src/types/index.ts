import { JwtPayload } from '../middlewares/auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
      locationId?: string;
    }
  }
}

// Location Types
export interface Location {
  location_id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Auth Types
export interface Staff {
  staff_id?: string;
  location_id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff' | 'manager';
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  location?: Location;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  staff: Omit<Staff, 'password_hash'>;
}

// Config Types
export interface AgeGroup {
  age_group_id?: string;
  name: string;
  min_age: number;
  max_age: number;
  accept_guardian_information?: boolean;
  is_recurring?: boolean;
  recurrence_unit?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface SubscriptionTerm {
  subscription_term_id?: string;
  location_id?: string;
  name: string;
  duration_months: number;
  payment_mode?: 'PAY_IN_FULL' | 'RECURRING';
  recurrence_unit?: string;
  recurrence_unit_value?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface WaiverProgram {
  waiver_program_id?: string;
  location_id?: string;
  name: string;
  code?: string;
  description?: string;
  requires_case_manager?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ActivationToken {
  token_id?: string;
  account_id?: string;
  staff_id?: string;
  is_staff?: boolean;
  token: string;
  expires_at: Date | string;
  is_used?: boolean;
  created_at?: Date;
}

// Service Types
export interface Service {
  service_id?: string;
  location_id?: string;
  name: string;
  description?: string;
  service_type?: string;
  is_addon_only?: boolean;
  is_active?: boolean;
  image_url?: string;
  LessonRegistrationFee?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ServicePack {
  service_pack_id?: string;
  service_id: string;
  name: string;
  description?: string;
  classes?: number;
  duration_days?: number;
  duration_months?: number;
  is_waiver_free_allowed?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Session {
    session_id?: string;
    name: string;
    start_date: Date | string;
    expiry_date: Date | string;
    created_at?: Date;
    updated_at?: Date;
}

// CRM Types
export interface Lead {
  lead_id?: string;
  location_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  status: string;
  notes?: string;
  added_by_staff_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Account {
  account_id?: string;
  location_id?: string;
  status?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Profile {
  profile_id?: string;
  account_id?: string;
  location_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  email?: string | null;
  is_primary?: boolean;
  guardian_name?: string | null;
  guardian_mobile?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  waiver_program_id?: string | null;
  case_manager_name?: string | null;
  case_manager_email?: string | null;
  mobile?: string | null;
}

// Request/Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Pricing Types
export interface BasePrice {
  base_price_id?: string;
  location_id?: string;
  name: string;
  role: 'PRIMARY' | 'ADD_ON';
  age_group_id: string;
  subscription_term_id: string;
  price: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ServicePrice {
  service_price_id?: string;
  service_pack_id: string;
  service_id?: string; // Kept for legacy compatibility if needed, but logic moves to service_pack_id
  location_id?: string;
  age_group_id: string;
  subscription_term_id?: string; // Now nullable
  price: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Membership Types
export interface MembershipProgram {
  membership_program_id?: string;
  location_id?: string;
  name: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface MembershipProgramCategory {
  category_id?: string;
  membership_program_id: string;
  name: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface MembershipFee {
  membership_fee_id?: string;
  category_id: string;
  fee_type: 'JOINING' | 'ANNUAL';
  billing_cycle: 'ONE_TIME' | 'YEARLY';
  amount: number;
  is_active?: boolean;
  created_at?: Date;
}

export interface MembershipEligibilityRule {
  rule_id?: string;
  category_id: string;
  priority: number;
  result: 'ALLOW' | 'DENY';
  condition_json: {
    minChild?: number;
    maxChild?: number;
    minInfant?: number;
    maxInfant?: number;
    minAdult?: number;
    maxAdult?: number;
    minSenior?: number;
    maxSenior?: number;
    [key: string]: unknown; // Allow extensibility
  };
  message?: string;
}

export interface MembershipService {
  membership_service_id?: string;
  membership_program_id?: string | null;
  service_id: string;
  is_included?: boolean;
  usage_limit?: string | null;
  is_part_of_base_plan?: boolean;
  is_active?: boolean;
  discount?: string | null;
  location_id?: string | null;
  baseprice_role?: string | null;
  baseprice_age_group_id?: string | null;
}

export interface DiscountCode {
  discount_id?: string;
  staff_id?: string | null;
  location_id: string;
  discount_code: string;
  discount: string;
  staff_name?: string | null;
  service_id?: string | null;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
// Config Types
export interface EmailConfig {
  config_id?: string;
  location_id: string;
  smtp_host?: string;
  smtp_port?: number;
  sender_email?: string;
  sender_name?: string;
  smtp_username?: string;
  smtp_password?: string;
  is_secure?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
export interface WaiverTemplate {
  waiver_template_id?: string;
  location_id: string;
  ageprofile_id?: string | null;
  subterm_id?: string | null;
  base_price_id?: string | null;
  membership_category_id?: string | null;
  service_id?: string | null;
  content: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface SignedWaiver {
  signed_waiver_id?: string;
  profile_id?: string | null;
  waiver_template_id: string;
  waiver_type: string;
  content: string;
  signature_url: string;
  signed_at?: Date | string;
  location_id: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface DropdownValue {
  dropdown_id?: string;
  location_id: string;
  module: string;
  label: string;
  value: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}
