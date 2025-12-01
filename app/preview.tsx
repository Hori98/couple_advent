import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useRelationship } from '../hooks/useRelationship';
import { useEntries, Entry } from '../hooks/useEntries';
import { CalendarGrid } from '../components/CalendarGrid';
import { ContentModal } from '../components/ContentModal';
import { getSignedUrl } from '../lib/storage';

let LottieView: any = null;
try {
  // Optional: lottie-react-native (install via `npx expo install lottie-react-native`)
  // @ts-ignore
  LottieView = require('lottie-react-native').default;
} catch {}

function isUnlockedPreview(day: number) {
  return true; // Preview mode: always unlocked
}

export default function ReceiverPreview() {
  const { relationshipId } = useRelationship();
  const { getByDay, entries, fetchAll } = useEntries(relationshipId);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState<any | null>(null);
  const [playingAnim, setPlayingAnim] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalDays = useMemo(() => {
    // Use max day from entries or default 24 for preview
    const max = entries.reduce((m, e) => Math.max(m, e.day), 0);
    return Math.max(24, max);
  }, [entries]);

  const onPressDay = async (day: number) => {
    setOpenDay(day);
    setPlayingAnim(true);
    // load data while animation plays
    let entry: Entry | null = await getByDay(day);
    if (!entry) {
      setContent(null);
    } else if (entry.type === 'text') {
      setContent({ type: 'text', text: entry.text_content || '' });
    } else if (entry.type === 'image' && entry.image_path) {
      try {
        const url = await getSignedUrl(entry.image_path);
        setContent({ type: 'image', uri: { uri: url } });
      } catch {
        setContent(null);
      }
    } else if (entry.type === 'youtube' && entry.youtube_url) {
      setContent({ type: 'link', title: 'YouTube', url: entry.youtube_url });
    } else if (entry.type === 'link' && entry.link_url) {
      setContent({ type: 'link', url: entry.link_url });
    } else {
      setContent(null);
    }
    // show modal after short animation
    setTimeout(() => {
      setPlayingAnim(false);
      setModalVisible(true);
    }, 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>プレビューモード（受け取り体験）</Text>
      <CalendarGrid totalDays={totalDays} isUnlocked={isUnlockedPreview} onPressDay={onPressDay} />

      {/* Opening animation overlay */}
      {playingAnim && (
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          {LottieView ? (
            <LottieView source={require('../assets/gift-box_opening_animation.json')} autoPlay loop={false} style={{ width: 260, height: 260 }} />
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
      )}

      {openDay != null && content && (
        <ContentModal visible={modalVisible} onClose={() => { setModalVisible(false); setOpenDay(null); }} content={content} />
      )}

      <TouchableOpacity onPress={() => setPlayingAnim(false)} style={{ position: 'absolute', right: 16, bottom: 16, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}>
        <Text style={{ color: '#fff' }}>閉じる</Text>
      </TouchableOpacity>
    </View>
  );
}
