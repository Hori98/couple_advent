import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Share, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useRelationship } from '../../hooks/useRelationship';
import { supabase } from '../../lib/supabase';

const days = Array.from({ length: 24 }, (_, i) => i + 1);

export default function CreatorHome() {
  const router = useRouter();
  const { relationshipId } = useRelationship();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [totalDays, setTotalDays] = useState<number>(24);
  const [savingDays, setSavingDays] = useState(false);
  const [passcode, setPasscode] = useState('');

  useEffect(() => {
    // 初期ロード中（null）のときはリダイレクトしない
    if (relationshipId === null) return;
    if (!relationshipId) router.replace('/pair');
  }, [relationshipId, router]);

  return (
    <View className="flex-1 bg-christmas-night p-4">
      <Text className="text-white text-2xl font-bold mb-2">コンテンツ登録</Text>
      <Text className="text-white/80 mb-3">編集したい日を選んでください</Text>

      <View className="flex-row gap-3 mb-4">
        {[14,24,30].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={async () => {
              if (!relationshipId) return;
              try {
                setSavingDays(true);
                // 要: RLSでrelationshipsのupdate許可（後述SQL）
                const { error } = await supabase
                  .from('relationships')
                  .update({ total_days: d })
                  .eq('id', relationshipId);
                if (error) throw error;
                setTotalDays(d);
              } catch (e: any) {
                Alert.alert('更新に失敗しました', e.message);
              } finally {
                setSavingDays(false);
              }
            }}
            className={`px-4 py-2 rounded-xl ${totalDays === d ? 'bg-white' : 'bg-white/10'}`}
          >
            <Text className={totalDays === d ? 'text-christmas-green font-semibold' : 'text-white'}>
              {d}日
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        disabled={creating || !relationshipId}
        onPress={async () => {
          if (!relationshipId) return;
          try {
            setCreating(true);
            const { data, error } = await supabase.rpc('create_share_link', {
              p_relationship: relationshipId,
            });
            if (error) throw error;
            setLinkCode(data.code);
            // Optionally set passcode if entered
            if (passcode && passcode.length > 0) {
              await supabase.rpc('set_share_link_passcode', { p_code: data.code, p_passcode: passcode });
            }
            const url = `coupleadvent://share/${data.code}`;
            await Share.share({ message: `アドベントカレンダーが届きました🎄\n${url}` });
          } catch (e: any) {
            Alert.alert('共有リンクの作成に失敗しました', e.message);
          } finally {
            setCreating(false);
          }
        }}
        className="mb-4 bg-christmas-red py-3 rounded-xl"
      >
        <Text className="text-center text-white font-semibold">
          {creating ? '作成中...' : '共有リンクを発行してシェア'}
        </Text>
      </TouchableOpacity>
      {linkCode && (
        <Text className="text-white/80 mb-2">コード: {linkCode}</Text>
      )}

      <View className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
        <Text className="text-white mb-2">合言葉（任意・共有リンク保護）</Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={passcode}
            onChangeText={setPasscode}
            placeholder="合言葉（未設定可）"
            placeholderTextColor="#94a3b8"
            className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20"
            secureTextEntry
          />
        </View>
      </View>
      <FlatList
        data={days}
        keyExtractor={(d) => String(d)}
        numColumns={4}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ flex: 1 / 4 }} onPress={() => router.push(`/creator/edit/${item}`)}>
            <View className="aspect-square rounded-xl items-center justify-center bg-white/90">
              <Text className="text-2xl font-bold text-christmas-green">{item}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
