import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { useRelationship } from '../../hooks/useRelationship';
import { supabase } from '../../lib/supabase';

export default function CreatorShare() {
  const { relationshipId } = useRelationship();
  const [code, setCode] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!relationshipId) return;
      const { data } = await supabase.from('relationships').select('title').eq('id', relationshipId).single();
      if (data?.title) setTitle(data.title);
    })();
  }, [relationshipId]);

  const create = async () => {
    if (!relationshipId) return;
    try {
      setCreating(true);
      const { data, error } = await supabase.rpc('create_share_link', { p_relationship: relationshipId });
      if (error) throw error;
      setCode(data.code);
      if (passcode) {
        await supabase.rpc('set_share_link_passcode', { p_code: data.code, p_passcode: passcode });
      }
    } catch (e: any) {
      Alert.alert('共有リンクの作成に失敗しました', e.message);
    } finally {
      setCreating(false);
    }
  };

  const deeplink = code ? `coupleadvent://share/${code}` : '';
  const shareMessage = title
    ? `「${title}」のアドベントカレンダー🎄\n${deeplink}`
    : `アドベントカレンダー🎄\n${deeplink}`;

  return (
    <View className="flex-1 bg-christmas-night p-6">
      <Text className="text-white text-3xl font-bold mb-2">🔗 共有リンク</Text>
      <Text className="text-white/70 mb-4">受け取る相手にリンクを送ってください</Text>

      <Text className="text-white mb-2">合言葉（任意）</Text>
      <TextInput
        value={passcode}
        onChangeText={setPasscode}
        placeholder="合言葉を設定（未設定可）"
        placeholderTextColor="#94a3b8"
        className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 mb-4"
        secureTextEntry
      />

      <TouchableOpacity disabled={creating || !relationshipId} onPress={create} className="bg-christmas-green py-4 rounded-xl">
        <Text className="text-center text-white font-semibold">{creating ? '作成中...' : '共有リンクを作成'}</Text>
      </TouchableOpacity>

      {code && (
        <View className="mt-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <Text className="text-white">コード: <Text className="font-bold">{code}</Text></Text>
          <Text className="text-white mt-2">Deep Link:</Text>
          <Text className="text-white/80">{deeplink}</Text>
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={async () => {
                try {
                  await Share.share({ message: shareMessage });
                } catch {}
              }}
              className="bg-white/15 px-4 py-3 rounded-xl"
            >
              <Text className="text-white">共有</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
