import supabase from '../config/db';
import { DiscountCode } from '../types';

/**
 * Get all discount codes for a location
 */
export const getDiscountCodes = async (locationId: string): Promise<DiscountCode[]> => {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Create or Update a discount code
 */
export const upsertDiscountCode = async (data: Partial<DiscountCode>): Promise<DiscountCode> => {
  const { 
    discount_id, 
    location_id, 
    staff_id, 
    discount_code, 
    discount, 
    staff_name,
    service_id,
    is_active 
  } = data;

  const payload: Partial<DiscountCode> = {
    location_id,
    staff_id,
    discount_code,
    discount,
    staff_name,
    service_id,
    is_active: is_active !== false,
    updated_at: new Date()
  };

  if (discount_id) {
    payload.discount_id = discount_id;
  }

  const { data: result, error } = await supabase
    .from('discount_codes')
    .upsert(payload, { onConflict: 'discount_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return result;
};

/**
 * Get a specific discount code by its code string and location
 */
export const getDiscountByCode = async (code: string, locationId: string): Promise<DiscountCode | null> => {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('discount_code', code)
    .eq('location_id', locationId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
    throw new Error(error.message);
  }
  
  return data || null;
};

export default {
  getDiscountCodes,
  upsertDiscountCode,
  getDiscountByCode
};
