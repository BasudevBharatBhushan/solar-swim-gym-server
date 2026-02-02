import supabase from '../config/db';
import { Location } from '../types';

export const getAllLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase
    .from('location')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error('Supabase Error in getAllLocations:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Supabase error occurred');
  }
  
  return data || [];
};

export const upsertLocation = async (data: Location): Promise<Location> => {
  const { location_id } = data;
  
  const payload = { ...data };
  if (!location_id) {
    delete payload.location_id;
  }
  
  const { data: result, error } = await supabase
    .from('location')
    .upsert(payload, { onConflict: 'location_id' })
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return result as Location;
};

export default {
  getAllLocations,
  upsertLocation
};
