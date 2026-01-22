import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import bcrypt from 'bcrypt';

export const validateToken = async (token: string) => {
  const { data, error } = await supabase
    .from('profile_activation_tokens')
    .select('profile:profile_id(email, profile_id), expires_at, used')
    .eq('token', token)
    .single();

  if (error || !data) {
    throw new AppError('Invalid token', 400);
  }

  if (data.used) {
    throw new AppError('Token already used', 400);
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new AppError('Token expired', 400);
  }

  // data.profile is an array or object depending on relationship.
  // Since it is 1:1 or N:1, it should be an object if single() worked on the join.
  // Actually Supabase returns nested object for single relation.
  const profile = data.profile as any; // Cast to avoid TS complexity for now

  return {
    valid: true,
    profile_id: profile.profile_id,
    email: profile.email,
  };
};

export const activateProfile = async (token: string, password: string) => {
  // 1. Validate token again
  const { data: tokenData, error: tokenError } = await supabase
    .from('profile_activation_tokens')
    .select('profile_id, expires_at, used')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    throw new AppError('Invalid token', 400);
  }

  if (tokenData.used) {
    throw new AppError('Token already used', 400);
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    throw new AppError('Token expired', 400);
  }

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Update Profile & Token
  // Should be atomic if possible, but separate calls ok for now. 
  // Better: RPC or carefully ordered. 
  // We'll update profile first, then token.

  const { error: updateProfileError } = await supabase
    .from('profiles')
    .update({ password_hash: passwordHash, is_active: true } as any)
    .eq('profile_id', tokenData.profile_id);

  if (updateProfileError) {
    throw new AppError('Could not activate profile', 500);
  }

  const { error: updateTokenError } = await supabase
    .from('profile_activation_tokens')
    .update({ used: true } as any)
    .eq('token', token);

  if (updateTokenError) {
    // Critical error: Profile activated but token not marked used.
    // In real app, log urgency.
    console.error('CRITICAL: Token not marked used after activation', token);
  }

  return { success: true };
};
