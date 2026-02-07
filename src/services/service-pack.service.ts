import supabase from '../config/db';
import { ServicePack, ServicePrice, AgeGroup, SubscriptionTerm } from '../types';

interface ServicePriceWithDetails extends ServicePrice {
    age_group_name?: string;
    term_name?: string;
}

export const getServicePacksByServiceId = async (serviceId: string): Promise<ServicePack[]> => {
    if (!serviceId) throw new Error('Service ID is required');

    const { data, error } = await supabase
        .from('service_pack')
        .select('*')
        .eq('service_id', serviceId);

    if (error) throw new Error(error.message);
    return data || [];
};

export const getServicePackPrices = async (servicePackId: string): Promise<ServicePriceWithDetails[]> => {
    if (!servicePackId) throw new Error('Service Pack ID is required');

    const { data: prices, error } = await supabase
        .from('service_price')
        .select('*')
        .eq('service_pack_id', servicePackId);

    if (error) throw new Error(error.message);
    if (!prices || prices.length === 0) return [];

    // Fetch details for enrichment
    const { data: ageGroups } = await supabase.from('age_group').select('*');
    const { data: terms } = await supabase.from('subscription_term').select('*');

    const ageGroupMap = new Map(ageGroups?.map((ag: AgeGroup) => [ag.age_group_id, ag.name]));
    const termMap = new Map(terms?.map((t: SubscriptionTerm) => [t.subscription_term_id, t.name]));

    return prices.map(price => ({
        ...price,
        age_group_name: price.age_group_id ? ageGroupMap.get(price.age_group_id) : undefined,
        term_name: price.subscription_term_id ? termMap.get(price.subscription_term_id) : undefined
    }));
};

export const upsertServicePack = async (packData: Partial<ServicePack>): Promise<ServicePack> => {
    if (!packData.service_id && !packData.service_pack_id) {
        throw new Error('Service ID is required for creating a new pack, or Service Pack ID for updating.');
    }

    const { data, error } = await supabase
        .from('service_pack')
        .upsert(packData)
        .select('*')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export const upsertServicePrice = async (priceData: Partial<ServicePrice>): Promise<ServicePrice> => {
    if (!priceData.service_pack_id && !priceData.service_price_id) {
        throw new Error('Service Pack ID is required for creating a new price, or Service Price ID for updating.');
    }
    if (!priceData.age_group_id) throw new Error('Age Group ID is required.');
    
    // Ensure subscription_term_id is handled if undefined (DB allows null, but upsert needs explicit undefined or null)
    // Actually, simply passing partial is fine.

    const { data, error } = await supabase
        .from('service_price')
        .upsert(priceData as any) // Type assertion might be needed if ServicePrice interface isn't perfectly matching DB response or input partial
        .select('*')
        .single();

    if (error) throw new Error(error.message);
    return data;
};

export default {
    getServicePacksByServiceId,
    getServicePackPrices,
    upsertServicePack,
    upsertServicePrice
};
