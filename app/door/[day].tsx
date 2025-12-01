import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useRelationship } from '../../hooks/useRelationship';
import { useEntries, Entry } from '../../hooks/useEntries';
import { getSignedUrl } from '../../lib/storage';
import { GiftCard } from '../../components/GiftCard';
import { supabase } from '../../lib/supabase';
import { MotiView } from 'moti';

let LottieView: any = null;
try {
  LottieView = require('lottie-react-native').default;
} catch {}

type Mode = 'live' | 'preview';
type Phase = 'loading' | 'animating' | 'content';
const ANIMATION_DURATION = 1100;

export default function DoorDetail() {
  const router = useRouter();
  const { day, preview } = useLocalSearchParams<{ day: string; preview?: string }>();
  const dayNumber = useMemo(() => Number(day), [day]);
  const { relationshipId } = useRelationship();
  const { getByDay } = useEntries(relationshipId);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const mode: Mode = preview ? 'preview' : 'live';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!relationshipId) return;
      setPhase('loading');
      try {
        const e = await getByDay(dayNumber);
        if (cancelled) return;
        setEntry(e);
        if (e?.image_path) {
          try {
            const url = await getSignedUrl(e.image_path);
            if (!cancelled) setSignedUrl(url);
          } catch {}
        }
        // ログは live のときのみ
        try {
          if (mode === 'live' && relationshipId) {
            await supabase.rpc('log_open_event', { p_relationship: relationshipId, p_day: dayNumber });
          }
        } catch {}
        setPhase('animating');
        setTimeout(() => { if (!cancelled) setPhase('content'); }, ANIMATION_DURATION);
      } finally {
        // keep phase change for anim/content
      }
    })();
    return () => { cancelled = true; };
  }, [relationshipId, dayNumber, getByDay, mode]);

  if (phase === 'loading') {
    return (
      <View className="flex-1 bg-christmas-night items-center justify-center">
        <ActivityIndicator color="#fff" />
        <Text className="text-white mt-2">読み込み中...</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-white/10 px-4 py-2 rounded-xl">
          <Text className="text-white">戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 bg-christmas-night items-center justify-center">
        <Text className="text-white mt-2">コンテンツがまだありません</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-white/10 px-4 py-2 rounded-xl">
          <Text className="text-white">戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === 'animating') {
    return (
      <View className="flex-1 bg-christmas-night items-center justify-center">
        {LottieView ? (
          <LottieView source={require('../../assets/gift-box_opening_animation.json')} autoPlay loop={false} style={{ width: 260, height: 260 }} />
        ) : (
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 600 }}
            style={{ width: 140, height: 140, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <ActivityIndicator color="#fff" />
            <Text style={{ color: '#fff', marginTop: 8 }}>開封中...</Text>
          </MotiView>
        )}
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
      {entry.type === 'video' && (
        <View className="bg-white/5 rounded-xl p-4 border border-white/10">
          {signedUrl ? (
            <Text className="text-white/80">動画の再生は後で expo-av で実装予定です（URL取得済み）</Text>
          ) : (
            <Text className="text-white/70">動画を準備中...</Text>
          )}
        </View>
      )}
      {entry.type === 'audio' && (
        <View className="bg-white/5 rounded-xl p-4 border border-white/10">
          {signedUrl ? (
            <Text className="text-white/80">音声の再生は後で expo-av で実装予定です（URL取得済み）</Text>
          ) : (
            <Text className="text-white/70">音声を準備中...</Text>
          )}
        </View>
      )}
      {entry.type === 'file' && (
        signedUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(signedUrl)} className="bg-white/10 px-4 py-3 rounded-xl">
            <Text className="text-white">ファイルを開く</Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-white/70">ファイルを準備中...</Text>
        )
      )}
      {entry.type === 'youtube' && entry.youtube_url && (
        <TouchableOpacity onPress={() => Linking.openURL(entry.youtube_url!)} className="bg-white/10 px-4 py-3 rounded-xl">
          <Text className="text-white">YouTubeを開く</Text>
        </TouchableOpacity>
      )}

      {entry.type === 'link' && entry.link_url && (
        <View className="mt-3">
          <GiftCard url={entry.link_url} />
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} className="mt-6 bg-white/10 py-3 rounded-xl">
        <Text className="text-center text-white">戻る</Text>
      </TouchableOpacity>
    </View>
  );
}
