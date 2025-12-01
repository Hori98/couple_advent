import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useRelationship } from '../hooks/useRelationship';
import { useEntries } from '../hooks/useEntries';
import { getPreviewSnapshot, clearPreviewSnapshot } from '../lib/drafts';
import { AdventPreview } from '../components/AdventPreview';
import { supabase } from '../lib/supabase';
import { jstDate, isDecemberJST } from '../constants/dates';
import { pickTheme } from '../constants/themes';
import { CalendarGrid } from '../components/CalendarGrid';
import { SnowParticles } from '../components/SnowParticles';

const defaultTotal = 24;

function isUnlocked(day: number) {
  // Allow all outside December for dev; lock by JST day in December
  if (!isDecemberJST()) return true;
  return day <= jstDate();
}

export default function CalendarScreen() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { relationshipId } = useRelationship();
  const { entries, fetchAll } = useEntries(relationshipId);
  const [totalDays, setTotalDays] = useState<number>(defaultTotal);
  const [themeName, setThemeName] = useState<string>('');
  const [backgroundKey, setBackgroundKey] = useState<string>('background_1');
  const [styleKey, setStyleKey] = useState<string>('box_white');
  const [openedDays, setOpenedDays] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    if (!session && !preview) router.replace('/auth');
  }, [session, router]);

  useEffect(() => {
    (async () => {
      if (!relationshipId) { setHydrated(true); return; }
      const { data } = await supabase
        .from('relationships')
        .select('total_days, title, background_key, style_key')
        .eq('id', relationshipId)
        .single();
      if (data?.total_days) setTotalDays(data.total_days);
      if (data?.title) setThemeName(String(data.title));
      if (data?.background_key) setBackgroundKey(data.background_key);
      if (data?.style_key) setStyleKey(data.style_key);
      setHydrated(true);
    })();
  }, [relationshipId]);

  useEffect(() => { if (relationshipId) fetchAll(); }, [relationshipId, fetchAll]);

  const fetchOpened = useCallback(async () => {
    if (!relationshipId) return;
    const { data, error } = await supabase
      .from('open_events')
      .select('day')
      .eq('relationship_id', relationshipId);
    if (!error && data) {
      const days = Array.from(new Set((data as any[]).map((d) => d.day as number)));
      setOpenedDays(days);
    }
  }, [relationshipId]);

  useFocusEffect(
    useCallback(() => {
      fetchOpened();
      return () => {};
    }, [fetchOpened])
  );

  // Override with preview snapshot when in preview mode
  useEffect(() => {
    (async () => {
      if (!preview) return;
      const snap = await getPreviewSnapshot();
      if (snap) {
        setBackgroundKey(snap.background_key);
        setStyleKey(snap.style_key);
        setTotalDays(snap.total_days);
        // keep snapshot for navigation back/forth; caller may clear later if needed
      }
      setHydrated(true);
    })();
  }, [preview]);

  // Header title control for preview mode
  useEffect(() => {
    try {
      if (preview) {
        // @ts-ignore: expo-router navigation options
        navigation.setOptions?.({ title: 'プレビュー', headerBackTitleVisible: false, headerBackTitle: '' });
      }
    } catch {}
  }, [preview, navigation]);

  const data = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => ({ day: d, unlocked: preview ? true : isUnlocked(d) })),
    [totalDays, preview]
  );

  const theme = pickTheme(totalDays);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: '#fff', marginTop: 8 }}>準備中...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <SnowParticles count={theme.snowCount} speed={1} />
      </View>
      {/* Remove inline titles/messages; rely on header title instead */}
      {preview ? (
        <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
          <AdventPreview
            backgroundKey={backgroundKey}
            styleKey={styleKey}
            totalDays={totalDays}
            completedDays={entries.map(e => e.day)}
            onPressDay={(d) => router.push(`/door/${d}?preview=1`)}
          />
        </View>
      ) : (
          <CalendarGrid
            totalDays={totalDays}
            isUnlocked={(d) => isUnlocked(d)}
            isToday={(d) => d === jstDate()}
            isOpened={(d) => openedDays.includes(d)}
            theme={theme}
            onPressDay={(d) => router.push(`/door/${d}`)}
          />
        )}
      </View>
  );
}
