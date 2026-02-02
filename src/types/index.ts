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
  created_at?: Date;
  updated_at?: Date;
}

export interface SubscriptionTerm {
  subscription_term_id?: string;
  location_id?: string;
  name: string;
  duration_months: number;
  payment_mode?: 'SINGLE' | 'RECURRING';
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface WaiverProgram {
  waiver_program_id?: string;
  location_id?: string;
  name: string;
  description?: string;
  requires_case_manager?: boolean;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
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
