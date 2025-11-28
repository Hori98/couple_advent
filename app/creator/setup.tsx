import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

const REL_KEY = 'relationship_id';

export default function CreatorSetup() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<14 | 24 | 30>(24);
  const [saving, setSaving] = useState(false);

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
    <View className="flex-1 bg-christmas-night p-6">
      <Text className="text-white text-3xl font-bold mb-2">🎄 新しいアドベント</Text>
      <Text className="text-white/70 mb-4">タイトルと日数を決めましょう</Text>

      <Text className="text-white mb-2">タイトル（任意）</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="例: 二人のクリスマス"
        placeholderTextColor="#94a3b8"
        className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 mb-4"
      />

      <Text className="text-white mb-2">日数</Text>
      <View className="flex-row gap-3 mb-6">
        {[14, 24, 30].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDays(d as 14 | 24 | 30)}
            className={`px-4 py-2 rounded-xl ${days === d ? 'bg-white' : 'bg-white/10'}`}
          >
            <Text className={days === d ? 'text-christmas-green font-semibold' : 'text-white'}>{d}日</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity disabled={saving} onPress={create} className="bg-christmas-green py-4 rounded-xl">
        <Text className="text-center text-white font-semibold">{saving ? '作成中...' : '作成する'}</Text>
      </TouchableOpacity>
    </View>
  );
}

