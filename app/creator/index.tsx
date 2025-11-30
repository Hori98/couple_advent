import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Share, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useRelationship } from '../../hooks/useRelationship';
import { supabase } from '../../lib/supabase';
import { AdventCanvas } from '../../components/AdventCanvas';
import { LayoutFrame } from '../../components/LayoutFrame';

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

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
      <View>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>コンテンツ登録</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>編集したい日を選んでください</Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{totalDays} days</Text>
    </View>
  );

  const Footer = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <TouchableOpacity onPress={() => router.replace('/creator/setup')} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 }}>
        <Text style={{ color: '#fff' }}>作り直す</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setFinishOpen(true); setFinishStep('choice'); setFinishLink(null); }} style={{ backgroundColor: '#16a34a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>作成完了</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LayoutFrame header={Header} footer={Footer} backgroundColor="#0f172a">

      {/* AdventCanvas の仮当て込み（背景 + オーナメント1件） */}
      <View style={{ flex: 1 }}>
        <AdventCanvas
        background={require('../../assets/christmas-tree_background.png')}
        hotspots={[
          { day: 1, x: 0.5 - 0.08, y: 0.35, w: 0.16, h: 0.16, icon: require('../../assets/christmas-decoration_1.png') },
        ]}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, marginBottom: 12 }}>
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
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: totalDays === d ? '#fff' : 'rgba(255,255,255,0.1)' }}
          >
            <Text style={{ color: totalDays === d ? '#16a34a' : '#fff', fontWeight: totalDays === d ? '700' as const : '400' }}>{d}日</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 共有してシェア（即時）は削除。完了モーダルからのみ共有 */}

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
            <View style={{ aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.9)' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#16a34a' }}>{item}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 作成完了フローティングボタン */}
      {/* Footerで完了ボタンを固定表示しているため削除 */}

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
                <TouchableOpacity onPress={() => setFinishStep('choice')} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 12, marginTop: 8 }}>
                  <Text style={{ color: '#fff', textAlign: 'center' }}>戻る</Text>
                </TouchableOpacity>
              </View>
            )}

            {finishStep === 'done' && (
              <View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>共有リンク</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>{finishLink}</Text>
                {/* コピーは後でexpo-clipboard導入時に対応。今は共有のみ */}
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
    </LayoutFrame>
  );
}
