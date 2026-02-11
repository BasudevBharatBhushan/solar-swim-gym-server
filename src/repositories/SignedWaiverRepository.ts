import supabase from '../config/db';
import { SignedWaiver } from '../types';

/**
 * Create or update a signed waiver
 */
export const upsertSignedWaiver = async (data: Partial<SignedWaiver>): Promise<SignedWaiver> => {
  const { 
    signed_waiver_id, 
    profile_id, 
    waiver_template_id, 
    waiver_type, 
    content, 
    signature_url, 
    location_id 
  } = data;

  const payload: Partial<SignedWaiver> = {
    profile_id,
    waiver_template_id,
    waiver_type,
    content,
    signature_url,
    location_id,
    updated_at: new Date().toISOString()
  };

  if (signed_waiver_id) {
    payload.signed_waiver_id = signed_waiver_id;
  } else {
    // New record
    payload.created_at = new Date().toISOString();
    payload.signed_at = new Date().toISOString();
  }

  const { data: result, error } = await supabase
    .from('signed_waiver')
    .upsert(payload, { onConflict: 'signed_waiver_id' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  return result;
};

/**
 * Get signed waivers by profile ID
 */
export const getSignedWaiversByProfile = async (profileId: string, locationId: string): Promise<SignedWaiver[]> => {
  const { data, error } = await supabase
    .from('signed_waiver')
    .select('*')
    .eq('profile_id', profileId)
    .eq('location_id', locationId)
    .order('signed_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export default {
  upsertSignedWaiver,
  getSignedWaiversByProfile
};
