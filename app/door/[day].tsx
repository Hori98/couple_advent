import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, Image, TouchableOpacity, Linking, ActivityIndicator, ScrollView } from 'react-native';
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
  const navigation = useNavigation();
  const { day, preview } = useLocalSearchParams<{ day: string; preview?: string }>();
  const dayNumber = useMemo(() => Number(day), [day]);
  const { relationshipId } = useRelationship();
  const { getByDay } = useEntries(relationshipId);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const mode: Mode = preview ? 'preview' : 'live';

  // Enforce header hidden (fallback in case Stack option isn't applied)
  useEffect(() => {
    navigation.setOptions?.({ headerShown: false, title: '' });
  }, [navigation]);

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

  const renderMedia = () => {
    switch (entry.type) {
      case 'image':
        return signedUrl ? (
          <Image source={{ uri: signedUrl }} style={{ width: '100%', height: 260, borderRadius: 16 }} resizeMode="cover" />
        ) : (
          <View style={{ height: 200, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>画像を読み込み中...</Text>
          </View>
        );
      case 'video':
        return (
          <View style={{ borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>動画</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{signedUrl ? '再生待機中（expo-avで再生予定）' : '動画を準備中...'}</Text>
          </View>
        );
      case 'audio':
        return (
          <View style={{ borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 8 }}>音声</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{signedUrl ? '再生待機中（expo-avで再生予定）' : '音声を準備中...'}</Text>
          </View>
        );
      case 'file':
        return signedUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(signedUrl)} style={{ borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>ファイルを開く</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>外部アプリで開きます</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>ファイルを準備中...</Text>
        );
      case 'youtube':
        return entry.youtube_url ? (
          <TouchableOpacity onPress={() => Linking.openURL(entry.youtube_url!)} style={{ borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>YouTubeを開く</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{entry.youtube_url}</Text>
          </TouchableOpacity>
        ) : null;
      case 'link':
        return entry.link_url ? (
          <View style={{ marginTop: 4 }}>
            <GiftCard url={entry.link_url} />
          </View>
        ) : null;
      case 'text':
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1224', padding: 16 }}>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20 }}>
          <Text style={{ color: '#fff', fontSize: 14, opacity: 0.85, marginBottom: 4 }}>Day {dayNumber}</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>あなたへのギフト</Text>
          {renderMedia()}
          {entry.text_content ? (
            <View style={{ marginTop: entry.type === 'text' ? 0 : 14 }}>
              <Text style={{ color: '#fff', fontSize: 16, lineHeight: 22 }}>{entry.text_content}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
        <Text style={{ textAlign: 'center', color: '#fff' }}>戻る</Text>
      </TouchableOpacity>
    </View>
  );
}
