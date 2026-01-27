import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (email: string, password: string) => {
  // 1. Find profile and account
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, account:accounts(account_id, password_hash, status)')
    .eq('email', email)
    .single();

  if (error || !profile || !profile.account) {
    throw new AppError('Invalid email or password', 401);
  }

  const account = profile.account as any;

  // 2. Verify password
  let isValid = false;
  
  if (account.password_hash && account.password_hash.startsWith('$2b$')) {
    isValid = await bcrypt.compare(password, account.password_hash);
  } else {
    // Fallback for plain text if any (legacy), though we expect hashed.
    isValid = false; 
  }

  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }
  
  if (account.status !== 'active') {
       throw new AppError('Account is not active', 403);
  }

  // 3. Generate JWT
  const token = jwt.sign(
    { profile_id: profile.profile_id, account_id: account.account_id, role: profile.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    token: token,
    user: {
      profile_id: profile.profile_id,
      account_id: account.account_id,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email
    },
  };
};
