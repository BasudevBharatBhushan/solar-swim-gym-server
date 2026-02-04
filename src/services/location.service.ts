import supabase from '../config/db';
import { Location } from '../types';
import { upsertEmailConfig } from './emailConfig.service';

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

  // If this was a new location creation (we didn't have location_id in payload initially, but result has it)
  // Ensure we create a default email config structure for it
  if (!data.location_id && result && result.location_id) {
    try {
        await upsertEmailConfig({
            location_id: result.location_id,
            // Default empty or placeholder values, user can update later
            smtp_host: '',
            smtp_port: 587,
            sender_email: '',
            sender_name: result.name, // Use location name as default sender name
            is_secure: true,
            is_active: true
        });
    } catch (configError) {
        console.error('Failed to create default email config for new location:', configError);
        // We probably shouldn't fail the whole location creation if this fails, but logging is important.
    }
  }
  
  return result as Location;
};

export default {
  getAllLocations,
  upsertLocation
};
