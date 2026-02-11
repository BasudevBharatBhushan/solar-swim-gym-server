import supabase from '../config/db';
import { Lead, Account, Profile } from '../types';
import elasticService from './elastic.service';

// --- LEADS ---
export const getLeads = async (locationId: string): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

interface UpsertLeadData {
  lead_id?: string;
  location_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  mobile?: string;
  status?: string;
  notes?: string;
  added_by_staff_id?: string;
}

export const upsertLead = async (data: UpsertLeadData): Promise<Lead> => {
  const { lead_id } = data;
  
  // Clean payload
  const payload = { ...data };
  if (!lead_id) {
    delete payload.lead_id;
    if (!payload.status) payload.status = 'NEW';
  }

  const { data: result, error } = await supabase
    .from('leads')
    .upsert(payload, { onConflict: 'lead_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  // Index in Elasticsearch
  await elasticService.indexLead(result);
  
  return result as Lead;
};

export const reindexLeads = async (locationId: string): Promise<void> => {
  // Clear existing leads for this location first
  await elasticService.deleteLeadsByLocation(locationId);

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('location_id', locationId);

  if (error) throw new Error(error.message);
  
  for (const lead of (leads || [])) {
    await elasticService.indexLead(lead);
  }
};

// --- ACCOUNTS ---
export const getAccounts = async (locationId: string): Promise<Account[]> => {
  const { data, error } = await supabase
    .from('account')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

interface ProfileData {
  profile_id?: string;
  account_id?: string;
  location_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
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

const upsertProfileHelper = async (
  profileData: ProfileData & WaiverData
): Promise<void> => {
  const { 
    profile_id, account_id, location_id, first_name, last_name, date_of_birth, 
    email, is_primary, guardian_name, guardian_mobile, emergency_contact_name, 
    emergency_contact_phone, waiver_program_id, case_manager_name, case_manager_email
  } = profileData;
  
  const payload: Profile = {
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
      .eq('location_id', location_id);

    if (waiverError) {
      console.error(`Failed to link waiver ${profileData.signed_waiver_id} to profile ${profileIdResult}:`, waiverError.message);
    }
  }
};

interface UpsertAccountData {
  account_id?: string;
  location_id: string;
  primary_profile?: ProfileData & WaiverData;
  family_members?: (ProfileData & WaiverData)[];
}

export const upsertAccount = async (data: UpsertAccountData): Promise<{ account_id: string }> => {
  const { account_id, location_id, primary_profile, family_members } = data;
    
  if (!account_id) throw new Error('Account ID is required. UpsertAccount cannot create new accounts.');
  if (!location_id) throw new Error('Location ID required');

  const finalAccountId = account_id;

  // 2. Primary Profile
  if (primary_profile) {
    await upsertProfileHelper({ ...primary_profile, account_id: finalAccountId, location_id, is_primary: true });
  }

  // 3. Family Members
  if (family_members && Array.isArray(family_members)) {
    for (const member of family_members) {
      await upsertProfileHelper({ ...member, account_id: finalAccountId, location_id, is_primary: false });
    }
  }

  // Index in Elasticsearch
  await elasticService.indexAccount(finalAccountId!);

  return { account_id: finalAccountId! };
};

export const getProfile = async (locationId: string, profileId: string): Promise<Profile | null> => {
    // We join with validation on location_id to ensure tenant isolation
    const { data, error } = await supabase
        .from('profile')
        .select(`
            *,
            waiver_program:waiver_program_id (
                name,
                code
            )
        `)
        .eq('profile_id', profileId)
        .eq('location_id', locationId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; 
        throw new Error(error.message);
    }
    return data as Profile;
};

// --- ACCOUNTS ---
export const getAccountById = async (locationId: string, accountId: string): Promise<Account | null> => {
    const { data, error } = await supabase
        .from('account')
        .select(`
            *,
            profile:profile (
                *,
                waiver_program:waiver_program_id (
                    name,
                    code
                )
            )
        `)
        .eq('account_id', accountId)
        .eq('location_id', locationId)
        .single();

    if (error) {
         if (error.code === 'PGRST116') return null;
         throw new Error(error.message);
    }
    return data as Account;
};

export const reindexAccounts = async (locationId: string): Promise<void> => {
    // Clear existing accounts for this location first
    await elasticService.deleteAccountsByLocation(locationId);

    const { data: accounts, error } = await supabase
        .from('account')
        .select('account_id')
        .eq('location_id', locationId);

    if (error) throw new Error(error.message);

    for (const acc of (accounts || [])) {
        await elasticService.indexAccount(acc.account_id);
    }
};

export default { 
  getLeads, 
  upsertLead, 
  reindexLeads,
  getAccounts, 
  upsertAccount,
  reindexAccounts,
  getProfile,
  getAccountById
};
