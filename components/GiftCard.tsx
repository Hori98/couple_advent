import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';

type Props = {
  title?: string;
  description?: string;
  url: string;
};

export function GiftCard({ title, description, url }: Props) {
  const parsed = (() => {
    try {
      const u = new URL(url);
      return u.host.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  })();

  return (
    <View className="bg-white/10 rounded-2xl p-4 border border-white/20">
      <Text className="text-white text-lg font-semibold mb-1">{title || 'ギフトリンク'}</Text>
      <Text className="text-white/70 mb-3">{description || parsed || url}</Text>
      <TouchableOpacity
        onPress={() => Linking.openURL(url)}
        className="bg-christmas-green py-3 rounded-xl"
        activeOpacity={0.9}
      >
        <Text className="text-center text-white font-semibold">開く</Text>
      </TouchableOpacity>
    </View>
  );
}

