import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { DoorCard } from './DoorCard';

type Props = {
  totalDays: number;
  isUnlocked: (day: number) => boolean;
  isToday?: (day: number) => boolean;
  onPressDay: (day: number) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

export function CalendarGrid({ totalDays, isUnlocked, isToday, onPressDay, header, footer }: Props) {
  const data = useMemo(() => Array.from({ length: totalDays }, (_, i) => i + 1), [totalDays]);

  return (
    <View style={{ flex: 1 }}>
      {header}
      <FlatList
        data={data}
        keyExtractor={(d) => String(d)}
        numColumns={4}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 / 4 }}>
            <DoorCard day={item} unlocked={isUnlocked(item)} isToday={isToday?.(item)} onPress={() => onPressDay(item)} />
          </View>
        )}
      />
      {footer}
    </View>
  );
}
