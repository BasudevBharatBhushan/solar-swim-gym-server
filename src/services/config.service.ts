import supabase from '../config/db';
import { AgeGroup, SubscriptionTerm, WaiverProgram } from '../types';

// Age Groups
export const getAgeGroups = async (): Promise<AgeGroup[]> => {
  const { data, error } = await supabase
    .from('age_group')
    .select('*')
    .order('min_age', { ascending: true });
    
  if (error) throw new Error(error.message);
  return data || [];
};

export const upsertAgeGroup = async (data: any): Promise<any> => {
  const { age_group_id, name, min_age, max_age } = data;
  const payload: any = { name, min_age, max_age };
  
  if (age_group_id) {
    payload.age_group_id = age_group_id;
  }

  const { data: result, error } = await supabase
    .from('age_group')
    .upsert(payload, { onConflict: 'age_group_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

// Subscription Terms
export const getTerms = async (locationId?: string): Promise<SubscriptionTerm[]> => {
  let query = supabase
    .from('subscription_term')
    .select('*')
    .order('duration_months', { ascending: true });

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const upsertTerm = async (data: any): Promise<any> => {
  const { subscription_term_id, location_id, name, duration_months, payment_mode, is_active } = data;
  
  const payload: any = { 
    location_id, 
    name, 
    duration_months, 
    payment_mode: payment_mode || 'RECURRING',
    is_active: is_active !== false 
  };
  
  if (subscription_term_id) {
    payload.subscription_term_id = subscription_term_id;
  }

  const { data: result, error } = await supabase
    .from('subscription_term')
    .upsert(payload, { onConflict: 'subscription_term_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

// Waivers
export const getWaivers = async (locationId?: string): Promise<WaiverProgram[]> => {
  let query = supabase
    .from('waiver_program')
    .select('*')
    .order('name', { ascending: true });

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
};

export const upsertWaiver = async (data: any): Promise<any> => {
  const { waiver_program_id, location_id, name, description, is_active } = data;
  
  const payload: any = { 
    location_id, 
    name, 
    description, 
    is_active: is_active !== false 
  };
  
  if (waiver_program_id) {
    payload.waiver_program_id = waiver_program_id;
  }

  const { data: result, error } = await supabase
    .from('waiver_program')
    .upsert(payload, { onConflict: 'waiver_program_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export default {
  getAgeGroups,
  upsertAgeGroup,
  getTerms,
  upsertTerm,
  getWaivers,
  upsertWaiver
};
