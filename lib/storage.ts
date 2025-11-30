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
  const arrayBuffer = await res.arrayBuffer();
  const ext = uri.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const path = `relationships/${relationshipId}/${day}/${fileName}`;

  const { error } = await supabase.storage
    .from('advent-media')
    // RN環境ではArrayBufferアップロードが安定
    .upload(path, arrayBuffer as any, {
      contentType: `image/${ext}`,
      upsert: true,
      // パスベースのRLSに切替済みのためmetadataは不要
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
