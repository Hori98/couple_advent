import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';

type Props = {
  day: number;
  unlocked: boolean;
  onPress?: () => void;
};

export function DoorCard({ day, unlocked, onPress }: Props) {
  const [opened, setOpened] = useState(false);
  const [wobble, setWobble] = useState(0);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (unlocked) {
          if (!opened) setOpened(true);
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
          rotateY: opened ? '-160deg' : '0deg',
          scale: opened ? 1.02 : 1,
          rotateZ: wobble ? ['0deg', '-3deg', '3deg', '0deg'] : '0deg',
        }}
        transition={{ type: 'timing', duration: 500 }}
        style={{
          aspectRatio: 1,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: unlocked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.12)',
          borderWidth: 2,
          borderColor: unlocked ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.2)',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
        }}
      >
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: unlocked ? '#e11d48' : 'rgba(255,255,255,0.2)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
        }}>
          <Text style={{ color: unlocked ? '#fff' : '#cbd5e1', fontWeight: '700' }}>{day}</Text>
        </View>
        {!unlocked && (
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Locked</Text>
        )}
      </MotiView>
    </TouchableOpacity>
  );
}
