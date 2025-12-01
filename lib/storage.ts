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
  uri?: string; // RNのファイルURI（推奨）
  base64?: string; // 予備
  mimeType?: string | null;
}) {
  const { relationshipId, day, uri, base64, mimeType } = params;
  let ext = 'jpg';
  if (mimeType) {
    const guessed = mimeType.split('/')[1];
    if (guessed) ext = guessed;
  } else if (uri) {
    const uext = uri.split('.').pop();
    if (uext) ext = uext;
  }

  if (!uri && !base64) throw new Error('No image data');

  const fileName = `${Date.now()}.${ext}`;
  const path = `relationships/${relationshipId}/${day}/images/${fileName}`;

  // In React Native, pass a file-like object with uri/name/type to upload via FormData
  // Prefer uri from ImagePicker; avoid Blob/ArrayBuffer in RN where not fully supported.
  const file: any = uri
    ? { uri, name: fileName, type: mimeType || `image/${ext}` }
    : { uri: `data:${mimeType || `image/${ext}`};base64,${base64}`, name: fileName, type: mimeType || `image/${ext}` };

  const { error } = await supabase.storage
    .from('advent-media')
    .upload(path, file, {
      contentType: mimeType || `image/${ext}`,
      upsert: true,
    } as any);

  if (error) throw error;
  return path;
}

export async function uploadMediaForDay(params: {
  relationshipId: string;
  day: number;
  uri: string;
  mimeType: string;
  kind: 'image' | 'video' | 'audio' | 'file';
}) {
  const { relationshipId, day, uri, mimeType, kind } = params;
  const ext = (mimeType.split('/')[1] || 'bin').split(';')[0];
  const fileName = `${Date.now()}.${ext}`;
  const sub = kind === 'image' ? 'images' : kind === 'video' ? 'videos' : kind === 'audio' ? 'audios' : 'files';
  const path = `relationships/${relationshipId}/${day}/${sub}/${fileName}`;

  const file: any = { uri, name: fileName, type: mimeType };
  const { error } = await supabase.storage
    .from('advent-media')
    .upload(path, file, { contentType: mimeType, upsert: true } as any);
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
