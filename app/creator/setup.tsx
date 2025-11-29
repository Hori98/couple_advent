import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useRelationship } from '../../hooks/useRelationship';

const REL_KEY = 'relationship_id';

export default function CreatorSetup() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<14 | 24 | 30>(24);
  const [saving, setSaving] = useState(false);
  const { clear } = useRelationship();

  const create = async () => {
    try {
      setSaving(true);
      const { data: rel, error } = await supabase.rpc('create_relationship_and_join');
      if (error) throw error;
      // set total_days and optional title
      const { error: upErr } = await supabase
        .from('relationships')
        .update({ total_days: days, title: title || null })
        .eq('id', rel.id);
      if (upErr) throw upErr;
      await AsyncStorage.setItem(REL_KEY, rel.id);
      router.replace('/creator');
    } catch (e: any) {
      Alert.alert('作成に失敗しました', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 24 }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>🎄 新しいアドベント</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>タイトルと日数を決めましょう</Text>

      <Text style={{ color: '#fff', marginBottom: 8 }}>タイトル（任意）</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="例: 二人のクリスマス"
        placeholderTextColor="#94a3b8"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 16 }}
      />

      <Text style={{ color: '#fff', marginBottom: 8 }}>日数</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {[14, 24, 30].map((d) => {
          const active = days === d;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => setDays(d as 14 | 24 | 30)}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}
            >
              <Text style={{ color: active ? '#16a34a' : '#fff', fontWeight: active ? '700' as const : '400' }}>{d}日</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity disabled={saving} onPress={create} style={{ backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12 }}>
        <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>{saving ? '作成中...' : '作成する'}</Text>
      </TouchableOpacity>

      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 12 }}>
        エラーが出る場合は、SupabaseのSQLで pgcrypto 拡張を有効化してください（create extension if not exists pgcrypto;）。
      </Text>

      <View style={{ marginTop: 24, gap: 12 }}>
        <TouchableOpacity
          onPress={async () => {
            try {
              await supabase.auth.signOut();
              await clear();
              router.replace('/auth');
            } catch {}
          }}
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ textAlign: 'center', color: '#fff' }}>サインアウト（開発用）</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            try {
              await clear();
            } catch {}
          }}
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ textAlign: 'center', color: '#fff' }}>関係IDをクリア（開発用）</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
