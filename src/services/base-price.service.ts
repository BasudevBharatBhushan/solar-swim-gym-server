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

  // 2. Fetch Membership Services (Base Plan) - REMOVED
  // Membership services are now managed separately via membership-service API
  
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

  return {
    prices: enrichedPrices,
    membership_services: [] // Return empty array for backward compatibility if needed, or update type
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
    // Fetch current prices to match by age_group, term, name, and role if ID is missing
    const { data: existingPrices } = await supabase
      .from('base_price')
      .select('base_price_id, age_group_id, subscription_term_id, name, role')
      .eq('location_id', location_id);

    const priceMap = new Map((existingPrices || []).map((p: any) => [
      `${p.age_group_id}_${p.subscription_term_id}_${p.name}_${p.role}`, 
      p.base_price_id
    ]));

    const pricesToUpsert = (prices as any[]).map((p: any) => {
      // Ensure we have a valid key for lookup even if defaults are involved (default role is PRIMARY)
      const role = p.role || 'PRIMARY'; 
      const name = p.name; 
      
      const key = `${p.age_group_id}_${p.subscription_term_id}_${name}_${role}`;
      const id = p.base_price_id || priceMap.get(key);
      const { base_price_id: _oldId, ...rest } = p;
      return { 
        ...rest, 
        ...(id ? { base_price_id: id } : {}), 
        location_id 
      };
    });

    console.log('Prices to upsert:', pricesToUpsert);

    const priceUpdates = pricesToUpsert.filter(p => !!p.base_price_id);
    const priceInserts = pricesToUpsert.filter(p => !p.base_price_id);

    if (priceUpdates.length > 0) {
      const { error } = await supabase.from('base_price').upsert(priceUpdates);
      if (error) throw new Error(`Price update error: ${error.message}`);
    }
    if (priceInserts.length > 0) {
      const { error } = await supabase.from('base_price').insert(priceInserts);
      if (error) throw new Error(`Price insert error: ${error.message}`);
    }
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

    const msUpdates = servicesToUpsert.filter(s => !!s.membership_service_id);
    const msInserts = servicesToUpsert.filter(s => !s.membership_service_id);

    if (msUpdates.length > 0) {
      const { error } = await supabase.from('membership_service').upsert(msUpdates);
      if (error) throw new Error(`Membership Service update error: ${error.message}`);
    }
    if (msInserts.length > 0) {
      const { error } = await supabase.from('membership_service').insert(msInserts);
      if (error) throw new Error(`Membership Service insert error: ${error.message}`);
    }
  }

  return getAllBasePrices(location_id);
};

export default {
  getAllBasePrices,
  upsertBasePrice
};
