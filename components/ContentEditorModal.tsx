import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, Image, Alert, ScrollView } from 'react-native';
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

type TypeOption = 'text' | 'image' | 'youtube' | 'link';

export function ContentEditorModal({ visible, onClose, relationshipId, day, load, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<TypeOption>('text');
  const [message, setMessage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
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

  const onSave = async () => {
    try {
      setSaving(true);
      let image_path: string | null = null;
      if (type === 'image' && imageUri) {
        image_path = await uploadImageForDay({ relationshipId, day, uri: imageUri, base64: imageBase64 ?? undefined, mimeType: imageMime });
      }
      const { error } = await supabase.rpc('upsert_advent_entry', {
        p_relationship: relationshipId,
        p_day: day,
        p_type: type,
        p_text: type === 'text' ? message : null,
        p_image_path: type === 'image' ? image_path : null,
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
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: 'rgba(15,23,42,0.98)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: '90%' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{day}日目の編集</Text>
          <ScrollView contentContainerStyle={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['text', 'image', 'youtube', 'link'] as TypeOption[]).map((t) => {
                const active = type === t;
                return (
                  <TouchableOpacity key={t} onPress={() => setType(t)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: active ? '#16a34a' : '#fff' }}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {type === 'text' && (
              <TextInput
                multiline
                placeholder="メッセージ"
                placeholderTextColor="#94a3b8"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minHeight: 120 }}
                value={message}
                onChangeText={setMessage}
              />
            )}

            {type === 'image' && (
              <View>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: 12 }} />
                ) : (
                  <View style={{ height: 160, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#cbd5e1' }}>画像が未選択です</Text>
                  </View>
                )}
                <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#fff', paddingVertical: 10, borderRadius: 12, marginTop: 8 }}>
                  <Text style={{ textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>画像を選択</Text>
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
      </View>
    </Modal>
  );
}

