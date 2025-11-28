import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useFirstRun } from '../hooks/useFirstRun';

export default function Onboarding() {
  const router = useRouter();
  const { markSeen } = useFirstRun();

  const goCreate = async () => {
    await markSeen();
    router.replace('/auth');
  };

  const goOpen = async () => {
    await markSeen();
    // 共有リンクは外部から開く想定。ヒントだけ出してホームへ。
    router.replace('/pair');
  };

  return (
    <ScrollView className="flex-1 bg-christmas-night p-6">
      <View className="items-center mt-12">
        <Text className="text-4xl text-white font-bold">🎄 Couple Advent</Text>
        <Text className="text-white/80 mt-3 text-center">
          二人だけのアドベントカレンダーを作って、
          毎日ひとつのワクワクを贈ろう。
        </Text>
      </View>

      <View className="mt-10 gap-4">
        <View className="bg-white/10 rounded-2xl p-4 border border-white/10">
          <Text className="text-white text-lg">✨ 14 / 24 / 30日の中から選択</Text>
          <Text className="text-white/70 mt-1">当日まで開封ロック（JST）＆未開封は繰越OK</Text>
        </View>
        <View className="bg-white/10 rounded-2xl p-4 border border-white/10">
          <Text className="text-white text-lg">💌 写真 / テキスト / リンク</Text>
          <Text className="text-white/70 mt-1">旅行やギフトのURLも可愛く届けられる</Text>
        </View>
        <View className="bg-white/10 rounded-2xl p-4 border border-white/10">
          <Text className="text-white text-lg">🔗 共有はワンタップ</Text>
          <Text className="text-white/70 mt-1">受け取る側は未登録のまま開封できます</Text>
        </View>
      </View>

      <View className="mt-10 gap-3">
        <TouchableOpacity onPress={goCreate} className="bg-christmas-green py-4 rounded-2xl">
          <Text className="text-center text-white text-lg font-semibold">アドベントを作る</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goOpen} className="bg-white/10 py-4 rounded-2xl">
          <Text className="text-center text-white text-lg">共有リンクを開く</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

