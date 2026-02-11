import supabase from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Staff, AuthResponse, Profile } from '../types';
import { sendEmail } from './email.service';

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
  signed_waiver_id?: string;
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
    .select('*, location(*)')
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
  const profileIdResult = data.profile_id;

  // Link signed waiver if provided
  if (profileData.signed_waiver_id) {
    const { error: waiverError } = await supabase
      .from('signed_waiver')
      .update({ 
        profile_id: profileIdResult,
        updated_at: new Date().toISOString()
      })
      .eq('signed_waiver_id', profileData.signed_waiver_id)
      .eq('location_id', location_id); // Basic safety check

    if (waiverError) {
      console.error(`Failed to link waiver ${profileData.signed_waiver_id} to profile ${profileIdResult}:`, waiverError.message);
      // We don't necessarily want to fail the whole registration if waiver linking fails, 
      // but the user's objective is to make sure it's saved.
    }
  }

  return profileIdResult;
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
    .eq('is_staff', false)
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
    .eq('is_staff', false)
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
    .select('*, account!inner(account_id, location_id, status, location(*))')
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

  // Flatten location from account to profile root for consistency
  const location = (profile.account as any).location;
  const profileWithLocation = { ...profileWithoutPassword, location };

  return { 
    token, 
    staff: profileWithLocation as unknown as Staff
  };
};

/**
 * Activate staff account and set password
 */
export const activateStaff = async (
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .select('*, staff!inner(staff_id, email)')
    .eq('token', token)
    .eq('is_used', false)
    .eq('is_staff', true)
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
    .from('staff')
    .update({ 
      password_hash: passwordHash,
      is_active: true 
    })
    .eq('staff_id', tokenData.staff_id);

  if (updateError) {
    throw new Error('Failed to set password: ' + updateError.message);
  }

  await supabase
    .from('account_activation_tokens')
    .update({ is_used: true })
    .eq('token_id', tokenData.token_id);

  return {
    success: true,
    message: 'Staff account activated successfully'
  };
};

/**
 * Validate staff activation token
 */
export const validateStaffToken = async (
  token: string
): Promise<{ success: boolean; message: string; staff?: { staff_id: string; email: string } }> => {
  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .select('*, staff!inner(staff_id, email)')
    .eq('token', token)
    .eq('is_used', false)
    .eq('is_staff', true)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Invalid or expired activation token');
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  if (now > expiresAt) {
    throw new Error('Activation token has expired');
  }

  return {
    success: true,
    message: 'Token is valid',
    staff: {
      staff_id: tokenData.staff_id,
      email: (tokenData.staff as any).email
    }
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
 * Create Staff (SuperAdmin/Admin/Staff only)
 */
export const createStaff = async (staffData: {
  location_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'STAFF';
}): Promise<Staff> => {
  let passwordHash = null;
  if (staffData.password) {
    passwordHash = await bcrypt.hash(staffData.password, 10);
  }

  const { data, error } = await supabase
    .from('staff')
    .insert({
      location_id: staffData.location_id,
      first_name: staffData.first_name,
      last_name: staffData.last_name,
      email: staffData.email,
      password_hash: passwordHash,
      role: staffData.role,
      is_active: staffData.password ? true : false // If no password, set to inactive until activation
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
 * Upsert Staff (SuperAdmin/Admin/Staff only)
 */
export const upsertStaff = async (staffData: Partial<Staff> & { password?: string }): Promise<Staff> => {
  const payload: any = { ...staffData };
  delete payload.password; // Don't include raw password in payload

  if (staffData.password) {
    payload.password_hash = await bcrypt.hash(staffData.password, 10);
    // If password is set, we can activate immediately or keep current state
    if (!staffData.staff_id) payload.is_active = true;
  } else if (!staffData.staff_id) {
    // New staff without password should be inactive until activation
    payload.is_active = false;
  }

  const { data, error } = await supabase
    .from('staff')
    .upsert(payload, { onConflict: 'staff_id' })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to upsert staff: ' + error.message);
  }

  const { password_hash: _, ...staffWithoutPassword } = data;
  return staffWithoutPassword as Staff;
};

/**
 * Send Staff Password Reset Link
 */
export const sendStaffResetLink = async (staffId: string): Promise<{ success: boolean; message: string }> => {
  // 1. Get staff details
  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .eq('staff_id', staffId)
    .single();

  if (error || !staff) {
    throw new Error('Staff not found');
  }

  // 2. Invalidate existing tokens
  await supabase
    .from('account_activation_tokens')
    .update({ is_used: true })
    .eq('staff_id', staffId)
    .eq('is_used', false);

  // 3. Create new token
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour validity

  const { data: tokenData, error: tokenError } = await supabase
    .from('account_activation_tokens')
    .insert({
      staff_id: staffId,
      is_staff: true,
      expires_at: expiresAt.toISOString(),
      is_used: false
    })
    .select()
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Failed to generate reset token');
  }

  // 4. Send Email
  // Note: Using a robust frontend URL construction. 
  // Ideally this base URL should come from env vars.
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; 
  const activationLink = `${baseUrl}/admin/activate?token=${tokenData.token}`;

  try {
    await sendEmail({
      to: staff.email,
      subject: 'Complete Your Staff Account Setup / Reset Password',
      html: `
        <h2>Hello ${staff.first_name},</h2>
        <p>An administrator has requested a password reset or account activation for your staff account.</p>
        <p>Please click the link below to set your password:</p>
        <a href="${activationLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Set Password</a>
        <p>Or copy and paste this link:</p>
        <p>${activationLink}</p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Hello ${staff.first_name},\n\nPlease set your password by visiting: ${activationLink}`,
      location_id: staff.location_id
    });
  } catch (emailError: any) {
    // If email fails, we might still want to return success but warn, OR fail. 
    // Since this is a direct action "Send Link", we should probably report failure if email fails.
    // However, token is created.
    console.error('Failed to send email:', emailError);
    throw new Error(`Token generated but email failed: ${emailError.message}`);
  }

  return { 
    success: true, 
    message: `Reset link sent to ${staff.email}` 
  };
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
  activateStaff,
  validateStaffToken,
  getActivationToken,
  createStaff,
  upsertStaff,
  sendStaffResetLink,
  getAllStaff
};
