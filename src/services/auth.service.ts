import supabase from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Staff, AuthResponse, Profile } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

interface ProfileData {
  profile_id?: string;
  account_id?: string;
  location_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  is_primary?: boolean;
  guardian_name?: string;
  guardian_mobile?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface WaiverData {
  waiver_program_id?: string;
  case_manager_name?: string;
  case_manager_email?: string;
}

/**
 * Staff Login
 */
export const staffLogin = async (email: string, password: string): Promise<AuthResponse> => {
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

  const match = await bcrypt.compare(password, staffRecord.password_hash || '');
  if (!match) {
    throw new Error('Invalid credentials');
  }

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

  const { password_hash: _, ...staffWithoutPassword } = staffRecord;

  return { 
    token, 
    staff: staffWithoutPassword 
  };
};

const upsertProfileHelper = async (
  profileData: ProfileData & WaiverData
): Promise<string> => {
  const { 
    profile_id, account_id, location_id, first_name, last_name, date_of_birth, 
    email, is_primary, guardian_name, guardian_mobile, emergency_contact_name, 
    emergency_contact_phone, waiver_program_id, case_manager_name, case_manager_email
  } = profileData;
  
  const payload: any = {
    account_id, location_id, first_name, last_name, date_of_birth, email,
    is_primary: is_primary || false,
    guardian_name, guardian_mobile, emergency_contact_name, emergency_contact_phone,
    waiver_program_id: waiver_program_id || null, 
    case_manager_name: case_manager_name || null, 
    case_manager_email: case_manager_email || null
  };

  if (profile_id) {
    payload.profile_id = profile_id;
  }

  const { data, error } = await supabase
    .from('profile')
    .upsert(payload, { onConflict: 'profile_id' })
    .select('profile_id')
    .single();

  if (error) throw new Error(error.message);
  return data.profile_id;
};

/**
 * User/Account Registration
 * Creates account, primary profile, and family members
 */
export const registerUser = async (data: {
  location_id: string;
  primary_profile: ProfileData & WaiverData;
  family_members?: (ProfileData & WaiverData)[];
}): Promise<{ account_id: string; profile_id: string; activation_token: string }> => {
  const { location_id, primary_profile, family_members } = data;

  // Check if email already exists
  const { data: existingProfile } = await supabase
    .from('profile')
    .select('profile_id')
    .eq('email', primary_profile.email)
    .single();

  if (existingProfile) {
    throw new Error('Email already registered');
  }

  // 1. Create account
  const { data: account, error: accountError } = await supabase
    .from('account')
    .insert({
      location_id,
      status: 'PENDING'
    })
    .select()
    .single();

  if (accountError || !account) {
    throw new Error('Failed to create account: ' + accountError?.message);
  }

  // 2. Create primary profile (without password initially)
  const profileId = await upsertProfileHelper(
    { ...primary_profile, account_id: account.account_id, location_id, is_primary: true }
  );

  // 3. Create family members
  if (family_members && Array.isArray(family_members)) {
    for (const member of family_members) {
      await upsertProfileHelper(
        { ...member, account_id: account.account_id, location_id, is_primary: false }
      );
    }
  }

  // 4. Create activation token
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

  console.log(`✉️ Activation email would be sent to: ${primary_profile.email}`);
  return {
    account_id: account.account_id,
    profile_id: profileId,
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
  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .select('*, account!inner(account_id, location_id)')
    .eq('token', token)
    .eq('is_used', false)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired activation token');
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt) {
    throw new Error('Activation token has expired');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error: updateError } = await supabase
    .from('profile')
    .update({ password: passwordHash })
    .eq('account_id', tokenData.account_id)
    .eq('is_primary', true);

  if (updateError) {
    throw new Error('Failed to set password: ' + updateError.message);
  }

  const { error: accountUpdateError } = await supabase
    .from('account')
    .update({ status: 'ACTIVE' })
    .eq('account_id', tokenData.account_id);

  if (accountUpdateError) {
    throw new Error('Failed to activate account: ' + accountUpdateError.message);
  }

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
 * Validate activation token
 */
export const validateActivationToken = async (
  token: string
): Promise<{ success: boolean; message: string; account?: { account_id: string; email: string } }> => {
  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .select('*, account!inner(account_id, location_id)')
    .eq('token', token)
    .eq('is_used', false)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired activation token');
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt) {
    throw new Error('Activation token has expired');
  }

  // Get primary email for this account
  const { data: profile } = await supabase
    .from('profile')
    .select('email')
    .eq('account_id', tokenData.account_id)
    .eq('is_primary', true)
    .single();

  return {
    success: true,
    message: 'Token is valid',
    account: {
      account_id: tokenData.account_id,
      email: profile?.email || ''
    }
  };
};

/**
 * User/Account Login
 */
export const accountLogin = async (email: string, password: string): Promise<AuthResponse> => {
  const { data: profile, error } = await supabase
    .from('profile')
    .select('*, account!inner(account_id, location_id, status)')
    .eq('email', email)
    .eq('is_primary', true)
    .single();

  if (error || !profile) {
    throw new Error('Invalid credentials');
  }

  if ((profile.account as { status: string }).status !== 'ACTIVE') {
    throw new Error('Account not activated. Please check your email for activation link.');
  }

  if (!profile.is_active) {
    throw new Error('Profile is inactive');
  }

  if (!profile.password) {
    throw new Error('Password not set. Please activate your account.');
  }

  const match = await bcrypt.compare(password, profile.password);
  if (!match) {
    throw new Error('Invalid credentials');
  }

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

  const { password: _, ...profileWithoutPassword } = profile;

  return { 
    token, 
    staff: profileWithoutPassword as unknown as Staff
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

/**
 * Get all staff members (SuperAdmin only)
 */
export const getAllStaff = async (): Promise<Staff[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('staff_id, location_id, first_name, last_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch staff: ' + error.message);
  }

  return data as Staff[];
};

export default {
  staffLogin,
  accountLogin,
  registerUser,
  activateAccount,
  validateActivationToken,
  getActivationToken,
  createStaff,
  getAllStaff
};
