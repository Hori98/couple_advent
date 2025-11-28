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
      const { data, error } = await supabase
        .from('advent_entries')
        .upsert(payload as any)
        .select('*')
        .single();
      if (error) throw error;
      setEntries((prev) => {
        const idx = prev.findIndex(
          (e) => e.relationship_id === payload.relationship_id && e.day === payload.day
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = data as Entry;
          return next;
        }
        return [...prev, data as Entry].sort((a, b) => a.day - b.day);
      });
      return data as Entry;
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
      if (error) return null;
      return data as Entry;
    },
    [entries, relationshipId]
  );

  return { entries, loading, error, fetchAll, upsert, getByDay };
}
