import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Share, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useRelationship } from '../../hooks/useRelationship';
import { supabase } from '../../lib/supabase';
import { LayoutFrame } from '../../components/LayoutFrame';
import { AdventPreview } from '../../components/AdventPreview';
import { ContentEditorModal } from '../../components/ContentEditorModal';
import { useEntries } from '../../hooks/useEntries';

function buildDays(n: number) { return Array.from({ length: n }, (_, i) => i + 1); }

export default function CreatorHome() {
  const router = useRouter();
  const { relationshipId } = useRelationship();
  const { entries, fetchAll } = useEntries(relationshipId);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [totalDays, setTotalDays] = useState<number>(24);
  const [backgroundKey, setBackgroundKey] = useState<string>('background_1');
  const [styleKey, setStyleKey] = useState<string>('box_white');
  const [savingDays, setSavingDays] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishStep, setFinishStep] = useState<'choice'|'passcode'|'done'>('choice');
  const [finishLink, setFinishLink] = useState<string | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [tmpBackground, setTmpBackground] = useState<string>('background_1');
  const [tmpStyle, setTmpStyle] = useState<string>('box_white');
  const [tmpDays, setTmpDays] = useState<number>(24);
  const [editDay, setEditDay] = useState<number | null>(null);

  useEffect(() => {
    // 初期ロード中（null）のときはリダイレクトしない
    if (relationshipId === null) return;
    if (!relationshipId) router.replace('/pair');
  }, [relationshipId, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const Header = null;

  const Footer = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <TouchableOpacity onPress={() => router.replace('/creator/setup')} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 }}>
        <Text style={{ color: '#fff' }}>作り直す</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          const filled = new Set(entries.map(e => e.day)).size;
          if (filled < totalDays) {
            Alert.alert(
              '未登録のコンテンツがあります',
              `登録済み: ${filled} / ${totalDays}\nこのまま共有を作成しますか？`,
              [
                { text: '戻る', style: 'cancel' },
                { text: 'それでも作成', style: 'default', onPress: () => { setFinishOpen(true); setFinishStep('choice'); setFinishLink(null); } },
              ]
            );
          } else {
            setFinishOpen(true); setFinishStep('choice'); setFinishLink(null);
          }
        }}
        style={{ backgroundColor: '#16a34a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>作成完了</Text>
      </TouchableOpacity>
    </View>
  );

  // 初期設定をDBから取得
  useEffect(() => {
    (async () => {
      if (!relationshipId) return;
      try {
        const { data, error } = await supabase
          .from('relationships')
          .select('total_days, background_key, style_key')
          .eq('id', relationshipId)
          .single();
        if (!error && data) {
          if (data.total_days) setTotalDays(data.total_days);
          if (data.background_key) setBackgroundKey(data.background_key);
          if (data.style_key) setStyleKey(data.style_key);
          setTmpDays(data.total_days ?? 24);
          setTmpBackground(data.background_key ?? 'background_1');
          setTmpStyle(data.style_key ?? 'box_white');
        }
      } catch {}
    })();
  }, [relationshipId]);

  return (
    <LayoutFrame header={Header} footer={Footer} backgroundColor="#0f172a">

      {/* 統合プレビュー（背景・スタイル・日数）: メイン領域いっぱい（横余白もフルブリード） */}
      <View style={{ flex: 1, borderRadius: 0, overflow: 'hidden', marginHorizontal: -16 }}>
        <AdventPreview
          backgroundKey={backgroundKey}
          styleKey={styleKey}
          totalDays={totalDays}
          completedDays={entries.map(e => e.day)}
          onPressDay={(day) => setEditDay(day)}
        />
      </View>

      {/* デザイン設定モーダル */}
      <Modal visible={designOpen} transparent animationType="fade" onRequestClose={() => setDesignOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'rgba(15,23,42,0.98)', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>デザイン設定</Text>
            <Text style={{ color: '#fff', marginBottom: 8 }}>背景</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {['background_1','background_2','background_3','background_vertical_1','background_vertical_2','background_vertical_3'].map((k) => {
                const active = tmpBackground === k;
                return (
                  <TouchableOpacity key={k} onPress={() => setTmpBackground(k)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: active ? '#16a34a' : '#fff' }}>{k.replace('background','bg')}</Text>
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
                const active = tmpStyle === key;
                return (
                  <TouchableOpacity key={key} onPress={() => setTmpStyle(key)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: active ? '#16a34a' : '#fff' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: '#fff', marginBottom: 8 }}>日数</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {[14,24,30].map((d) => {
                const active = tmpDays === d;
                return (
                  <TouchableOpacity key={d} onPress={() => setTmpDays(d)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: active ? '#16a34a' : '#fff', fontWeight: active ? '700' as const : '400' }}>{d}日</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* プレビューの即時反映: 下の行で現在値を更新 */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={async () => {
                  if (!relationshipId) { setDesignOpen(false); return; }
                  try {
                    const { error } = await supabase
                      .from('relationships')
                      .update({ background_key: tmpBackground, style_key: tmpStyle, total_days: tmpDays })
                      .eq('id', relationshipId);
                    if (error) throw error;
                    setBackgroundKey(tmpBackground);
                    setStyleKey(tmpStyle);
                    setTotalDays(tmpDays);
                    setDesignOpen(false);
                  } catch (e: any) {
                    Alert.alert('保存に失敗しました', e.message);
                  }
                }}
                style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTmpBackground(backgroundKey); setTmpStyle(styleKey); setTmpDays(totalDays); setDesignOpen(false); }} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* コンテンツ編集モーダル */}
      {relationshipId && (
        <ContentEditorModal
          visible={editDay != null}
          onClose={() => setEditDay(null)}
          relationshipId={relationshipId}
          day={editDay ?? 1}
          load={async (d) => entries.find(e => e.day === d) ?? (await (async () => { return null; })())}
          onSaved={() => fetchAll()}
        />
      )}
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
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      if (!finishLink) return;
                      try {
                        const Clipboard = (await import('expo-clipboard')) as any;
                        if (Clipboard?.setStringAsync) {
                          await Clipboard.setStringAsync(finishLink);
                          Alert.alert('コピーしました');
                          return;
                        }
                      } catch {}
                      // Fallback: system share
                      await Share.share({ message: `アドベントカレンダー🎄\n${finishLink}` });
                    }}
                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, marginBottom: 8 }}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>コピー</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => { if (finishLink) await Share.share({ message: `アドベントカレンダー🎄\n${finishLink}` }); }} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#fff', textAlign: 'center' }}>共有</Text>
                  </TouchableOpacity>
                </View>
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
