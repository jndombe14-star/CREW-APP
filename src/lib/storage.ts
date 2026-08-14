import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import type { MediaType } from '@/lib/database.types';

async function pickMedia(mediaTypes: ('images' | 'videos')[]): Promise<ImagePicker.ImagePickerAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Accès aux photos refusé. Active-le dans les réglages pour continuer.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes,
    quality: 0.8,
    allowsEditing: mediaTypes.length === 1 && mediaTypes[0] === 'images',
    videoMaxDuration: 60,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return result.assets[0];
}

async function uploadAsset(bucket: 'avatars' | 'portfolio', ownerId: string, asset: ImagePicker.ImagePickerAsset) {
  const extension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${ownerId}/${Date.now()}.${extension}`;

  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: asset.mimeType ?? (asset.type === 'video' ? `video/${extension}` : `image/${extension}`),
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function pickAndUploadImage(bucket: 'avatars' | 'portfolio', ownerId: string): Promise<string | null> {
  const asset = await pickMedia(['images']);
  if (!asset) return null;
  return uploadAsset(bucket, ownerId, asset);
}

export async function pickAndUploadPortfolioMedia(
  ownerId: string
): Promise<{ url: string; mediaType: MediaType } | null> {
  const asset = await pickMedia(['images', 'videos']);
  if (!asset) return null;
  const url = await uploadAsset('portfolio', ownerId, asset);
  return { url, mediaType: asset.type === 'video' ? 'video' : 'photo' };
}
