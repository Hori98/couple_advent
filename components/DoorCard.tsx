import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { AdventTheme } from '../constants/themes';

type Props = {
  day: number;
  unlocked: boolean;
  opened?: boolean;
  isToday?: boolean;
  theme?: AdventTheme;
  onPress?: () => void;
};

export function DoorCard({ day, unlocked, opened, isToday, onPress, theme }: Props) {
  const [openedAnim, setOpenedAnim] = useState(false);
  const [wobble, setWobble] = useState(0);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (unlocked) {
          if (!openedAnim) setOpenedAnim(true);
          onPress?.();
        } else {
          setWobble((w) => w + 1);
        }
      }}
      style={{ flex: 1 }}
    >
      <MotiView
        from={{ rotateY: '0deg', scale: 1, rotateZ: '0deg' }}
        animate={{
          rotateY: openedAnim ? '-160deg' : '0deg',
          scale: openedAnim ? 1.02 : 1,
          rotateZ: wobble ? ['0deg', '-3deg', '3deg', '0deg'] : '0deg',
        }}
        transition={{ type: 'timing', duration: 500 }}
        style={{
          aspectRatio: 1,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: unlocked ? (theme?.cardBgUnlocked ?? 'rgba(255,255,255,0.95)') : (theme?.cardBgLocked ?? 'rgba(255,255,255,0.12)'),
          borderWidth: 2,
          borderColor: unlocked ? (theme?.borderColor ?? 'rgba(245,158,11,0.8)') : 'rgba(255,255,255,0.2)',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
        }}
      >
        {opened && (
          <View style={{ position: 'absolute', inset: 0, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.18)' }} />
        )}
        {isToday && (
          <MotiView
            from={{ opacity: 0.3, scale: 0.96 }}
            animate={{ opacity: 0.75, scale: 1 }}
            transition={{ type: 'timing', duration: 1200, loop: true }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              borderColor: theme?.borderColor ?? 'rgba(245,158,11,0.6)',
              borderWidth: 2,
            }}
          />
        )}
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: unlocked ? (theme?.badgeBg ?? '#e11d48') : 'rgba(255,255,255,0.2)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
        }}>
          <Text style={{ color: unlocked ? '#fff' : '#cbd5e1', fontWeight: '700' }}>{day}</Text>
        </View>
        {!unlocked && (
          <Text style={{ color: theme?.textMuted ?? 'rgba(255,255,255,0.5)', fontSize: 12 }}>Locked</Text>
        )}
      </MotiView>
    </TouchableOpacity>
  );
}
