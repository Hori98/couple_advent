import { supabase } from './supabase';

// Upload an image from a local URI to Supabase Storage under the relationship/day path.
// Returns the storage path (not a public URL).
export async function uploadImageForDay(params: {
  relationshipId: string;
  day: number;
  uri: string;
}) {
  const { relationshipId, day, uri } = params;
  const res = await fetch(uri);
  const blob = await res.blob();

  const ext = (blob.type && blob.type.split('/')[1]) || uri.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const path = `relationships/${relationshipId}/${day}/${fileName}`;

  const { error } = await supabase.storage
    .from('advent-media')
    .upload(path, blob as any, {
      contentType: blob.type || 'image/jpeg',
      upsert: true,
      // Newer SDKs support metadata; harmless if ignored.
      // @ts-ignore - metadata may not exist on older versions
      metadata: { relationship_id: relationshipId, day },
    } as any);

  if (error) throw error;
  return path;
}

export async function getSignedUrl(path: string, expiresIn = 60 * 60) {
  const { data, error } = await supabase.storage
    .from('advent-media')
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

