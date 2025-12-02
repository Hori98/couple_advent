import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Entry = {
  id: string;
  relationship_id: string;
  day: number;
  type: 'text' | 'image' | 'youtube' | 'link' | 'video';
  text_content: string | null;
  image_path: string | null;
  youtube_url: string | null;
  link_url: string | null;
  created_at: string;
  updated_at: string;
};

export function useEntries(relationshipId: string | null) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!relationshipId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('advent_entries')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('day', { ascending: true });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEntries((data as Entry[]) ?? []);
  }, [relationshipId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upsert = useCallback(
    async (payload: Omit<Entry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.rpc('upsert_advent_entry', {
        p_relationship: payload.relationship_id,
        p_day: payload.day,
        p_type: payload.type,
        p_text: payload.text_content,
        p_image_path: payload.image_path,
        p_youtube_url: payload.youtube_url,
        p_link_url: (payload as any).link_url ?? null,
      });
      if (error) throw error;
      const entry = data as Entry;
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.relationship_id === entry.relationship_id && e.day === entry.day);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        return [...prev, entry].sort((a, b) => a.day - b.day);
      });
      return entry;
    },
    []
  );

  const getByDay = useCallback(
    async (day: number) => {
      if (!relationshipId) return null;
      const existing = entries.find((e) => e.day === day);
      if (existing) return existing;
      const { data, error } = await supabase
        .from('advent_entries')
        .select('*')
        .eq('relationship_id', relationshipId)
        .eq('day', day)
        .single();
      if (error) {
        // Surface unauthorized errors during preview/debug
        // eslint-disable-next-line no-console
        console.warn('getByDay error', error.message);
        return null;
      }
      return data as Entry;
    },
    [entries, relationshipId]
  );

  return { entries, loading, error, fetchAll, upsert, getByDay };
}
