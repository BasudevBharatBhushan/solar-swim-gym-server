import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';

export const getAllServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new AppError('Could not fetch services', 500);
  }

  return data;
};
