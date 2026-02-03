import supabase from '../config/db';
import { BasePrice, MembershipService } from '../types';

interface BasePriceWithDetails extends BasePrice {
  age_group_name?: string;
  term_name?: string;
}

interface BasePlanResponse {
  prices: BasePriceWithDetails[];
  bundled_services: MembershipService[];
}

export const getAllBasePrices = async (locationId: string): Promise<BasePlanResponse> => {
  if (!locationId) throw new Error('Location ID required');

  // 1. Fetch Base Prices
  const { data: prices, error: priceErr } = await supabase
    .from('base_price')
    .select('*')
    .eq('location_id', locationId);

  if (priceErr) throw new Error(priceErr.message);

  // 2. Fetch Bundled Services (Base Plan)
  // We filter by joining "service" table to ensure location scope
  const { data: bundledServices, error: svcErr } = await supabase
    .from('membership_service')
    .select('*, service:service_id!inner(location_id)')
    .is('membership_program_id', null)
    .eq('service.location_id', locationId);

  if (svcErr) throw new Error(svcErr.message);

  // 3. Enrich Prices with Names
  let enrichedPrices: BasePriceWithDetails[] = [];
  
  if (prices && prices.length > 0) {
    const { data: ageGroups } = await supabase.from('age_group').select('age_group_id, name');
    const { data: terms } = await supabase.from('subscription_term').select('subscription_term_id, name');

    const ageGroupMap = new Map(ageGroups?.map(ag => [ag.age_group_id, ag.name]));
    const termMap = new Map(terms?.map(st => [st.subscription_term_id, st.name]));

    enrichedPrices = prices.map(price => ({
      ...price,
      age_group_name: ageGroupMap.get(price.age_group_id) || 'Unknown',
      term_name: termMap.get(price.subscription_term_id) || 'Unknown'
    }));
  }

  // Cast bundledServices to MembershipService[] to remove joined table data from type if needed
  // Note: Supabase returns the join data structure, but we can just treat it as MembershipService if we ignore the extra field?
  // Or map it to clean it up.
  const cleanBundledServices: MembershipService[] = bundledServices?.map((s: unknown) => {
    const { service: _service, ...rest } = s as MembershipService & { service: unknown }; 
    return rest as MembershipService;
  }) || [];

  return {
    prices: enrichedPrices,
    bundled_services: cleanBundledServices
  };
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
  return all.prices.find(p => p.base_price_id === result.base_price_id) || null;
};

export default {
  getAllBasePrices,
  upsertBasePrice
};
