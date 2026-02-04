import supabase from '../config/db';
import { BasePrice, MembershipService } from '../types';

interface BasePriceWithDetails extends BasePrice {
  age_group_name?: string;
  term_name?: string;
}

interface BasePlanResponse {
  prices: BasePriceWithDetails[];
  membership_services: MembershipService[];
}

export const getAllBasePrices = async (locationId: string): Promise<BasePlanResponse> => {
  if (!locationId) throw new Error('Location ID required');

  // 1. Fetch Base Prices
  const { data: prices, error: priceErr } = await supabase
    .from('base_price')
    .select('*')
    .eq('location_id', locationId)
    .order('name', { ascending: true });

  if (priceErr) throw new Error(priceErr.message);

  // 2. Fetch Membership Services (Base Plan)
  // Those where membership_program_id is null and is_part_of_base_plan is true
  const { data: membershipServices, error: svcErr } = await supabase
    .from('membership_service')
    .select('*, service:service_id!inner(location_id)')
    .is('membership_program_id', null)
    .eq('is_part_of_base_plan', true)
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
  const cleanMembershipServices: MembershipService[] = membershipServices?.map((s: any) => {
    const { service, ...rest } = s; 
    return rest as MembershipService;
  }) || [];

  return {
    prices: enrichedPrices,
    membership_services: cleanMembershipServices
  };
};

export const upsertBasePrice = async (data: any): Promise<BasePlanResponse> => {
  let { location_id, prices, membership_services } = data;

  // 0. Handle flat payload for single price (backward compatibility)
  if (!prices && !membership_services && data.age_group_id && data.subscription_term_id) {
    prices = [data];
    if (!location_id) location_id = data.location_id;
  }

  if (!location_id) throw new Error('Location ID required');

  console.log('Upserting Base Price with data:', { 
    location_id, 
    pricesCount: prices?.length || 0, 
    msCount: membership_services?.length || 0 
  });

  // 1. Upsert Prices (with duplication prevention)
  if (prices && prices.length > 0) {
    // Fetch current prices to match by age_group and term if ID is missing
    const { data: existingPrices } = await supabase
      .from('base_price')
      .select('base_price_id, age_group_id, subscription_term_id')
      .eq('location_id', location_id);

    const priceMap = new Map((existingPrices || []).map((p: any) => [`${p.age_group_id}_${p.subscription_term_id}`, p.base_price_id]));

    const pricesToUpsert = (prices as any[]).map((p: any) => {
      const key = `${p.age_group_id}_${p.subscription_term_id}`;
      const id = p.base_price_id || priceMap.get(key);
      const { base_price_id: _oldId, ...rest } = p;
      return { 
        ...rest, 
        ...(id ? { base_price_id: id } : {}), 
        location_id 
      };
    });

    console.log('Prices to upsert:', pricesToUpsert);

    const { error } = await supabase.from('base_price').upsert(pricesToUpsert);
    if (error) throw new Error(`Price error: ${error.message}`);
  }

  // 2. Upsert Membership Services (with duplication prevention)
  if (membership_services && membership_services.length > 0) {
    // Fetch current base plan services for this location
    const { data: currentMS } = await supabase
      .from('membership_service')
      .select('membership_service_id, service_id, service:service_id!inner(location_id)')
      .is('membership_program_id', null)
      .eq('is_part_of_base_plan', true)
      .eq('service.location_id', location_id);

    const msMap = new Map((currentMS || []).map((s: any) => [s.service_id, s.membership_service_id]));

    const servicesToUpsert = (membership_services as any[]).map((s: any) => {
      const id = s.membership_service_id || (s.service_id ? msMap.get(s.service_id) : null);
      const { membership_service_id: _oldId, ...rest } = s;
      return {
        ...rest,
        ...(id ? { membership_service_id: id } : {}),
        membership_program_id: null,
        is_part_of_base_plan: true
      };
    });

    const { error } = await supabase.from('membership_service').upsert(servicesToUpsert);
    if (error) throw new Error(`Membership Service error: ${error.message}`);
  }

  return getAllBasePrices(location_id);
};

export default {
  getAllBasePrices,
  upsertBasePrice
};
