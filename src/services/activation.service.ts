import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import bcrypt from 'bcrypt';

export const validateToken = async (token: string) => {
  const { data, error } = await supabase
    .from('profile_activation_tokens')
    .select('*, account:accounts(email, account_id)')
    .eq('token', token)
    .single();

  if (error || !data) {
    throw new AppError('Invalid token', 400);
  }

  if (data.is_used) {
    throw new AppError('Token already used', 400);
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new AppError('Token expired', 400);
  }

  const account = data.account as any;

  return {
    valid: true,
    account_id: account.account_id,
    email: account.email
  };
};

export const activateProfile = async (token: string, password: string) => {
  // 1. Validate token again
  const { data: tokenData, error: tokenError } = await supabase
    .from('profile_activation_tokens')
    .select('account_id, expires_at, is_used')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    throw new AppError('Invalid token', 400);
  }

  if (tokenData.is_used) {
    throw new AppError('Token already used', 400);
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    throw new AppError('Token expired', 400);
  }

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Update Account & Token
  const { error: updateAccountError } = await supabase
    .from('accounts')
    .update({ password_hash: passwordHash, status: 'active' } as any)
    .eq('account_id', tokenData.account_id);

  if (updateAccountError) {
    throw new AppError('Could not activate account', 500);
  }

  const { error: updateTokenError } = await supabase
    .from('profile_activation_tokens')
    .update({ is_used: true } as any)
    .eq('token', token);

  if (updateTokenError) {
    // Critical error: Account activated but token not marked used.
    console.error('CRITICAL: Token not marked is_used after activation', token);
  }

  return { success: true };
};
