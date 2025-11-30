import AsyncStorage from '@react-native-async-storage/async-storage';

export type DesignDraft = {
  id: string;
  title?: string | null;
  background_key: string;
  style_key: string;
  total_days: number;
  updated_at: string; // ISO
};

const DRAFTS_KEY = 'design_drafts';
const SNAPSHOT_KEY = 'preview_snapshot';

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function getDrafts(): Promise<DesignDraft[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DesignDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDraft(partial: Omit<DesignDraft, 'id' | 'updated_at'> & { id?: string }) {
  const now = new Date().toISOString();
  const drafts = await getDrafts();
  const id = partial.id || genId();
  const next: DesignDraft = {
    id,
    title: partial.title ?? null,
    background_key: partial.background_key,
    style_key: partial.style_key,
    total_days: partial.total_days,
    updated_at: now,
  };
  const idx = drafts.findIndex((d) => d.id === id);
  let out = [...drafts];
  if (idx >= 0) out[idx] = next; else out.push(next);
  // keep only latest 3
  out.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  if (out.length > 3) out = out.slice(0, 3);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(out));
  return next;
}

export async function deleteDraft(id: string) {
  const drafts = await getDrafts();
  const out = drafts.filter((d) => d.id !== id);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(out));
}

export async function setPreviewSnapshot(draft: DesignDraft) {
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(draft));
}

export async function getPreviewSnapshot(): Promise<DesignDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as DesignDraft) : null;
  } catch {
    return null;
  }
}

export async function clearPreviewSnapshot() {
  await AsyncStorage.removeItem(SNAPSHOT_KEY);
}

