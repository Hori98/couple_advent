import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Share, Alert, TextInput, Modal } from 'react-native';
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
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishStep, setFinishStep] = useState<'choice'|'passcode'|'done'>('choice');
  const [finishLink, setFinishLink] = useState<string | null>(null);

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

      {/* 作成完了フローティングボタン */}
      <View style={{ position: 'absolute', right: 16, bottom: 24 }}>
        <TouchableOpacity onPress={() => { setFinishOpen(true); setFinishStep('choice'); setFinishLink(null); }} style={{ backgroundColor: '#16a34a', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>作成完了</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={finishOpen} transparent animationType="fade" onRequestClose={() => setFinishOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: 'rgba(15,23,42,0.98)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            {finishStep === 'choice' && (
              <View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>作成を完了しますか？</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>合言葉を設定して共有、または作り直しが選べます。</Text>
                <TouchableOpacity onPress={() => setFinishStep('passcode')} style={{ backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, marginBottom: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>合言葉を決める</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.replace('/creator/setup')} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>作り直す</Text>
                </TouchableOpacity>
              </View>
            )}

            {finishStep === 'passcode' && (
              <View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>合言葉を設定</Text>
                <TextInput
                  value={passcode}
                  onChangeText={setPasscode}
                  placeholder="合言葉を入力"
                  placeholderTextColor="#94a3b8"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 }}
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!relationshipId) return;
                    try {
                      // リンク新規発行
                      const { data, error } = await supabase.rpc('create_share_link', { p_relationship: relationshipId });
                      if (error) throw error;
                      if (passcode) {
                        await supabase.rpc('set_share_link_passcode', { p_code: data.code, p_passcode: passcode });
                      }
                      const url = `coupleadvent://share/${data.code}`;
                      setFinishLink(url);
                      setFinishStep('done');
                    } catch (e: any) {
                      Alert.alert('設定に失敗しました', e.message);
                    }
                  }}
                  style={{ backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12 }}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>決定</Text>
                </TouchableOpacity>
              </View>
            )}

            {finishStep === 'done' && (
              <View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>共有リンク</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>{finishLink}</Text>
                <TouchableOpacity onPress={async () => { if (finishLink) await Share.share({ message: `アドベントカレンダー🎄\n${finishLink}` }); }} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, marginBottom: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>共有</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFinishOpen(false)} style={{ backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>閉じる</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
