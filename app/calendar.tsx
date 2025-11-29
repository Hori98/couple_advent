import { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useRelationship } from '../hooks/useRelationship';
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
  const { session } = useAuth();
  const { relationshipId } = useRelationship();
  const [totalDays, setTotalDays] = useState<number>(defaultTotal);
  const [themeName, setThemeName] = useState<string>('');

  useEffect(() => {
    if (!session) router.replace('/auth');
  }, [session, router]);

  useEffect(() => {
    (async () => {
      if (!relationshipId) return;
      const { data } = await supabase
        .from('relationships')
        .select('total_days, title')
        .eq('id', relationshipId)
        .single();
      if (data?.total_days) setTotalDays(data.total_days);
      if (data?.title) setThemeName(String(data.title));
    })();
  }, [relationshipId]);

  const data = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => ({ day: d, unlocked: isUnlocked(d) })),
    [totalDays]
  );

  const theme = pickTheme(totalDays);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
        <SnowParticles count={theme.snowCount} speed={1} />
      </View>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>🎁 Advent Calendar</Text>
      <Text style={{ color: theme.textMuted, marginBottom: 8 }}>JSTで今日まで開封できます</Text>
      {!relationshipId && (
        <Text style={{ color: '#fda4af', marginBottom: 8 }}>ペアリングが未完了です。戻って設定してください。</Text>
      )}
      <CalendarGrid
        totalDays={totalDays}
        isUnlocked={isUnlocked}
        isToday={(d) => d === jstDate()}
        theme={theme}
        onPressDay={(d) => router.push(`/door/${d}`)}
      />
    </View>
  );
}
