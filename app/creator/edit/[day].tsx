import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Alert, ScrollView } from 'react-native';
import { useRelationship } from '../../../hooks/useRelationship';
import { useEntries } from '../../../hooks/useEntries';
import { uploadImageForDay } from '../../../lib/storage';

type TypeOption = 'text' | 'image' | 'youtube' | 'link';

export default function EditDayScreen() {
  const router = useRouter();
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = useMemo(() => Number(day), [day]);
  const { relationshipId } = useRelationship();
  const { upsert } = useEntries(relationshipId);

  const [type, setType] = useState<TypeOption>('text');
  const [message, setMessage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const onSave = async () => {
    if (!relationshipId) return;
    try {
      setSaving(true);
      let image_path: string | null = null;
      if (type === 'image' && imageUri) {
        image_path = await uploadImageForDay({ relationshipId, day: dayNumber, uri: imageUri });
      }
      await upsert({
        relationship_id: relationshipId,
        day: dayNumber,
        type,
        text_content: type === 'text' ? message : null,
        image_path: type === 'image' ? image_path : null,
        youtube_url: type === 'youtube' ? youtubeUrl : null,
        link_url: type === 'link' ? linkUrl : null,
        created_at: '' as any, // ignored by upsert typing; server will set
        updated_at: '' as any,
        id: '' as any,
      } as any);
      Alert.alert('保存しました');
      router.back();
    } catch (e: any) {
      Alert.alert('保存に失敗しました', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-christmas-night p-4">
      <Text className="text-white text-2xl font-bold mb-4">{dayNumber}日目の編集</Text>

      <View className="flex-row gap-3 mb-4">
        {(['text', 'image', 'youtube', 'link'] as TypeOption[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setType(t)}
            className={`px-4 py-2 rounded-xl ${type === t ? 'bg-white' : 'bg-white/10'}`}
          >
            <Text className={type === t ? 'text-christmas-red font-semibold' : 'text-white'}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'text' && (
        <TextInput
          multiline
          placeholder="メッセージ"
          placeholderTextColor="#94a3b8"
          className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 min-h-[140px]"
          value={message}
          onChangeText={setMessage}
        />
      )}

      {type === 'image' && (
        <View>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: 240, borderRadius: 12 }} />
          ) : (
            <View className="bg-white/10 rounded-xl items-center justify-center" style={{ height: 160 }}>
              <Text className="text-white/70">画像が未選択です</Text>
            </View>
          )}
          <TouchableOpacity onPress={pickImage} className="mt-3 bg-white/90 py-3 rounded-xl">
            <Text className="text-center text-christmas-red font-semibold">画像を選択</Text>
          </TouchableOpacity>
        </View>
      )}

      {type === 'youtube' && (
        <TextInput
          placeholder="YouTubeのURL"
          placeholderTextColor="#94a3b8"
          className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20"
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          autoCapitalize="none"
        />
      )}

      {type === 'link' && (
        <TextInput
          placeholder="リンクURL（ギフト/外部サイトなど）"
          placeholderTextColor="#94a3b8"
          className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20"
          value={linkUrl}
          onChangeText={setLinkUrl}
          autoCapitalize="none"
        />
      )}

      <TouchableOpacity disabled={saving} onPress={onSave} className="mt-6 bg-christmas-green py-3 rounded-xl">
        <Text className="text-center text-white font-semibold">{saving ? '保存中...' : '保存する'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
