import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const KEY = 'relationship_id';

export function useRelationship() {
  const [relationshipId, setRelationshipId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setRelationshipId(v);
    });
  }, []);

  const create = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('create_relationship_and_join');
    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    if (data) {
      await AsyncStorage.setItem(KEY, data.id);
      setRelationshipId(data.id);
      setInviteCode(data.invite_code ?? null);
    }
    return data;
  }, []);

  const join = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('join_relationship_by_code', { p_code: code.trim() });
    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    if (data) {
      await AsyncStorage.setItem(KEY, data.id);
      setRelationshipId(data.id);
    }
    return data;
  }, []);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setRelationshipId(null);
    setInviteCode(null);
  }, []);

  return { relationshipId, inviteCode, loading, error, create, join, clear };
}

