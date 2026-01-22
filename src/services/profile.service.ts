import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';

export const getProfile = async (profileId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_id, role, account_id, first_name, last_name, email, date_of_birth, rceb_flag')
    .eq('profile_id', profileId)
    .single();

  if (error) {
    throw new AppError('Profile not found', 404);
  }
  
  // Get services
  const { data: services } = await supabase
    .from('profile_services')
    .select('service:services(service_id, service_name)') // Nesting requires Supabase to know FK. Explicit join not straightforward in one query without setup.
    // Simpler: just get profile_services and join or separate query.
    .eq('profile_id', profileId);

  // Note: Supabase JS select with relationships: .select('*, services(*)') if FK name matches.
  // Our FK is profile_services.service_id -> services.service_id.
  // The join table is explicit.
  
  return { ...data, services: services || [] };
};

export const getFamilyProfiles = async (accountId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('account_id', accountId);

  if (error) {
    throw new AppError('Family not found', 404);
  }

  return data;
};
