import supabase from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Staff, AuthResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

/**
 * Staff Login
 */
export const staffLogin = async (email: string, password: string): Promise<AuthResponse> => {
  // Set location context will be handled by middleware after login
  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !staff) {
    throw new Error('Invalid credentials');
  }
  
  const staffRecord = staff as Staff;
  
  if (!staffRecord.is_active) {
    throw new Error('Account suspended');
  }

  // Verify password
  const match = await bcrypt.compare(password, staffRecord.password_hash || '');
  if (!match) {
    throw new Error('Invalid credentials');
  }

  // Create JWT token with location_id
  const token = jwt.sign(
    { 
      staff_id: staffRecord.staff_id, 
      role: staffRecord.role, 
      location_id: staffRecord.location_id,
      type: 'staff'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Remove password hash from response
  const { password_hash: _, ...staffWithoutPassword } = staffRecord;

  return { 
    token, 
    staff: staffWithoutPassword 
  };
};

/**
 * User/Account Registration
 * Creates account, primary profile, and sends activation email
 */
export const registerUser = async (userData: {
  location_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  guardian_name?: string;
  guardian_mobile?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  waiver_program_id?: string;
  case_manager_name?: string;
  case_manager_email?: string;
}): Promise<{ account_id: string; profile_id: string; activation_token: string }> => {
  
  // Check if email already exists
  const { data: existingProfile } = await supabase
    .from('profile')
    .select('profile_id')
    .eq('email', userData.email)
    .single();

  if (existingProfile) {
    throw new Error('Email already registered');
  }

  // Create account
  const { data: account, error: accountError } = await supabase
    .from('account')
    .insert({
      location_id: userData.location_id,
      status: 'PENDING'
    })
    .select()
    .single();

  if (accountError || !account) {
    throw new Error('Failed to create account: ' + accountError?.message);
  }

  // Create primary profile (without password initially)
  const { data: profile, error: profileError } = await supabase
    .from('profile')
    .insert({
      account_id: account.account_id,
      location_id: userData.location_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      date_of_birth: userData.date_of_birth,
      is_primary: true,
      is_active: true,
      guardian_name: userData.guardian_name,
      guardian_mobile: userData.guardian_mobile,
      emergency_contact_name: userData.emergency_contact_name,
      emergency_contact_phone: userData.emergency_contact_phone,
      waiver_program_id: userData.waiver_program_id,
      case_manager_name: userData.case_manager_name,
      case_manager_email: userData.case_manager_email
    })
    .select()
    .single();

  if (profileError || !profile) {
    throw new Error('Failed to create profile: ' + profileError?.message);
  }

  // Create activation token (expires in 24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .insert({
      account_id: account.account_id,
      expires_at: expiresAt.toISOString(),
      is_used: false
    })
    .select()
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Failed to create activation token: ' + tokenError?.message);
  }

  // TODO: Send activation email with token
  // For now, return the token for testing
  console.log(`✉️ Activation email would be sent to: ${userData.email}`);
  console.log(`🔑 Activation token: ${tokenData.token}`);

  return {
    account_id: account.account_id,
    profile_id: profile.profile_id,
    activation_token: tokenData.token
  };
};

/**
 * Activate account and set password
 */
export const activateAccount = async (
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  
  // Find the token
  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .select('*, account!inner(account_id, location_id)')
    .eq('token', token)
    .eq('is_used', false)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired activation token');
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt) {
    throw new Error('Activation token has expired');
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Update the primary profile with password
  const { error: updateError } = await supabase
    .from('profile')
    .update({ password: passwordHash })
    .eq('account_id', tokenData.account_id)
    .eq('is_primary', true);

  if (updateError) {
    throw new Error('Failed to set password: ' + updateError.message);
  }

  // Update account status to ACTIVE
  const { error: accountUpdateError } = await supabase
    .from('account')
    .update({ status: 'ACTIVE' })
    .eq('account_id', tokenData.account_id);

  if (accountUpdateError) {
    throw new Error('Failed to activate account: ' + accountUpdateError.message);
  }

  // Mark token as used
  await supabase
    .from('account_activation_tokens')
    .update({ is_used: true })
    .eq('token_id', tokenData.token_id);

  return {
    success: true,
    message: 'Account activated successfully'
  };
};

/**
 * User/Account Login
 */
export const accountLogin = async (email: string, password: string): Promise<AuthResponse> => {
  
  // Find the primary profile
  const { data: profile, error } = await supabase
    .from('profile')
    .select('*, account!inner(account_id, location_id, status)')
    .eq('email', email)
    .eq('is_primary', true)
    .single();

  if (error || !profile) {
    throw new Error('Invalid credentials');
  }

  // Check if account is active
  if ((profile.account as { status: string }).status !== 'ACTIVE') {
    throw new Error('Account not activated. Please check your email for activation link.');
  }

  if (!profile.is_active) {
    throw new Error('Profile is inactive');
  }

  // Verify password
  if (!profile.password) {
    throw new Error('Password not set. Please activate your account.');
  }

  const match = await bcrypt.compare(password, profile.password);
  if (!match) {
    throw new Error('Invalid credentials');
  }

  // Create JWT token with location_id
  const token = jwt.sign(
    { 
      profile_id: profile.profile_id,
      account_id: profile.account_id,
      location_id: (profile.account as { location_id: string }).location_id,
      type: 'user'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Remove password from response
  const { password: _, ...profileWithoutPassword } = profile;

  return { 
    token, 
    staff: profileWithoutPassword as unknown as Staff // Using staff field for compatibility
  };
};

/**
 * Get activation token (for testing purposes)
 */
export const getActivationToken = async (email: string): Promise<{ token: string }> => {
  const { data: profile } = await supabase
    .from('profile')
    .select('account_id')
    .eq('email', email)
    .eq('is_primary', true)
    .single();

  if (!profile) {
    throw new Error('Profile not found');
  }

  const { data: tokenData } = await supabase
    .from('account_activation_tokens')
    .select('token')
    .eq('account_id', profile.account_id)
    .eq('is_used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!tokenData) {
    throw new Error('No active token found');
  }

  return { token: tokenData.token };
};

/**
 * Create Staff (SuperAdmin/Admin only)
 */
export const createStaff = async (staffData: {
  location_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'STAFF';
}): Promise<Staff> => {
  // Hash password
  const passwordHash = await bcrypt.hash(staffData.password, 10);

  const { data, error } = await supabase
    .from('staff')
    .insert({
      location_id: staffData.location_id,
      first_name: staffData.first_name,
      last_name: staffData.last_name,
      email: staffData.email,
      password_hash: passwordHash,
      role: staffData.role,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create staff: ' + error.message);
  }

  const { password_hash: _, ...staffWithoutPassword } = data;
  return staffWithoutPassword as Staff;
};

export default {
  staffLogin,
  accountLogin,
  registerUser,
  activateAccount,
  getActivationToken,
  createStaff
};

