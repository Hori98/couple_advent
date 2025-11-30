import React, { useCallback, useMemo, useState } from 'react';
import { ImageBackground, Image, Pressable, Text, View, LayoutChangeEvent } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

type Props = {
  backgroundKey: string; // e.g., background_1, background_vertical_2
  styleKey: string; // e.g., box_red | box_green | box_white
  totalDays: number; // 1..30
  onPressDay?: (day: number) => void;
  completedDays?: number[]; // days that have content
};

const backgroundMap: Record<string, any> = {
  background_1: require('../assets/background_1.jpg'),
  background_2: require('../assets/background_2.jpg'),
  background_3: require('../assets/background_3.jpg'),
  background_vertical_1: require('../assets/background_vertical_1.jpg'),
  background_vertical_2: require('../assets/background_vertical_2.jpg'),
  background_vertical_3: require('../assets/background_vertical_3.jpg'),
};

const boxImageMap: Record<string, any> = {
  box_red: require('../assets/box_red.png'),
  box_green: require('../assets/box_green.png'),
  box_white: require('../assets/box_white.png'),
};

function colorForStyle(styleKey: string): string | null {
  if (styleKey === 'box_red') return '#b91c1c';
  if (styleKey === 'box_green') return '#166534';
  if (styleKey === 'box_white') return 'rgba(255,255,255,0.92)';
  return null;
}

export function AdventPreview({ backgroundKey, styleKey, totalDays, onPressDay, completedDays }: Props) {
  // Number rendering style toggle:
  // - Set to 'svg' for gold-outline + white fill via react-native-svg (default)
  // - Set to 'font' to render with a slim decorative font (see notes below)
  const NUMBER_STYLE: 'svg' | 'font' = 'font';
  // Note for 'font' mode:
  // - To try decorative fonts (Cinzel/Playfair/etc), install expo-font and load fonts at app root.
  // - Then set a fontFamily below (e.g., 'Cinzel_600SemiBold'). Keep this code path commented if not using expo-font.
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ w: width, h: height });
  }, []);

  const cols = 4;
  const rows = Math.ceil(Math.max(1, Math.min(30, totalDays)) / cols);
  // icon-based stylesは廃止。未対応キーは白ボックスにフォールバック

  const boxes = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);

  const positions = useMemo(() => {
    if (!layout.w || !layout.h) return [] as { left: number; top: number; size: number }[];
    // 背景の向きに応じて余白・密度を調整
    const isVertical = /vertical/i.test(backgroundKey);
    const marginH = layout.w * (isVertical ? 0.05 : 0.08);
    const marginV = layout.h * (isVertical ? 0.06 : 0.12);
    const gridW = layout.w - marginH;
    const gridH = layout.h - marginV;
    const cellW = gridW / cols;
    const cellH = gridH / rows;
    const size = Math.min(cellW, cellH) * (isVertical ? 0.9 : 0.85); // タップ領域を広めに
    const offsetX = (layout.w - cols * cellW) / 2 + (cellW - size) / 2;
    const offsetY = (layout.h - rows * cellH) / 2 + (cellH - size) / 2;
    return boxes.map((day) => {
      const idx = day - 1;
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      return {
        left: c * cellW + offsetX,
        top: r * cellH + offsetY,
        size,
      };
    });
  }, [layout, rows, cols, boxes]);

  const bg = backgroundMap[backgroundKey] ?? backgroundMap.background_1;

  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }} onLayout={onLayout}>
      <ImageBackground source={bg} resizeMode="cover" style={{ flex: 1 }}>
        {positions.map((pos, i) => (
          <Pressable
            key={i}
            style={{ position: 'absolute', left: pos.left, top: pos.top, width: pos.size, height: pos.size }}
            onPress={() => onPressDay?.(i + 1)}
          >
            <Image source={boxImageMap[styleKey] ?? boxImageMap.box_white} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
              {NUMBER_STYLE === 'svg' ? (
                <Svg width={pos.size} height={pos.size}>
                  <SvgText
                    x={pos.size / 2}
                    y={pos.size / 2}
                    fill="#ffffff"
                    stroke="#d4af37"
                    strokeWidth={Math.max(0.5, pos.size * 0.03)}
                    fontWeight="500"
                    fontSize={Math.max(14, pos.size * 0.36)}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {String(i + 1)}
                  </SvgText>
                </Svg>
              ) : (
                // Font-based slim number (toggle NUMBER_STYLE to 'font').
                // For decorative fonts: install and load via expo-font, then set fontFamily below.
                // Example:
                //   import { useFonts, Cinzel_600SemiBold } from '@expo-google-fonts/cinzel';
                //   const [fontsLoaded] = useFonts({ Cinzel_600SemiBold });
                //   ... fontFamily: fontsLoaded ? 'Cinzel_600SemiBold' : undefined
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '600',
                    fontFamily: 'Cinzel_600SemiBold',
                    fontSize: Math.max(14, pos.size * 0.38),
                    textShadowColor: 'rgba(0,0,0,0.35)',
                    textShadowRadius: 3,
                  }}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            {completedDays?.includes(i + 1) && (
              <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: Math.max(10, pos.size * 0.18) }}>✓</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ImageBackground>
    </View>
  );
}
