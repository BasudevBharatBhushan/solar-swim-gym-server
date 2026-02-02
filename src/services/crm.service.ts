import supabase from '../config/db';
import { Lead, Account } from '../types';
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
  const { lead_id, ...rest } = data;
  
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
}

interface WaiverData {
  waiver_program_id?: string;
  case_manager_name?: string;
  case_manager_email?: string;
}

const upsertProfileHelper = async (
  profileData: ProfileData, 
  waiverData?: WaiverData
): Promise<void> => {
  const { 
    profile_id, account_id, location_id, first_name, last_name, date_of_birth, 
    email, is_primary, guardian_name, guardian_mobile, emergency_contact_name, 
    emergency_contact_phone 
  } = profileData;
  
  const waiver_program_id = (waiverData && waiverData.waiver_program_id) || null;
  const case_manager_name = (waiverData && waiverData.case_manager_name) || null;
  const case_manager_email = (waiverData && waiverData.case_manager_email) || null;
  
  const payload: any = {
    account_id, location_id, first_name, last_name, date_of_birth, email,
    is_primary: is_primary || false,
    guardian_name, guardian_mobile, emergency_contact_name, emergency_contact_phone,
    waiver_program_id, case_manager_name, case_manager_email
  };

  if (profile_id) {
    payload.profile_id = profile_id;
  }

  const { error } = await supabase
    .from('profile')
    .upsert(payload, { onConflict: 'profile_id' });

  if (error) throw new Error(error.message);
};

interface UpsertAccountData {
  account_id?: string;
  location_id: string;
  primary_profile?: ProfileData;
  family_members?: ProfileData[];
  waiver_data?: WaiverData;
}

export const upsertAccount = async (data: UpsertAccountData): Promise<{ account_id: string }> => {
  const { account_id, location_id, primary_profile, family_members, waiver_data } = data;
    
  if (!location_id) throw new Error('Location ID required');

  let finalAccountId = account_id;

  // 1. Account
  if (!account_id) {
    const { data: newAccount, error: accError } = await supabase
      .from('account')
      .insert({ location_id, status: 'PENDING' })
      .select('account_id')
      .single();
      
    if (accError) throw new Error(accError.message);
    finalAccountId = newAccount.account_id;
  }

  // 2. Primary Profile
  if (primary_profile) {
    await upsertProfileHelper({ ...primary_profile, account_id: finalAccountId, location_id, is_primary: true }, waiver_data);
  }

  // 3. Family Members
  if (family_members && Array.isArray(family_members)) {
    for (const member of family_members) {
      await upsertProfileHelper({ ...member, account_id: finalAccountId, location_id, is_primary: false }, waiver_data);
    }
  }

  // Index in Elasticsearch
  await elasticService.indexAccount(finalAccountId!);

  return { account_id: finalAccountId! };
};

export const reindexAccounts = async (locationId: string): Promise<void> => {
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
  reindexAccounts
};
