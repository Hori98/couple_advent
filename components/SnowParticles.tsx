import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { MotiView } from 'moti';

type Props = {
  count?: number;
  speed?: number; // base duration modifier
  style?: any;
};

const { width, height } = Dimensions.get('window');

export function SnowParticles({ count = 16, speed = 1, style }: Props) {
  const flakes = useMemo(() =>
    Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 6 + 4; // 4-10
      const x = Math.random() * width;
      const delay = Math.random() * 2000;
      const duration = (Math.random() * 4000 + 6000) / speed;
      const opacity = Math.random() * 0.5 + 0.3;
      return { key: i, size, x, delay, duration, opacity };
    }), [count, speed]);

  return (
    <>
      {flakes.map(({ key, size, x, delay, duration, opacity }) => (
        <MotiView
          key={key}
          from={{ translateY: -20, opacity: 0 }}
          animate={{ translateY: height + 20, opacity }}
          transition={{ loop: true, delay, duration, type: 'timing' }}
          style={[{
            position: 'absolute',
            top: 0,
            left: x,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(255,255,255,0.9)'
          }, style]}
        />
      ))}
    </>
  );
}

