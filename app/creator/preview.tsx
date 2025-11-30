import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useRelationship } from '../../hooks/useRelationship';
import { AdventCanvas } from '../../components/AdventCanvas';
import { useEntries } from '../../hooks/useEntries';
import { getSignedUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

function buildHotspots(totalDays: number) {
  const cols = 4;
  const gapX = 0.02;
  const gapY = 0.02;
  const areaW = 0.8; // 横80%に並べる
  const areaX = 0.1;
  const w = (areaW - (cols - 1) * gapX) / cols;
  const h = 0.08; // 縦サイズ
  const top = 0.12;
  const hotspots: { day: number; x: number; y: number; w: number; h: number; icon: any }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = areaX + c * (w + gapX);
    const y = top + r * (h + gapY);
    hotspots.push({ day: i + 1, x, y, w, h, icon: require('../../assets/christmas-decoration_1.png') });
  }
  return hotspots;
}

export default function CreatorPreview() {
  const router = useRouter();
  const { relationshipId } = useRelationship();
  const { getByDay } = useEntries(relationshipId);
  const [totalDays, setTotalDays] = useState(24);

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

  const hotspots = useMemo(() => buildHotspots(totalDays), [totalDays]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>プレビュー（ツリー）</Text>
      <View style={{ flex: 1 }}>
        <AdventCanvas
          background={require('../../assets/christmas-tree_background.png')}
          hotspots={hotspots}
          onOpenContent={async (day) => {
            if (!relationshipId) return null;
            const entry = await getByDay(day);
            if (!entry) return null;
            if (entry.type === 'text' && entry.text_content) return { type: 'text', text: entry.text_content };
            if (entry.type === 'image' && entry.image_path) {
              try {
                const url = await getSignedUrl(entry.image_path);
                return { type: 'image', uri: { uri: url } };
              } catch { return null; }
            }
            if (entry.type === 'youtube' && entry.youtube_url) return { type: 'link', title: 'YouTube', url: entry.youtube_url };
            if (entry.type === 'link' && entry.link_url) return { type: 'link', url: entry.link_url };
            return null;
          }}
        />
      </View>
      <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, marginTop: 12 }}>
        <Text style={{ textAlign: 'center', color: '#fff' }}>戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

