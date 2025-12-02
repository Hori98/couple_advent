import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useRelationship } from '../../hooks/useRelationship';
import { AdventPreview } from '../../components/AdventPreview';
import { getPreviewSnapshot } from '../../lib/drafts';

const backgroundOptions = ['background_1','background_2','background_3','background_vertical_1','background_vertical_2','background_vertical_3'];

const REL_KEY = 'relationship_id';

export default function CreatorSetup() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [days, setDays] = useState<14 | 24 | 30>(24);
  const [backgroundKey, setBackgroundKey] = useState<string>('background_1');
  const [styleKey, setStyleKey] = useState<string>('box_white');
  const [saving, setSaving] = useState(false);
  const { clear } = useRelationship();

  // プレビュー選択画面から渡された下書きを初期値として適用
  useEffect(() => {
    (async () => {
      try {
        const snap = await getPreviewSnapshot();
        if (snap) {
          setTitle(snap.title ?? '');
          setDays((snap.total_days as 14 | 24 | 30) ?? 24);
          setBackgroundKey(snap.background_key);
          setStyleKey(snap.style_key);
        }
      } catch {}
    })();
  }, []);

  const create = async () => {
    try {
      setSaving(true);
      // 新RPC（タイトル/日数/背景/スタイル）
      const { data: rel, error } = await supabase.rpc('create_relationship_with_days', {
        p_title: title,
        p_total_days: days,
        p_background_key: backgroundKey,
        p_style_key: styleKey,
      });
      if (error) throw error;
      await AsyncStorage.setItem(REL_KEY, rel.id);
      router.replace('/creator');
    } catch (e: any) {
      Alert.alert('作成に失敗しました', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>🎄 アドベントを作成</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>タイトル・背景・スタイル・日数を選択し、プレビューを確認</Text>

      <Text style={{ color: '#fff', marginBottom: 8 }}>タイトル（任意）</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="例: 二人のクリスマス"
        placeholderTextColor="#94a3b8"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 16 }}
      />

      <Text style={{ color: '#fff', marginBottom: 8 }}>背景</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {backgroundOptions.map((k, idx) => {
          const active = backgroundKey === k;
          return (
            <TouchableOpacity key={k} onPress={() => setBackgroundKey(k)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: active ? '#16a34a' : '#fff' }}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ color: '#fff', marginBottom: 8 }}>スタイル</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'box_red', label: '赤ボックス' },
          { key: 'box_green', label: '緑ボックス' },
          { key: 'box_white', label: '白ボックス' },
        ].map(({ key, label }) => {
          const active = styleKey === key;
          return (
            <TouchableOpacity key={key} onPress={() => setStyleKey(key)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: active ? '#16a34a' : '#fff' }}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

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

        <View style={{ height: 360, borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <AdventPreview backgroundKey={backgroundKey} styleKey={styleKey} totalDays={days} onPressDay={() => {}} />
        </View>

        <TouchableOpacity disabled={saving} onPress={create} style={{ backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 12 }}>
          <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>{saving ? '作成中...' : '作成する'}</Text>
        </TouchableOpacity>

        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 12 }}>
          作成後はプレビュー上の番号をタップしてコンテンツを登録できます。
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
      </ScrollView>
    </View>
  );
}
