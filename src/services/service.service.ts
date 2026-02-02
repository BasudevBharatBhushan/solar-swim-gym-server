import supabase from '../config/db';
import { Service } from '../types';

interface PricingTerm {
  subscription_term_id: string;
  term_name: string;
  price: number;
  price_id?: string;
}

interface PricingGroup {
  age_group_id: string;
  age_group_name: string;
  terms: PricingTerm[];
}

interface ServiceWithPricing extends Service {
  pricing_structure: PricingGroup[];
}

export const getAllServices = async (locationId: string): Promise<ServiceWithPricing[]> => {
  if (!locationId) throw new Error('Location ID required');

  // Fetch all related data
  const { data: services, error: svcError } = await supabase
    .from('service')
    .select('*')
    .eq('location_id', locationId);

  if (svcError) throw new Error(svcError.message);
  if (!services || services.length === 0) return [];

  const serviceIds = services.map(s => s.service_id);
  
  const { data: prices, error: priceError } = await supabase
    .from('service_price')
    .select('*')
    .in('service_id', serviceIds);
    
  if (priceError) throw new Error(priceError.message);

  const { data: ageGroups } = await supabase.from('age_group').select('*');
  const { data: terms } = await supabase.from('subscription_term').select('*');

  // Helper maps
  const ageGroupMap = new Map(ageGroups?.map(ag => [ag.age_group_id, ag.name]));
  const termMap = new Map(terms?.map(t => [t.subscription_term_id, t.name]));

  const result: ServiceWithPricing[] = [];
  
  for (const svc of services) {
    const svcPrices = prices?.filter(p => p.service_id === svc.service_id) || [];
    
    const grouped: Record<string, PricingGroup> = {};
    for (const p of svcPrices) {
      if (!grouped[p.age_group_id]) {
        grouped[p.age_group_id] = {
          age_group_id: p.age_group_id,
          age_group_name: ageGroupMap.get(p.age_group_id) || 'Unknown',
          terms: []
        };
      }
      grouped[p.age_group_id].terms.push({
        subscription_term_id: p.subscription_term_id,
        term_name: termMap.get(p.subscription_term_id) || 'Unknown',
        price: p.price,
        price_id: p.service_price_id
      });
    }
    
    result.push({
      ...svc,
      pricing_structure: Object.values(grouped)
    });
  }
  return result;
};

interface UpsertServiceData {
  service_id?: string;
  location_id: string;
  name: string;
  description?: string;
  is_addon_only?: boolean;
  pricing_structure?: PricingGroup[];
}

export const upsertService = async (data: UpsertServiceData): Promise<ServiceWithPricing | undefined> => {
    const { service_id, location_id, name, description, is_addon_only, pricing_structure } = data;
    
    if (!location_id) throw new Error('Location ID is required');

    let finalServiceId = service_id;

    // 1. Service Update/Create
    const servicePayload: any = { 
       location_id, name, description, is_addon_only: is_addon_only || false 
    };
    
    if (service_id) {
       servicePayload.service_id = service_id;
    }

    const { data: svcResult, error: svcError } = await supabase
      .from('service')
      .upsert(servicePayload, { onConflict: 'service_id' })
      .select('service_id')
      .single();
      
    if (svcError) throw new Error(svcError.message);
    finalServiceId = svcResult.service_id;

    // 2. Pricing Structure
    if (pricing_structure && Array.isArray(pricing_structure)) {
      for (const group of pricing_structure) {
        for (const term of group.terms) {
          const { subscription_term_id, price, price_id } = term;
          
          if (price_id) {
            await supabase
              .from('service_price')
              .update({ price, updated_at: new Date() })
              .eq('service_price_id', price_id);
          } else {
            await supabase
              .from('service_price')
              .insert({
                service_id: finalServiceId,
                location_id,
                age_group_id: group.age_group_id,
                subscription_term_id,
                price
              });
          }
        }
      }
    }

    const allServices = await getAllServices(location_id);
    return allServices.find(s => s.service_id === finalServiceId);
};

export default {
  getAllServices,
  upsertService
};
