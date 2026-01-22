import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';
import bcrypt from 'bcrypt';
import { sendActivationEmail } from '../utils/email.service';

interface OnboardingPayload {
  primary_profile: any;
  family_members: any[];
}

export const completeOnboarding = async (payload: OnboardingPayload) => {
  // 1. Hash the parent password before sending to DB
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(payload.primary_profile.password, salt);
  
  // Update payload with hashed password
  const securePayload = {
    ...payload,
    primary_profile: {
      ...payload.primary_profile,
      password: hashedPassword,
    },
  };

  // 2. Call the Postgres function (RPC) for atomic transaction
  const { data, error } = await supabase.rpc('complete_onboarding', {
    payload: securePayload,
  });

  if (error) {
    throw new AppError(`Onboarding failed: ${error.message}`, 500);
  }

  // 3. Send activation emails (Mock)
  if (data.activations && Array.isArray(data.activations)) {
    for (const activation of data.activations) {
      await sendActivationEmail(activation.email, activation.token);
    }
  }

  return {
    success: true,
    account_id: data.account_id,
    profiles_created: 1 + payload.family_members.length,
    activation_emails_sent: data.activations?.length || 0,
  };
};
