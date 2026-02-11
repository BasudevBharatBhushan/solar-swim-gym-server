import supabase from '../config/db';
import { WaiverTemplate } from '../types';

/**
 * Get all waiver templates for a location
 */
export const getWaiverTemplates = async (locationId: string): Promise<WaiverTemplate[]> => {
  const { data, error } = await supabase
    .from('waiver_template')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Get a specific waiver template by ID
 */
export const getWaiverTemplateById = async (id: string, locationId: string): Promise<WaiverTemplate | null> => {
  const { data, error } = await supabase
    .from('waiver_template')
    .select('*')
    .eq('waiver_template_id', id)
    .eq('location_id', locationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data || null;
};

/**
 * Create or update a waiver template
 */
export const upsertWaiverTemplate = async (data: Partial<WaiverTemplate>): Promise<WaiverTemplate> => {
  const { 
    waiver_template_id, 
    location_id, 
    ageprofile_id, 
    subterm_id, 
    base_price_id, 
    membership_category_id, 
    service_id, 
    content, 
    is_active 
  } = data;

  const payload: Partial<WaiverTemplate> = {
    location_id,
    ageprofile_id,
    subterm_id,
    base_price_id,
    membership_category_id,
    service_id,
    content,
    is_active: is_active !== false,
    updated_at: new Date()
  };

  if (waiver_template_id) {
    payload.waiver_template_id = waiver_template_id;
  }

  const { data: result, error } = await supabase
    .from('waiver_template')
    .upsert(payload, { onConflict: 'waiver_template_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

export default {
  getWaiverTemplates,
  getWaiverTemplateById,
  upsertWaiverTemplate
};
