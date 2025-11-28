import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useRelationship } from '../hooks/useRelationship';
import { supabase } from '../lib/supabase';
import { jstDate, isDecemberJST } from '../constants/dates';

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

  useEffect(() => {
    if (!session) router.replace('/auth');
  }, [session, router]);

  useEffect(() => {
    (async () => {
      if (!relationshipId) return;
      const { data } = await supabase
        .from('relationships')
        .select('total_days')
        .eq('id', relationshipId)
        .single();
      if (data?.total_days) setTotalDays(data.total_days);
    })();
  }, [relationshipId]);

  const data = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => ({ day: d, unlocked: isUnlocked(d) })),
    [totalDays]
  );

  return (
    <View className="flex-1 bg-christmas-night p-4">
      <Text className="text-white text-3xl font-bold mb-1">🎁 Advent Calendar</Text>
      <Text className="text-white/70 mb-2">JSTで今日まで開封できます</Text>
      {!relationshipId && (
        <Text className="text-red-300 mb-2">ペアリングが未完了です。戻って設定してください。</Text>
      )}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.day)}
        numColumns={4}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            disabled={!item.unlocked}
            style={{ flex: 1 / 4 }}
            onPress={() => router.push(`/door/${item.day}`)}
          >
            <View
              className={`aspect-square rounded-xl items-center justify-center ${
                item.unlocked ? 'bg-white/90' : 'bg-white/10'
              }`}
            >
              <Text className={`text-2xl font-bold ${item.unlocked ? 'text-christmas-red' : 'text-white/40'}`}>
                {item.day}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
