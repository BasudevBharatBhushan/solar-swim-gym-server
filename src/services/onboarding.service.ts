import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import bcrypt from 'bcrypt';
import { sendActivationEmail } from '../utils/email.service';
import { indexAccount, indexProfile } from '../config/elasticsearch';
import crypto from 'crypto';

interface OnboardingPayload {
  primary_profile: any;
  family_members: any[];
}

export const completeOnboarding = async (payload: OnboardingPayload) => {
  // 1. Hash the parent password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.primary_profile.password, salt);

  // 2. Create Account
  const { data: account, error: accError } = await supabase
    .from('accounts')
    .insert({
      email: payload.primary_profile.email,
      password_hash: hashedPassword,
      status: 'active'
    })
    .select()
    .single();

  if (accError) throw new AppError(`Failed to create account: ${accError.message}`, 500);

  // 3. Create Primary Profile (Parent)
  const { data: parentProfile, error: ppError } = await supabase
    .from('profiles')
    .insert({
      account_id: account.account_id,
      first_name: payload.primary_profile.first_name,
      last_name: payload.primary_profile.last_name,
      email: payload.primary_profile.email,
      date_of_birth: payload.primary_profile.date_of_birth,
      // mobile: payload.primary_profile.mobile, // Ensure mobile is in schema if needed
      role: 'PARENT',
      rceb_flag: payload.primary_profile.rceb_flag || false,
      case_manager_name: payload.primary_profile.case_manager?.name,
      case_manager_email: payload.primary_profile.case_manager?.email,
      is_active: true
    })
    .select()
    .single();

  if (ppError) throw new AppError(`Failed to create parent profile: ${ppError.message}`, 500);

  let familyProfiles: any[] = [];
  // 4. Create Family Members (if any)
  if (payload.family_members && payload.family_members.length > 0) {
    const familyInserts = payload.family_members.map((member: any) => ({
      account_id: account.account_id,
      parent_profile_id: parentProfile.profile_id,
      first_name: member.first_name,
      last_name: member.last_name,
      date_of_birth: member.date_of_birth,
      role: 'CHILD', // Assuming family members are children/dependents
      rceb_flag: member.rceb_flag || false,
      is_active: true
    }));

    const { data: famData, error: famError } = await supabase
      .from('profiles')
      .insert(familyInserts)
      .select();

    if (famError) throw new AppError(`Failed to create family members: ${famError.message}`, 500);
    familyProfiles = famData || [];
  }

  // 6. Index in Elasticsearch
  await Promise.all([
    indexAccount({
      account_id: account.account_id,
      email: account.email,
      status: account.status,
      created_at: account.created_at
    }),
    indexProfile(parentProfile),
    ...familyProfiles.map(p => indexProfile(p))
  ]);

  // Refactored Family Indexing:
  // We need to capture the family profiles created.
  // The step 4 in the original code does not capture `data`.
  // I will refactor step 4 below in this replacement block or surrounding blocks.

  // 7. Generate Activation Token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

  const { error: tokenError } = await supabase
    .from('profile_activation_tokens')
    .insert({
      account_id: account.account_id,
      token: token,
      expires_at: expiresAt.toISOString()
    });

  if (tokenError) throw new AppError(`Failed to create activation token: ${tokenError.message}`, 500);

  // 8. Send activation email (Mock)
  await sendActivationEmail(payload.primary_profile.email, token);

  return {
    success: true,
    account_id: account.account_id,
    profiles_created: 1 + (payload.family_members?.length || 0),
    activation_emails_sent: 1,
  };
};
