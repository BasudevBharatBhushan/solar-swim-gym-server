import supabase from '../config/db';
import { BasePrice } from '../types';

interface BasePriceWithDetails extends BasePrice {
  age_group_name?: string;
  term_name?: string;
}

export const getAllBasePrices = async (locationId: string): Promise<BasePriceWithDetails[]> => {
  if (!locationId) throw new Error('Location ID required');

  const { data: prices, error } = await supabase
    .from('base_price')
    .select('*')
    .eq('location_id', locationId);

  if (error) throw new Error(error.message);
  if (!prices || prices.length === 0) return [];

  const { data: ageGroups } = await supabase.from('age_group').select('age_group_id, name');
  const { data: terms } = await supabase.from('subscription_term').select('subscription_term_id, name');

  const ageGroupMap = new Map(ageGroups?.map(ag => [ag.age_group_id, ag.name]));
  const termMap = new Map(terms?.map(st => [st.subscription_term_id, st.name]));

  return prices.map(price => ({
    ...price,
    age_group_name: ageGroupMap.get(price.age_group_id) || 'Unknown',
    term_name: termMap.get(price.subscription_term_id) || 'Unknown'
  }));
};

export const upsertBasePrice = async (data: Partial<BasePrice> & { location_id: string }): Promise<BasePriceWithDetails | null> => {
  const { location_id, ...payload } = data;
  if (!location_id) throw new Error('Location ID required');

  const { data: result, error } = await supabase
    .from('base_price')
    .upsert({ ...payload, location_id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const all = await getAllBasePrices(location_id);
  return all.find(p => p.base_price_id === result.base_price_id) || null;
};

export default {
  getAllBasePrices,
  upsertBasePrice
};
