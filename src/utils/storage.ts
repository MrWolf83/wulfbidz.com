import { supabase } from '../lib/supabase';

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadListingPhoto(file: File, listingId: string, position: number): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${listingId}/${position}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('listing-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('listing-photos')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path
  };
}

export async function uploadListingVideo(file: File, listingId: string, position: number): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${listingId}/video-${position}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('listing-videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('listing-videos')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path
  };
}

export async function uploadProfilePhoto(file: File, userId: string, photoType: 'profile' | 'id_front' | 'id_back'): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${photoType}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload ${photoType} photo: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path
  };
}

export async function deleteListingPhotos(listingId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from('listing-photos')
    .list(listingId);

  if (listError) {
    console.error('Error listing files for deletion:', listError);
    return;
  }

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${listingId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('listing-photos')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting listing photos:', deleteError);
    }
  }
}

export async function deleteListingVideos(listingId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from('listing-videos')
    .list(listingId);

  if (listError) {
    console.error('Error listing videos for deletion:', listError);
    return;
  }

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${listingId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('listing-videos')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting listing videos:', deleteError);
    }
  }
}

export function validateImageFile(file: File): string | null {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, or WebP)';
  }

  if (file.size > maxSize) {
    return 'Image file size must be less than 5MB';
  }

  return null;
}

export function validateVideoFile(file: File): string | null {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

  if (!allowedTypes.includes(file.type)) {
    return 'Please upload a valid video file (MP4, MOV, AVI, or WebM)';
  }

  if (file.size > maxSize) {
    return 'Video file size must be less than 50MB';
  }

  return null;
}
