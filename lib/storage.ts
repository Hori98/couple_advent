import { supabase } from './supabase';

function base64ToBytes(b64: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let bufferLength = (b64.length / 4) * 3;
  if (b64.endsWith('==')) bufferLength -= 2;
  else if (b64.endsWith('=')) bufferLength -= 1;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;
  for (let i = 0; i < b64.length; i += 4) {
    encoded1 = alphabet.indexOf(b64[i]);
    encoded2 = alphabet.indexOf(b64[i + 1]);
    encoded3 = alphabet.indexOf(b64[i + 2]);
    encoded4 = alphabet.indexOf(b64[i + 3]);
    const chr1 = (encoded1 << 2) | (encoded2 >> 4);
    const chr2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    const chr3 = ((encoded3 & 3) << 6) | encoded4;
    bytes[p++] = chr1;
    if (encoded3 !== 64 && p < bufferLength) bytes[p++] = chr2;
    if (encoded4 !== 64 && p < bufferLength) bytes[p++] = chr3;
  }
  return bytes;
}

// Upload an image from a local URI to Supabase Storage under the relationship/day path.
// Returns the storage path (not a public URL).
export async function uploadImageForDay(params: {
  relationshipId: string;
  day: number;
  uri?: string;
  base64?: string; // ImagePickerでbase64を取得した場合はこちらを優先
  mimeType?: string | null;
}) {
  const { relationshipId, day, uri, base64, mimeType } = params;
  let bytes: Uint8Array;
  let ext = 'jpg';
  if (mimeType) {
    const guessed = mimeType.split('/')[1];
    if (guessed) ext = guessed;
  } else if (uri) {
    const uext = uri.split('.').pop();
    if (uext) ext = uext;
  }

  if (base64) {
    bytes = base64ToBytes(base64);
  } else if (uri) {
    // fetch(uri) は一部環境で失敗することがあるため、base64を推奨
    const res = await fetch(uri);
    const ab = await res.arrayBuffer();
    bytes = new Uint8Array(ab);
  } else {
    throw new Error('No image data');
  }

  const fileName = `${Date.now()}.${ext}`;
  const path = `relationships/${relationshipId}/${day}/${fileName}`;

  // React NativeではBlob経由が安定
  const blob = new Blob([bytes], { type: mimeType || `image/${ext}` });

  const { error } = await supabase.storage
    .from('advent-media')
    .upload(path, blob as any, {
      contentType: mimeType || `image/${ext}`,
      upsert: true,
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
