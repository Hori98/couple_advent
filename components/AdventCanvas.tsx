import React, { useCallback, useMemo, useState } from 'react';
import { View, ImageBackground, Image, Pressable, LayoutChangeEvent, Text } from 'react-native';
import { MotiView } from 'moti';
import { ContentModal, Content } from './ContentModal';

type Hotspot = {
  day: number;
  x: number; // 0..1
  y: number; // 0..1
  w: number; // 0..1
  h: number; // 0..1
  icon: any; // require()
};

type Props = {
  background: any; // require()
  hotspots: Hotspot[];
  onOpenContent?: (day: number) => Promise<Content | null>;
};

export function AdventCanvas({ background, hotspots, onOpenContent }: Props) {
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState<Content | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
  }, []);

  const active = openIdx != null ? hotspots[openIdx] : null;

  const positions = useMemo(() => {
    if (!layout.w || !layout.h) return [] as any[];
    return hotspots.map((hs) => {
      const left = hs.x * layout.w;
      const top = hs.y * layout.h;
      const width = hs.w * layout.w;
      const height = hs.h * layout.h;
      return { left, top, width, height };
    });
  }, [layout, hotspots]);

  return (
    <View style={{ width: '100%', borderRadius: 16, overflow: 'hidden', flex: 1 }} onLayout={onLayout}>
      {/* 背景をより大きく表示: coverで全面、中心トリミング */}
      <ImageBackground source={background} resizeMode="cover" style={{ flex: 1 }}>
        {positions.map((pos, i) => (
          <Pressable
            key={i}
            style={{ position: 'absolute', left: pos.left, top: pos.top, width: pos.width, height: pos.height }}
            onPress={async () => {
              setOpenIdx(i);
              // Try to fetch real content if provided; fallback to icon preview
              let c: Content | null = null;
              try {
                if (onOpenContent) c = await onOpenContent(hotspots[i].day);
              } catch {}
              setContent(
                c ?? { type: 'image', uri: hotspots[i].icon }
              );
              setModalVisible(true);
            }}
          >
            <MotiView from={{ scale: 1 }} animate={{ scale: 1 }} transition={{ type: 'timing', duration: 300 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={hotspots[i].icon} style={{ width: pos.width, height: pos.height }} resizeMode="contain" />
              {/* 日付番号バッジ */}
              <View style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#e11d48', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{hotspots[i].day}</Text>
              </View>
            </MotiView>
          </Pressable>
        ))}
      </ImageBackground>

      {/* 開封時の半透明オーバーレイ + 簡易アニメ */}
      {openIdx != null && (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 250 }} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      )}

      {/* コンテンツ表示（実データ or 仮画像） */}
      {active && content && (
        <ContentModal
          visible={modalVisible}
          onClose={() => { setModalVisible(false); setOpenIdx(null); setContent(null); }}
          content={content}
        />
      )}
    </View>
  );
}
