import supabase from '../config/db';
import { EmailConfig } from '../types';

export const getEmailConfigByLocationId = async (locationId: string): Promise<EmailConfig | null> => {
  const { data, error } = await supabase
    .from('email_smtp_config')
    .select('*')
    .eq('location_id', locationId)
    .single();

  if (error) {
    // If no config found, return null instead of throwing if code is mainly used for checks
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data as EmailConfig;
};

export const upsertEmailConfig = async (config: EmailConfig): Promise<EmailConfig> => {
  const { location_id } = config;

  if (!location_id) {
    throw new Error('Location ID is required for email config');
  }

  // Remove config_id if it's undefined to let DB generate it on insert if needed
  // But usually upsert works by a constraint.
  // We have a unique constraint on location_id, so upsert should use that.
  
  const payload = { ...config, updated_at: new Date() };
  if (!payload.created_at) delete payload.created_at; // don't overwrite created_at if not passed

  const { data, error } = await supabase
    .from('email_smtp_config')
    .upsert(payload, { onConflict: 'location_id' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EmailConfig;
};

export default {
    getEmailConfigByLocationId,
    upsertEmailConfig
};
