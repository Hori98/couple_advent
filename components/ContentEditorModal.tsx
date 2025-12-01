import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, Image, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageForDay } from '../lib/storage';
import { supabase } from '../lib/supabase';

type Props = {
  visible: boolean;
  onClose: () => void;
  relationshipId: string;
  day: number;
  // get existing entry and upsert; caller will refresh after save/delete
  load: (day: number) => Promise<any | null>;
  onSaved: () => void;
};

type TypeOption = 'text' | 'image' | 'youtube' | 'link' | 'video' | 'audio' | 'file';

export function ContentEditorModal({ visible, onClose, relationshipId, day, load, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<TypeOption>('text');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!visible) return;
      setLoading(true);
      try {
        const e = await load(day);
        if (e) {
          setType(e.type);
          setMessage(e.text_content ?? '');
          setYoutubeUrl(e.youtube_url ?? '');
          setLinkUrl(e.link_url ?? '');
          if (e.image_path) setImageUri(null); // show placeholder until re-picked
        } else {
          setType('text'); setMessage(''); setYoutubeUrl(''); setLinkUrl(''); setImageUri(null); setImageBase64(null); setImageMime(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, day, load]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9, base64: true });
    if (!result.canceled) {
      const a = result.assets[0];
      setImageUri(a.uri);
      setImageBase64(a.base64 ?? null);
      // @ts-expect-error SDK diff
      setImageMime((a as any).mimeType ?? null);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('権限が必要です'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.8 });
    if (!result.canceled) {
      const a = result.assets[0];
      // @ts-expect-error
      const size = (a as any).fileSize as number | undefined;
      if (size && size > 100 * 1024 * 1024) { Alert.alert('ファイルが大きすぎます（100MBまで）'); return; }
      setMediaUri(a.uri);
      // @ts-expect-error
      setMediaMime((a as any).mimeType || 'video/mp4');
    }
  };

  const pickDocument = async (kind: 'audio' | 'file') => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({ multiple: false, type: kind === 'audio' ? 'audio/*' : '*/*' });
      if (res.canceled) return;
      const f = res.assets[0];
      if (f.size && ((kind==='audio' && f.size > 30*1024*1024) || (kind==='file' && f.size > 20*1024*1024))) {
        Alert.alert('ファイルが大きすぎます', kind==='audio' ? '30MBまで' : '20MBまで');
        return;
      }
      setMediaUri(f.uri);
      setMediaMime(f.mimeType || (kind==='audio' ? 'audio/mpeg' : 'application/octet-stream'));
    } catch {
      Alert.alert('ドキュメント選択が利用できません', 'expo-document-picker を導入してください');
    }
  };

  const pickMediaForType = async () => {
    if (type === 'video') {
      await pickVideo();
      return;
    }
    await pickImage();
  };

  const onSave = async () => {
    try {
      setSaving(true);
      let image_path: string | null = null;
      if (type === 'image' && imageUri) {
        image_path = await uploadImageForDay({ relationshipId, day, uri: imageUri, base64: imageBase64 ?? undefined, mimeType: imageMime });
      }
      if ((type === 'video' || type === 'audio' || type === 'file') && mediaUri && mediaMime) {
        // NOTE: backendはimage_pathを汎用のmedia pathとして利用（SQL拡張前の暫定）
        const { uploadMediaForDay } = await import('../lib/storage');
        image_path = await uploadMediaForDay({ relationshipId, day, uri: mediaUri, mimeType: mediaMime, kind: type });
      }
      const { error } = await supabase.rpc('upsert_advent_entry', {
        p_relationship: relationshipId,
        p_day: day,
        p_type: type,
        p_text: message || null,
        p_image_path: (type === 'image' || type === 'video' || type === 'audio' || type === 'file') ? image_path : null,
        p_youtube_url: type === 'youtube' ? youtubeUrl : null,
        p_link_url: type === 'link' ? linkUrl : null,
      });
      if (error) throw error;
      onSaved();
      onClose();
      Alert.alert('保存しました');
    } catch (e: any) {
      Alert.alert('保存に失敗しました', e.message);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    Alert.alert(
      '削除しますか？',
      'この日のコンテンツを削除します。元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const { error } = await supabase
                .from('advent_entries')
                .delete()
                .eq('relationship_id', relationshipId)
                .eq('day', day);
              if (error) throw error;
              onSaved();
              onClose();
              Alert.alert('削除しました');
            } catch (e: any) {
              Alert.alert('削除に失敗しました', e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 6 }}>
          <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ width: '100%' }}>
            <View style={{
              backgroundColor: 'rgba(15,23,42,0.98)',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              height: 640, // 固定高さ
              width: '96%',
              alignSelf: 'center'
            }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{day}日目の編集</Text>
              <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
                {/* スライド可能タブバー（横スクロール） */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {(['text', 'image', 'video', 'youtube', 'link', 'audio', 'file'] as TypeOption[]).map((t) => {
                    const active = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)',
                          borderWidth: active ? 0 : 1,
                          borderColor: 'rgba(255,255,255,0.15)'
                        }}
                      >
                        <Text style={{ color: active ? '#16a34a' : '#fff', fontWeight: active ? '700' as const : '500' }}>{t}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

            {(type === 'image' || type === 'video') && (
              <TouchableOpacity onPress={pickMediaForType} activeOpacity={0.85}>
                {type === 'image' ? (
                  imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: 12 }} />
                  ) : (
                    <View style={{ height: 180, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                      <Text style={{ color: '#cbd5e1' }}>画像を追加＋（タップして選択）</Text>
                    </View>
                  )
                ) : mediaUri ? (
                  <View style={{ height: 200, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ color: '#cbd5e1' }}>動画を追加しました（タップで再選択）</Text>
                  </View>
                ) : (
                  <View style={{ height: 180, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ color: '#cbd5e1' }}>動画を追加＋（タップして選択）</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {type === 'audio' && (
              <View>
                <View style={{ height: 100, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#cbd5e1' }}>{mediaUri ? '音声をアップロードします' : '音声が未選択です'}</Text>
                </View>
                <TouchableOpacity onPress={() => pickDocument('audio')} style={{ backgroundColor: '#fff', paddingVertical: 10, borderRadius: 12, marginTop: 8 }}>
                  <Text style={{ textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>音声を選択</Text>
                </TouchableOpacity>
              </View>
            )}

            {type === 'file' && (
              <View>
                <View style={{ height: 100, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#cbd5e1' }}>{mediaUri ? 'ファイルをアップロードします' : 'ファイルが未選択です'}</Text>
                </View>
                <TouchableOpacity onPress={() => pickDocument('file')} style={{ backgroundColor: '#fff', paddingVertical: 10, borderRadius: 12, marginTop: 8 }}>
                  <Text style={{ textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>ファイルを選択</Text>
                </TouchableOpacity>
              </View>
            )}

            {type === 'youtube' && (
              <TextInput
                placeholder="YouTubeのURL"
                placeholderTextColor="#94a3b8"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
              />
            )}

            {type === 'link' && (
              <TextInput
                placeholder="リンクURL（ギフト/外部サイトなど）"
                placeholderTextColor="#94a3b8"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
              />
            )}

            {/* メッセージエリア */}
            <View>
              {type !== 'text' ? (
                <>
                  <TouchableOpacity
                    onPress={() => setShowMessage((v) => !v)}
                    style={{ paddingVertical: 8, alignSelf: 'flex-end' }}
                  >
                    <Text style={{ color: '#fff', textDecorationLine: 'underline' }}>
                      {showMessage ? 'メッセージを隠す' : 'メッセージをつける'}
                    </Text>
                  </TouchableOpacity>
                  {showMessage && (
                    <TextInput
                      multiline
                      placeholder="メッセージ（任意）"
                      placeholderTextColor="#94a3b8"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minHeight: 100 }}
                      value={message}
                      onChangeText={setMessage}
                    />
                  )}
                </>
              ) : (
                <TextInput
                  multiline
                  placeholder="メッセージ（任意）"
                  placeholderTextColor="#94a3b8"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minHeight: 100 }}
                  value={message}
                  onChangeText={setMessage}
                />
              )}
            </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity disabled={saving} onPress={onSave} style={{ flex: 1, backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>{saving ? '保存中...' : '保存する'}</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={saving} onPress={onClose} style={{ paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: '#fff' }}>閉じる</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={saving} onPress={onDelete} style={{ paddingHorizontal: 16, backgroundColor: 'rgba(239,68,68,0.9)', paddingVertical: 12, borderRadius: 12 }}>
                  <Text style={{ color: '#fff' }}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
