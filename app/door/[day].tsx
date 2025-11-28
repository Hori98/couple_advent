import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useRelationship } from '../../hooks/useRelationship';
import { useEntries, Entry } from '../../hooks/useEntries';
import { getSignedUrl } from '../../lib/storage';

export default function DoorDetail() {
  const router = useRouter();
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = useMemo(() => Number(day), [day]);
  const { relationshipId } = useRelationship();
  const { getByDay } = useEntries(relationshipId);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!relationshipId) return;
      const e = await getByDay(dayNumber);
      setEntry(e);
      if (e?.image_path) {
        try {
          const url = await getSignedUrl(e.image_path);
          setSignedUrl(url);
        } catch {}
      }
    })();
  }, [relationshipId, dayNumber, getByDay]);

  if (!entry) {
    return (
      <View className="flex-1 bg-christmas-night items-center justify-center">
        <ActivityIndicator color="#fff" />
        <Text className="text-white mt-2">コンテンツがまだありません</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-white/10 px-4 py-2 rounded-xl">
          <Text className="text-white">戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-christmas-night p-4">
      <Text className="text-white text-2xl font-bold mb-4">{dayNumber}日目</Text>
      {entry.type === 'text' && (
        <Text className="text-white text-lg leading-7">{entry.text_content}</Text>
      )}
      {entry.type === 'image' && (
        signedUrl ? (
          <Image source={{ uri: signedUrl }} style={{ width: '100%', height: 300, borderRadius: 12 }} />
        ) : (
          <Text className="text-white/70">画像を読み込み中...</Text>
        )
      )}
      {entry.type === 'youtube' && entry.youtube_url && (
        <TouchableOpacity onPress={() => Linking.openURL(entry.youtube_url!)} className="bg-white/10 px-4 py-3 rounded-xl">
          <Text className="text-white">YouTubeを開く</Text>
        </TouchableOpacity>
      )}

      {entry.type === 'link' && entry.link_url && (
        <TouchableOpacity onPress={() => Linking.openURL(entry.link_url!)} className="bg-white/10 px-4 py-3 rounded-xl mt-3">
          <Text className="text-white">リンクを開く</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-white/10 py-3 rounded-xl">
        <Text className="text-center text-white">戻る</Text>
      </TouchableOpacity>
    </View>
  );
}
