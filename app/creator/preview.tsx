import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useRelationship } from '../../hooks/useRelationship';
import { AdventPreview } from '../../components/AdventPreview';
import { supabase } from '../../lib/supabase';

export default function CreatorPreview() {
  const router = useRouter();
  const { relationshipId } = useRelationship();
  const [totalDays, setTotalDays] = useState(24);
  const [backgroundKey, setBackgroundKey] = useState('background_1');
  const [styleKey, setStyleKey] = useState('box_white');

  useEffect(() => {
    (async () => {
      if (!relationshipId) return;
      const { data } = await supabase
        .from('relationships')
        .select('total_days, background_key, style_key')
        .eq('id', relationshipId)
        .single();
      if (data?.total_days) setTotalDays(data.total_days);
      if (data?.background_key) setBackgroundKey(data.background_key);
      if (data?.style_key) setStyleKey(data.style_key);
    })();
  }, [relationshipId]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>プレビュー</Text>
      <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
        <AdventPreview
          backgroundKey={backgroundKey}
          styleKey={styleKey}
          totalDays={totalDays}
          onPressDay={(day) => router.push(`/creator/edit/${day}`)}
        />
      </View>
      <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, marginTop: 12 }}>
        <Text style={{ textAlign: 'center', color: '#fff' }}>戻る</Text>
      </TouchableOpacity>
    </View>
  );
}
