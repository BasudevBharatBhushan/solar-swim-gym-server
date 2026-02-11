import SignedWaiverRepository from '../repositories/SignedWaiverRepository';
import { SignedWaiver } from '../types';
// In a real scenario, we might move storage logic here or keep it in controller if simply returning a signed URL.
// Since the requirement is to return a public URL after upload, the controller can handle the file upload via Multer 
// and then upload to Supabase Storage, or the service can handle buffer upload.
// For now, let's assume the controller handles the file processing and passes the buffer.

import supabase from '../config/db';

export const uploadSignature = async (fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> => {
  const bucketName = 'signed-waivers';
  
  // Create a unique path: timestamp_filename
  const filePath = `${Date.now()}_${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

export const upsertSignedWaiver = async (data: Partial<SignedWaiver>): Promise<SignedWaiver> => {
  // Validate required fields relationally if needed, but DB checks FKs.
  // We can add logic here to verify profile belongs to location if not strictly enforced by RLS yet.
  
  return await SignedWaiverRepository.upsertSignedWaiver(data);
};

export const getSignedWaivers = async (profileId: string, locationId: string): Promise<SignedWaiver[]> => {
  return await SignedWaiverRepository.getSignedWaiversByProfile(profileId, locationId);
};

export const linkProfileToWaiver = async (signedWaiverId: string, profileId: string, locationId: string): Promise<SignedWaiver> => {
  return await SignedWaiverRepository.updateProfileId(signedWaiverId, profileId, locationId);
};

export default {
  uploadSignature,
  upsertSignedWaiver,
  getSignedWaivers,
  linkProfileToWaiver
};
