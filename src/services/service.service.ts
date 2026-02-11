import supabase from '../config/db';
import { Service } from '../types';
import { PostgrestError } from '@supabase/supabase-js';

// Define a minimal interface for the file to avoid direct dependency on Multer types in service signature if possible,
// but for now strict typing is good.
interface UploadedFile {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
}

export const getAllServices = async (locationId: string): Promise<Service[]> => {
  if (!locationId) throw new Error('Location ID required');

  const { data: services, error: svcError } = await supabase
    .from('service')
    .select('*')
    .eq('location_id', locationId);

  if (svcError) throw new Error(svcError.message);
  return services || [];
};

interface UpsertServiceData {
  service_id?: string;
  location_id: string;
  name: string;
  description?: string;
  is_addon_only?: boolean;
  is_active?: boolean;
  image_url?: string;
  LessonRegistrationFee?: number;
}

export const upsertService = async (data: UpsertServiceData): Promise<Service | undefined> => {
    const { service_id, location_id, name, description, is_addon_only, is_active, image_url } = data;
    
    if (!location_id) throw new Error('Location ID is required');

    const servicePayload: Partial<Service> = { 
       location_id, name, description, 
       is_addon_only: is_addon_only || false,
       is_active: is_active !== undefined ? is_active : true,
       LessonRegistrationFee: data.LessonRegistrationFee !== undefined ? data.LessonRegistrationFee : 0
    };

    if (image_url) {
        servicePayload.image_url = image_url;
    }
    
    if (service_id) {
       servicePayload.service_id = service_id;
    }

    const { data: svcResult, error: svcError } = await supabase
      .from('service')
      .upsert(servicePayload, { onConflict: 'service_id' })
      .select('*')
      .single();
      
    if (svcError) throw new Error(svcError.message);
    return svcResult;
};

export const getServiceById = async (serviceId: string): Promise<Service | null> => {
   if (!serviceId) throw new Error('Service ID required');

   const { data: service, error: svcError } = await supabase
    .from('service')
    .select('*')
    .eq('service_id', serviceId)
    .single();

   if (svcError) throw new Error(svcError.message);
   return service;
};

export const updateServiceImage = async (serviceId: string, file: UploadedFile): Promise<string> => {
    // 1. Verify service exists
    const service = await getServiceById(serviceId);
    if (!service) throw new Error('Service not found');

    // 2. Upload to Supabase Storage
    const fileExt = file.originalname.split('.').pop();
    const fileName = `services/${serviceId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 3. Get Public URL
    const { data: publicUrlData } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 4. Update Service Record
    const { error: updateError } = await supabase
        .from('service')
        .update({ image_url: publicUrl })
        .eq('service_id', serviceId);

    if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
    }

    return publicUrl;
};

export default {
  getAllServices,
  upsertService,
  getServiceById,
  updateServiceImage
};
