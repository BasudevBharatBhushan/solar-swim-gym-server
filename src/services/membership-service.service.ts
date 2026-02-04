import supabase from '../config/db';
import { MembershipService } from '../types';

/**
 * Service to handle membership services logic
 */
export const getBasePlanServices = async (locationId: string): Promise<MembershipService[]> => {
  if (!locationId) throw new Error('Location ID required');

  // Fetch Membership Services where membership_program_id is null
  // and join with service table to filter by location_id
  const { data, error } = await supabase
    .from('membership_service')
    .select('*, service:service_id!inner(location_id, name)')
    .is('membership_program_id', null)
    .eq('service.location_id', locationId);

  if (error) throw new Error(error.message);

  // Clean up the response to remove join data if needed, 
  // or keep it if it's useful for the UI.
  // The user specifically asked to fetch membership_services particularly for the base plan.
  return (data || []).map((ms: any) => {
    const { service, ...rest } = ms;
    return {
      ...rest,
      service_name: service?.name // Adding name for convenience
    };
  }) as MembershipService[];
};

/**
 * Upsert membership services
 * accepts any type of membership_service, membership_program_id available or not
 */
export const upsertMembershipService = async (data: Partial<MembershipService> | Partial<MembershipService>[]): Promise<MembershipService[]> => {
  const services = Array.isArray(data) ? data : [data];

  if (services.length === 0) return [];

  // Helper to handle missing IDs by matching service_id and membership_program_id
  // This helps when the client doesn't have the membership_service_id but wants to update an existing link
  
  // 1. Collect all service_ids to fetch existing mappings
  const serviceIds = services.map(s => s.service_id).filter(Boolean);
  
  if (serviceIds.length > 0) {
    const { data: existing } = await supabase
      .from('membership_service')
      .select('membership_service_id, service_id, membership_program_id')
      .in('service_id', serviceIds as string[]);

    if (existing && existing.length > 0) {
      // Create a map for lookup
      // Key format: serviceId_programId (programId is "null" if null)
      const existingMap = new Map(
        existing.map(e => [`${e.service_id}_${e.membership_program_id}`, e.membership_service_id])
      );

      // 2. Attach IDs to the payload if missing
      services.forEach(s => {
        if (!s.membership_service_id) {
          const key = `${s.service_id}_${s.membership_program_id || 'null'}`;
          if (existingMap.has(key)) {
            s.membership_service_id = existingMap.get(key);
          }
        }
      });
    }
  }
  
  const { data: result, error } = await supabase
    .from('membership_service')
    .upsert(services)
    .select();

  if (error) throw new Error(error.message);

  return result as MembershipService[];
};

export default {
  getBasePlanServices,
  upsertMembershipService
};
